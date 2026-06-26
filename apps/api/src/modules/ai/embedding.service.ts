import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OpenAI } from "openai";
import { PrismaService } from "../../prisma/prisma.service";
import { ProcessedEmail } from "./ai.service";
import pLimit from "p-limit";

export interface HistoricalContext {
  subject: string;
  fromEmail: string;
  category: string;
  miniSummary: string;
  receivedAt: Date;
  daysAgo: number;
  similarity: number;
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly embeddingClients: OpenAI[] = [];
  private readonly embeddingModel = "gemini-embedding-001";
  private currentKeyIndex = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const keysMap = new Set<string>();

    // Scan process.env for GOOGLE_AI_API_KEY, GEMINI_API_KEY, and any numbered variants (e.g. GOOGLE_AI_API_KEY_2, GEMINI_API_KEY_3)
    Object.keys(process.env).forEach((envKey) => {
      if (/^(GOOGLE_AI_API_KEY|GEMINI_API_KEY)(_\d+)?$/.test(envKey)) {
        const val = process.env[envKey]?.trim();
        if (val && val !== "disabled" && !val.startsWith("your-")) {
          keysMap.add(val);
        }
      }
    });

    const keys = Array.from(keysMap);

    if (keys.length === 0) {
      this.logger.warn("No Gemini/Google AI API keys set — embeddings will be disabled");
    } else {
      this.logger.log(`Initialized embedding service with ${keys.length} API key(s) (auto-detected)`);
    }

    this.embeddingClients = keys.map(
      (key) =>
        new OpenAI({
          apiKey: key,
          baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
        }),
    );
  }

  /**
   * Generate an embedding vector for a piece of text.
   * Returns null if embeddings are disabled (no API key).
   */
  async embed(text: string): Promise<number[] | null> {
    if (this.embeddingClients.length === 0) return null;

    // Pick client in round-robin fashion
    const client = this.embeddingClients[this.currentKeyIndex];
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.embeddingClients.length;

    try {
      const response = await client.embeddings.create({
        model: this.embeddingModel,
        input: text.slice(0, 8000), // Google's token limit
        dimensions: 768,
      });
      return response.data[0].embedding;
    } catch (error) {
      this.logger.error(`Embedding generation failed: ${error?.message ?? error}`);
      
      // Fallback: try next key in list if we have multiple
      if (this.embeddingClients.length > 1) {
        this.logger.warn("Attempting embedding with fallback key...");
        const fallbackClient = this.embeddingClients[this.currentKeyIndex];
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.embeddingClients.length;
        try {
          const response = await fallbackClient.embeddings.create({
            model: this.embeddingModel,
            input: text.slice(0, 8000),
            dimensions: 768,
          });
          return response.data[0].embedding;
        } catch (fallbackError) {
          this.logger.error(`Embedding generation failed on fallback: ${fallbackError?.message ?? fallbackError}`);
        }
      }
      return null;
    }
  }

  /**
   * Store embeddings for every email in a brief.
   * Runs with p-limit(5) to stay within Google's 100 RPM free tier.
   * Silently skips if GOOGLE_AI_API_KEY is not set.
   */
  async storeEmailEmbeddings(
    userId: string,
    briefId: string,
    emails: ProcessedEmail[],
  ): Promise<void> {
    if (this.embeddingClients.length === 0) {
      this.logger.warn("Skipping embedding storage — no Gemini API keys configured");
      return;
    }

    const limit = pLimit(5);
    let stored = 0;

    await Promise.all(
      emails.map((email) =>
        limit(async () => {
          try {
            // Text to embed: compact but semantically rich combination
            const text = [
              email.subject,
              email.fromEmail,
              email.analysis.category,
              email.analysis.suggestedSummary,
              email.analysis.keyPoints.join(" "),
            ]
              .filter(Boolean)
              .join(" | ");

            const embedding = await this.embed(text);
            if (!embedding) return;

            const vectorLiteral = `[${embedding.join(",")}]`;

            await this.prisma.$executeRaw`
              INSERT INTO email_embeddings (
                id,
                "userId",
                "briefId",
                "emailId",
                subject,
                "fromEmail",
                category,
                priority,
                "miniSummary",
                "receivedAt",
                embedding
              )
              VALUES (
                gen_random_uuid(),
                ${userId},
                ${briefId},
                ${email.id},
                ${email.subject ?? ""},
                ${email.fromEmail ?? ""},
                ${email.analysis.category},
                ${email.analysis.priority},
                ${email.analysis.suggestedSummary ?? ""},
                ${email.receivedAt},
                ${vectorLiteral}::vector
              )
              ON CONFLICT DO NOTHING
            `;
            stored++;
          } catch (error) {
            this.logger.warn(
              `Failed to store embedding for email "${email.subject}": ${error?.message ?? error}`,
            );
          }
        }),
      ),
    );

    this.logger.log(`Stored ${stored}/${emails.length} email embeddings for brief ${briefId}`);
  }

  /**
   * Retrieve the most semantically relevant historical emails for a user.
   * Excludes emails from the last hour (current brief window).
   * Returns empty array if embeddings are disabled or no history exists.
   */
  async getHistoricalContext(
    userId: string,
    limit = 8,
    daysBack = 7,
  ): Promise<HistoricalContext[]> {
    if (this.embeddingClients.length === 0) return [];

    try {
      // Semantic query biased towards actionable, unresolved items
      const queryText =
        "urgent action required deadline meeting follow-up unresolved important pending review";
      const queryEmbedding = await this.embed(queryText);
      if (!queryEmbedding) return [];

      const vectorLiteral = `[${queryEmbedding.join(",")}]`;
      const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

      const rows = await this.prisma.$queryRaw<
        Array<{
          subject: string;
          fromEmail: string;
          category: string;
          priority: number;
          miniSummary: string;
          receivedAt: Date;
          createdAt: Date;
          similarity: number;
        }>
      >`
        SELECT
          subject,
          "fromEmail",
          category,
          priority,
          "miniSummary",
          "receivedAt",
          "createdAt",
          1 - (embedding <=> ${vectorLiteral}::vector) AS similarity
        FROM email_embeddings
        WHERE
          "userId" = ${userId}
          AND "createdAt" >= ${cutoffDate}
          AND "createdAt" < NOW() - INTERVAL '1 hour'
          AND embedding IS NOT NULL
        ORDER BY embedding <=> ${vectorLiteral}::vector
        LIMIT ${limit}
      `;

      return rows.map((row) => ({
        subject: row.subject,
        fromEmail: row.fromEmail,
        category: row.category,
        miniSummary: row.miniSummary,
        receivedAt: row.receivedAt,
        daysAgo: Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(row.createdAt).getTime()) / (24 * 60 * 60 * 1000),
          ),
        ),
        similarity: Number(row.similarity),
      }));
    } catch (error) {
      this.logger.error(`Historical context retrieval failed: ${error?.message ?? error}`);
      return [];
    }
  }

  /**
   * Delete embeddings older than N days for a user (cleanup utility).
   */
  async pruneOldEmbeddings(userId: string, olderThanDays = 30): Promise<void> {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    const result = await this.prisma.emailEmbedding.deleteMany({
      where: { userId, createdAt: { lt: cutoff } },
    });
    if (result.count > 0) {
      this.logger.log(
        `Pruned ${result.count} old embeddings for user ${userId} (older than ${olderThanDays} days)`,
      );
    }
  }
}
