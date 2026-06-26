import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OpenAI } from "openai";
import { VoicePersona } from "@prisma/client";
import { RawEmail } from "../gmail/gmail.service";
import { HistoricalContext } from "./embedding.service";
import pLimit from "p-limit";

// Email categories for smart grouping (matches Prisma enum)
type EmailCategory =
  | "URGENT"
  | "ACTION_REQUIRED"
  | "DEADLINES"
  | "MEETINGS"
  | "IMPORTANT"
  | "PERSONAL"
  | "NEWSLETTERS"
  | "PROMOTIONS"
  | "NOISE";

export interface ExtractedActionItem {
  type: "MEETING" | "TASK" | "REPLY" | "FOLLOW_UP" | "REVIEW" | "APPROVAL";
  title: string;
  description?: string;
  priority: number; // 0-100
  startsAt?: string;
  endsAt?: string;
  allDay?: boolean;
  participants?: string[];
  location?: string;
  replyIndicator?: boolean;
  links?: string[];
}

export interface EmailAnalysis {
  category: EmailCategory;
  priority: number; // 0-100
  sentiment: "positive" | "neutral" | "negative" | "urgent";
  actionRequired: boolean;
  deadline?: string;
  keyPoints: string[];
  suggestedSummary: string;
  actionItems?: ExtractedActionItem[];
}

export interface ProcessedEmail extends RawEmail {
  analysis: EmailAnalysis;
}

export interface ScriptSegment {
  type: "intro" | "category" | "email" | "outro" | "transition";
  text: string;
  emphasis?: "high" | "medium" | "low";
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: OpenAI;
  private readonly modelName: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("SARVAM_API_KEY");
    if (!apiKey) {
      this.logger.warn("SARVAM_API_KEY not set");
    }
    this.modelName = this.configService.get<string>(
      "SARVAM_TEXT_MODEL",
      "sarvam-105b",
    );

    this.client = new OpenAI({
      apiKey: apiKey || undefined,
      baseURL: this.configService.get<string>(
        "SARVAM_BASE_URL",
        "https://api.sarvam.ai/v1",
      ),
    });
    this.logger.log(`Using Sarvam text model: ${this.modelName}`);
  }

  /**
   * Helper to wrap Sarvam AI calls with retries (especially for rate limits)
   */
  private async withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    const delay = 20_000; // 20 seconds
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        const msg: string = error?.message ?? String(error);

        // Invalid credentials are permanent — retrying won't help, fail fast
        const isInvalidCredentials =
          msg.includes("401") ||
          msg.includes("403") ||
          msg.includes("API_KEY_INVALID") ||
          msg.includes("invalid credentials") ||
          msg.includes("Invalid Credentials") ||
          msg.includes("INVALID_ARGUMENT") ||
          msg.includes("API key not valid");

        if (isInvalidCredentials) {
          this.logger.error(
            `Sarvam AI API credentials invalid — not retrying: ${msg}`,
          );
          throw error;
        }

        // Rate limits are transient — retry after delay
        const isRateLimit =
          msg.includes("429") ||
          msg.includes("Quota exceeded") ||
          msg.includes("RESOURCE_EXHAUSTED");
        if (isRateLimit && i < retries - 1) {
          this.logger.warn(
            `Sarvam AI rate limit hit. Retrying in ${delay / 1000}s... (Attempt ${i + 1}/${retries})`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }
    }
    throw new Error("Max retries reached for Sarvam AI call");
  }

  /**
   * Analyze and categorize emails using Sarvam AI
   */
  async analyzeEmails(emails: RawEmail[]): Promise<ProcessedEmail[]> {
    // Process in batches of 4 to keep response length safe for Sarvam-105B JSON parsing
    const batchSize = 4;
    const batches: RawEmail[][] = [];
    for (let i = 0; i < emails.length; i += batchSize) {
      batches.push(emails.slice(i, i + batchSize));
    }

    // Process batches with limited concurrency to avoid API rate limits while maintaining performance
    // Catch errors per-batch to prevent a single transient error from failing the entire list
    const limit = pLimit(3);
    const batchResults = await Promise.all(
      batches.map((batch) =>
        limit(async () => {
          try {
            return await this.batchAnalyze(batch);
          } catch (error) {
            this.logger.error(
              `Batch analysis failed: ${error.message}. Falling back to heuristic analysis.`,
            );
            return batch.map((email) => this.getHeuristicAnalysis(email));
          }
        }),
      ),
    );

    const processedEmails: ProcessedEmail[] = batches.flatMap(
      (batch, batchIdx) =>
        batch.map((email, idx) => ({
          ...email,
          analysis:
            batchResults[batchIdx][idx] ?? this.getHeuristicAnalysis(email),
        })),
    );

    // Sort by priority (highest first)
    return processedEmails.sort(
      (a, b) => b.analysis.priority - a.analysis.priority,
    );
  }

  /**
   * Batch analyze emails with Sarvam AI — deeply detailed prompt
   */
  private async batchAnalyze(emails: RawEmail[]): Promise<EmailAnalysis[]> {
    const currentTimestamp = new Date().toISOString();
    const currentFriendlyDate = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const prompt = `You are an expert email intelligence analyst. Your job is to deeply analyze each email and extract every piece of actionable, meaningful information. Do NOT skip or gloss over anything. Be thorough and precise.

Current Timestamp: ${currentTimestamp} (${currentFriendlyDate})
Use the current timestamp to resolve any relative dates in the emails (e.g. "tomorrow", "this Friday", "next Monday").

    For each email below, produce a comprehensive JSON analysis. The output must conform to this JSON schema:
{
  "analyses": [
    {
      "category": "URGENT" | "ACTION_REQUIRED" | "DEADLINES" | "MEETINGS" | "IMPORTANT" | "PERSONAL" | "NEWSLETTERS" | "PROMOTIONS" | "NOISE",
      "priority": number (0-100),
      "sentiment": "positive" | "neutral" | "negative" | "urgent",
      "actionRequired": boolean,
      "deadline": string (ISO date/time, or empty string "" if none),
      "keyPoints": string[] (2-5 points),
      "suggestedSummary": string (2-3 detailed sentences),
      "actionItems": [
        {
          "type": "MEETING" | "TASK" | "REPLY" | "FOLLOW_UP" | "REVIEW" | "APPROVAL",
          "title": string,
          "description": string,
          "priority": number (0-100),
          "startsAt": string (ISO date/time string, or empty string "" if none),
          "endsAt": string (ISO date/time string, or empty string "" if none),
          "allDay": boolean,
          "participants": string[],
          "location": string,
          "replyIndicator": boolean,
          "links": string[]
        }
      ]
    }
  ]
}

Emails to analyze:
${emails
  .map(
    (e, i) => `
[EMAIL ${i}]
From: ${this.sanitizeContent(e.from)}
Subject: ${this.sanitizeContent(e.subject)}
Snippet: ${this.sanitizeContent(e.snippet)}
Date: ${e.receivedAt instanceof Date ? e.receivedAt.toISOString() : e.receivedAt}
Body:
${this.sanitizeContent(e.body).slice(0, 1500)}
`,
  )
  .join("\n---END EMAIL---\n")}

CRITICAL INSTRUCTIONS:
1. Return a JSON object containing a single "analyses" array field. This array must have exactly ${emails.length} objects, one per email, in the SAME order as provided.
2. Every email MUST have all fields populated. Do not skip any email.
3. If no deadline is found for an email, set "deadline" to an empty string "".
4. Be generous with keyPoints — extract everything useful, not just the obvious.
5. The suggestedSummary should be detailed enough that someone can understand the email WITHOUT reading it.
6. Extract actionItems if the email implies meetings to attend, tasks to do, replies to write, follow-ups to make, or documents to review/approve. If no action items are needed, return an empty array [].
7. DO NOT extract action items for:
   - OTP (One Time Password) / verification code emails (these are transient codes).
   - Password reset request emails (these are temporary transaction requests).
   - General AI suggestions, recommendations, tips, or options. Action items must be concrete commits, tasks, replies, or meetings requested or required, not optional suggestions or advice.
8. Extract any URLs or links in the email body that are relevant to completing the action item (e.g. calendar invite link, document link, external reference link, payment link) and populate them in the "links" array for each action item. If no links are found, return an empty array [].`;

    try {
      let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(
          () => reject(new Error("Sarvam analysis timed out")),
          60_000,
        );
      });

      const result = await this.withRetry(() =>
        Promise.race([
          this.client.chat.completions.create({
            model: this.modelName,
            messages: [{ role: "user", content: prompt }],
            response_format: {
              type: "json_object",
            },
            max_tokens: 4000,
            temperature: 0,
            reasoning_effort: null as any,
          }),
          timeoutPromise,
        ]),
      );

      if (timeoutHandle) clearTimeout(timeoutHandle);

      const responseText = result.choices[0]?.message?.content || "";
      const parsed = this.parseJson<{ analyses: EmailAnalysis[] }>(responseText);
      const analyses = parsed?.analyses || [];
      return analyses.map((analysis) => ({
        ...analysis,
        deadline:
          analysis.deadline === "" ||
          analysis.deadline === "null" ||
          analysis.deadline === "none"
            ? undefined
            : analysis.deadline,
        actionItems: Array.isArray(analysis.actionItems)
          ? analysis.actionItems.map((item) => ({
              ...item,
              startsAt:
                item.startsAt === "" ||
                item.startsAt === "null" ||
                item.startsAt === "none"
                  ? undefined
                  : item.startsAt,
              endsAt:
                item.endsAt === "" ||
                item.endsAt === "null" ||
                item.endsAt === "none"
                  ? undefined
                  : item.endsAt,
              links: Array.isArray(item.links) ? item.links.map(l => String(l).trim()).filter(Boolean) : [],
            }))
          : [],
      }));
    } catch (error) {
      this.logger.error(`Sarvam analysis failed: ${error}`);
      throw error;
    }
  }

  private sanitizeContent(text: string): string {
    if (!text) return "";
    return text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Control chars
      .replace(/<\|im_start\|>/gi, "") // Special tokens
      .replace(/<\|im_end\|>/gi, "")
      .replace(/```/g, "") // Code blocks
      .replace(/system:/gi, "System:") // prevent role spoofing
      .replace(/user:/gi, "User:")
      .replace(/assistant:/gi, "Assistant:")
      .replace(/\bignore\s+(all\s+)?previous\s+instructions?\b/gi, "[redacted]") // prompt injection
      .replace(/\bforget\s+(all\s+)?previous\s+instructions?\b/gi, "[redacted]")
      .replace(/\bact\s+as\b/gi, "[redacted]")
      .replace(/\byou\s+are\s+now\b/gi, "[redacted]")
      .slice(0, 4000); // Hard cap per field
  }

  private parseJson<T>(text: string): T {
    try {
      const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
      return JSON.parse(cleanText);
    } catch (e) {
      this.logger.error(`Failed to parse JSON (length ${text.length}): "${text}"`);
      throw e;
    }
  }

  /**
   * Generate audio script from processed emails — comprehensive briefing prompt
   */
  async generateScript(
    emails: ProcessedEmail[],
    persona: VoicePersona,
    userName?: string,
    customPrompt?: string,
    historicalContext: HistoricalContext[] = [],
  ): Promise<ScriptSegment[]> {
    const personaStyles = {
      NEWSROOM: `Professional news anchor delivering a morning intelligence briefing. Authoritative yet approachable. Use clear, precise language. Structure information hierarchically — lead with the most critical items. Use phrases like "Breaking in your inbox...", "Worth noting...", "For your awareness...". Maintain a crisp, confident cadence.`,
      FRIEND: `Warm, conversational best friend catching you up over coffee. Use "you" and "your" frequently. React naturally to the content — "Oh, this one's important!", "Heads up on this one...", "Good news though!". Be genuine and personable. Use contractions. Sound like a real person who cares about the listener's day.`,
      SPEEDSTER: `Ultra-efficient executive briefer. No fluff, no filler. Rapid-fire delivery of key facts. Lead with actions needed. Use short, punchy sentences. "Action needed:", "FYI:", "Deadline alert:". Get through everything quickly but don't skip substance. Think military briefing meets tech startup.`,
    };

    const styleInstruction = customPrompt
      ? `Custom style override: ${customPrompt}`
      : `Persona: ${personaStyles[persona]}`;

    const memoryLines =
      historicalContext.length > 0
        ? historicalContext
            .map((h) => {
              const when =
                h.daysAgo === 0
                  ? "Today (earlier)"
                  : h.daysAgo === 1
                    ? "Yesterday"
                    : `${h.daysAgo} days ago`;
              return `[${when}] From: ${h.fromEmail} | "${h.subject}" | ${h.category}\n  -> ${h.miniSummary}`;
            })
            .join("\n")
        : "";

    const memorySection = memoryLines
      ? `\n=== MEMORY: Relevant context from the past 7 days ===\n${memoryLines}\n===\nOnly reference this memory when directly relevant. Add continuity like "following up on...", "still pending from last week...". Do not invent connections.\n`
      : "";

    const prompt = `You are creating a professional AUDIO inbox briefing from processed emails.

${styleInstruction}${memorySection}

Listener's name: ${this.sanitizeContent(userName || "there")}
Today's date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

=== GOAL ===
Create a concise but high-value spoken brief with real, actionable information.

=== RULES ===
- Use only facts from the provided data. No invented details.
- Prioritize urgent + action-required emails first.
- Include deadlines, meetings, and key updates that materially affect the user's day.
- Keep it dynamic: adapt emphasis to what is actually in this inbox.
- Avoid generic filler.

=== EMAILS ===
${emails
  .map(
    (e, i) =>
      `${i + 1}. [${e.analysis.category}] From: ${this.sanitizeContent(e.from)}\n   Subject: ${this.sanitizeContent(e.subject)}\n   Priority: ${e.analysis.priority}\n   ActionRequired: ${e.analysis.actionRequired}\n   Deadline: ${e.analysis.deadline || "none"}\n   Summary: ${this.sanitizeContent(e.analysis.suggestedSummary)}\n   Key Points: ${e.analysis.keyPoints.join("; ")}\n`,
  )
  .join("\n")}

=== FORMAT ===
- Single continuous script text for TTS.
- Optional expressive tags like [warm], [serious], [upbeat], [calm].
- No markdown, no bullets, no JSON.
- 300-600 words.

=== STRUCTURE ===
1) Opening: greeting + quick inbox snapshot.
2) Critical items: urgent/action-required with clear next steps.
3) Time-sensitive items: deadlines/meetings and when.
4) Important updates: top non-urgent insights worth knowing.
5) Closing: recap top priorities.

Generate the complete script now. Return ONLY the script text.`;

    try {
      let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(
          () => reject(new Error("Script generation timed out")),
          60_000,
        );
      });

      const result = await this.withRetry(() =>
        Promise.race([
          this.client.chat.completions.create({
            model: this.modelName,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 3000,
            temperature: 0.2,
            reasoning_effort: null as any,
          }),
          timeoutPromise,
        ]),
      );

      if (timeoutHandle) clearTimeout(timeoutHandle);

      const responseText = (result.choices[0]?.message?.content || "").trim();
      if (!responseText) {
        throw new Error("Received empty script response from AI model");
      }

      // Wrap in a single ScriptSegment to maintain compatibility with Prisma schema and internal interfaces
      return [
        { type: "intro", text: responseText, emphasis: "medium" },
      ] as ScriptSegment[];
    } catch (error) {
      this.logger.error(`Script generation failed: ${error}`);
      throw error;
    }
  }

  /**
   * Generate dynamic structured summary with strict JSON schema.
   * Calendar actions are intentionally constrained to real calendar events/deadlines only.
   * Returns a human-readable text plus an embedded JSON payload marker for frontend rendering.
   */
  async generateTextSummary(
    emails: ProcessedEmail[],
    historicalContext: HistoricalContext[] = [],
  ): Promise<string> {
    if (emails.length === 0) {
      return "No calendar-relevant events found in the last 24 hours.";
    }

    const categorizedEmails = this.groupByCategory(emails);

    const historyLines =
      historicalContext.length > 0
        ? historicalContext
            .map((h) => `- [${h.daysAgo}d ago] ${h.fromEmail}: "${h.subject}" -> ${h.miniSummary}`)
            .join("\n")
        : "";

    const historyBlock = historyLines
      ? `HISTORICAL CONTEXT (past 7 days -- for continuity only):\n${historyLines}\n\n`
      : "";

    const prompt = `You are an elite executive inbox analyst.

${historyBlock}Your job:
1) Write a creative, natural, high-quality summary humans actually want to read.
2) Extract ONLY true calendar-worthy events.

Generate a JSON object conforming to this schema:
{
  "shortSummary": string,
  "sections": [
    {
      "id": string,
      "title": string,
      "description": string,
      "items": [
        {
          "title": string,
          "details": string,
          "sender": string,
          "dateTime": string,
          "importance": "high" | "medium" | "low"
        }
      ]
    }
  ],
  "calendarEvents": [
    {
      "title": string,
      "details": string,
      "sender": string,
      "startsAt": string,
      "endsAt": string,
      "allDay": boolean,
      "kind": "meeting" | "deadline" | "event",
      "confidence": "high" | "medium"
    }
  ]
}

STRICT RULES FOR calendarEvents:
- Include ONLY real calendar events with an actual date/time signal.
- Allowed: meetings/calls/interviews/demos/appointments/webinars, hard deadlines with clear date, scheduled events.
- Do NOT include generic tasks, follow-ups, alerts, status updates, login/security notifications, deployment failures, newsletters, promos, or vague "3 days left" without a concrete date.
- If no real calendar events exist, return calendarEvents: [].
- startsAt must be ISO-8601. If exact time unknown but date is known, set allDay=true and startsAt at 00:00:00Z.
- Never invent dates/times/senders. Set endsAt to empty string "" if not available.
- For items, set dateTime to empty string "" if not available.

SUMMARY STYLE RULES:
- shortSummary should feel insightful and dynamic (not robotic), 2-4 sentences.
- Mention what changed, what is urgent, and what the day ahead looks like.
- Be concise, specific, and non-repetitive.

DATA:
Total emails: ${emails.length}
Categories: ${Object.entries(categorizedEmails)
      .sort(([, a], [, b]) => b.length - a.length)
      .map(([c, l]) => `${c}:${l.length}`)
      .join(", ")}

EMAILS:
${emails
  .map(
    (e, i) =>
      `${i + 1}. [${e.analysis.category}] From: ${this.sanitizeContent(e.from)} | Subject: ${this.sanitizeContent(e.subject)} | Deadline: ${e.analysis.deadline || "null"} | ActionRequired: ${e.analysis.actionRequired} | Summary: ${this.sanitizeContent(e.analysis.suggestedSummary)} | KeyPoints: ${e.analysis.keyPoints.join("; ")}`,
  )
  .join("\n")}`;

    const textSummarySchema = {
      name: "text_summary",
      strict: true,
      schema: {
        type: "object",
        properties: {
          shortSummary: { type: "string" },
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      details: { type: "string" },
                      sender: { type: "string" },
                      dateTime: { type: "string" },
                      importance: {
                        type: "string",
                        enum: ["high", "medium", "low"],
                      },
                    },
                    required: [
                      "title",
                      "details",
                      "sender",
                      "dateTime",
                      "importance",
                    ],
                    additionalProperties: false,
                  },
                },
              },
              required: ["id", "title", "description", "items"],
              additionalProperties: false,
            },
          },
          calendarEvents: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                details: { type: "string" },
                sender: { type: "string" },
                startsAt: { type: "string" },
                endsAt: { type: "string" },
                allDay: { type: "boolean" },
                kind: {
                  type: "string",
                  enum: ["meeting", "deadline", "event"],
                },
                confidence: { type: "string", enum: ["high", "medium"] },
              },
              required: [
                "title",
                "details",
                "sender",
                "startsAt",
                "endsAt",
                "allDay",
                "kind",
                "confidence",
              ],
              additionalProperties: false,
            },
          },
        },
        required: ["shortSummary", "sections", "calendarEvents"],
        additionalProperties: false,
      },
    };

    try {
      const result = await this.withRetry(() =>
        this.client.chat.completions.create({
          model: this.modelName,
          messages: [{ role: "user", content: prompt }],
          response_format: {
            type: "json_object",
          },
          max_tokens: 3000,
          temperature: 0,
          reasoning_effort: null as any,
        }),
      );

      const responseText = result.choices[0]?.message?.content || "";
      const structured = this.parseJson<any>(responseText);

      if (!Array.isArray(structured.calendarEvents)) {
        structured.calendarEvents = [];
      } else {
        structured.calendarEvents = structured.calendarEvents.map((ev: any) => ({
          ...ev,
          endsAt:
            ev.endsAt === "" || ev.endsAt === "null" || ev.endsAt === "none"
              ? null
              : ev.endsAt,
        }));
      }

      if (Array.isArray(structured.sections)) {
        structured.sections = structured.sections.map((sec: any) => ({
          ...sec,
          items: Array.isArray(sec.items)
            ? sec.items.map((it: any) => ({
                ...it,
                dateTime:
                  it.dateTime === "" ||
                  it.dateTime === "null" ||
                  it.dateTime === "none"
                    ? null
                    : it.dateTime,
              }))
            : [],
        }));
      }

      const marker = `__INBOXFM_STRUCTURED_JSON__${JSON.stringify(structured)}`;
      return `${marker}\n${this.renderStructuredSummary(structured)}`;
    } catch (error) {
      this.logger.error(`Text summary generation failed: ${error}`);
      throw error;
    }
  }

  private renderStructuredSummary(structured: any): string {
    const shortSummary =
      typeof structured?.shortSummary === "string"
        ? structured.shortSummary
        : "Here's what matters most in your inbox.";

    const sections = Array.isArray(structured?.sections)
      ? structured.sections
      : [];

    const renderedSections = sections
      .map((section: any) => {
        const title = section?.title || "Section";
        const description = section?.description ? `*${section.description.trim()}*\n` : "";
        const items = Array.isArray(section?.items) ? section.items : [];
        const itemLines = items
          .map(
            (it: any, idx: number) =>
              `${idx + 1}. **${it?.title || "Untitled"}**${it?.sender ? ` — *${it.sender}*` : ""}${it?.dateTime ? ` (${it.dateTime})` : ""}\n   ${it?.details || ""}`,
          )
          .join("\n");

        return `## ${title}\n${description}${itemLines ? `\n${itemLines}` : ""}`.trim();
      })
      .join("\n\n");

    return [shortSummary, renderedSections]
      .filter(Boolean)
      .join("\n\n");
  }

  /**
   * Fallback text summary if AI generation fails
   */
  private generateFallbackTextSummary(emails: ProcessedEmail[]): string {
    const actionItems = emails.filter((e) => e.analysis.actionRequired);

    const fallback = {
      shortSummary: `You have ${emails.length} new emails, with ${actionItems.length} actionable items.`,
      sections: [
        {
          id: "top-emails",
          title: "Top Emails",
          description: "Highest-priority highlights.",
          items: emails.slice(0, 5).map((e) => ({
            title: e.subject,
            details: e.analysis.suggestedSummary,
            sender: e.from.split("<")[0].trim(),
            dateTime: e.analysis.deadline || null,
            importance:
              e.analysis.priority >= 80
                ? "high"
                : e.analysis.priority >= 50
                  ? "medium"
                  : "low",
            actionRequired: e.analysis.actionRequired,
            actionType: e.analysis.actionRequired ? "follow_up" : "other",
          })),
        },
      ],
      calendarEvents: emails
        .filter((e) => !!e.analysis.deadline)
        .map((e) => ({
          title: e.subject,
          details: e.analysis.suggestedSummary,
          sender: e.from.split("<")[0].trim(),
          startsAt: e.analysis.deadline as string,
          endsAt: null,
          allDay: false,
          kind: "deadline",
          confidence: "medium",
        })),
    };

    const marker = `__INBOXFM_STRUCTURED_JSON__${JSON.stringify(fallback)}`;
    return `${marker}\n${this.renderStructuredSummary(fallback)}`;
  }

  /**
   * Group emails by category
   */
  private groupByCategory(
    emails: ProcessedEmail[],
  ): Record<string, ProcessedEmail[]> {
    return emails.reduce(
      (acc, email) => {
        const cat = email.analysis.category;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(email);
        return acc;
      },
      {} as Record<string, ProcessedEmail[]>,
    );
  }

  /**
   * Heuristic analysis fallback when Gemini fails.
   * Keeps summaries useful for users instead of generic placeholders.
   */
  private getHeuristicAnalysis(email: RawEmail): EmailAnalysis {
    const subject = (email.subject || "").trim();
    const body = (email.body || "").trim();
    const from = (email.from || email.fromEmail || "Unknown sender").trim();
    const lower = `${subject} ${body}`.toLowerCase();

    const hasDeadline =
      /\b(deadline|due|expires|last date|by\s+\w+day|tomorrow|today)\b/.test(
        lower,
      );
    const hasMeeting =
      /\b(meeting|call|zoom|google meet|interview|webinar|schedule)\b/.test(
        lower,
      );
    const hasAction =
      /\b(action required|please|review|approve|submit|complete|verify|respond|reply|reconnect|urgent)\b/.test(
        lower,
      );

    const category: EmailCategory = hasDeadline
      ? "DEADLINES"
      : hasMeeting
        ? "MEETINGS"
        : hasAction
          ? "ACTION_REQUIRED"
          : "IMPORTANT";

    const priority = hasDeadline ? 80 : hasMeeting ? 70 : hasAction ? 65 : 45;

    const keyPoints: string[] = [];
    if (subject) keyPoints.push(subject);
    if (hasDeadline) keyPoints.push("Contains deadline or due-date language");
    if (hasMeeting) keyPoints.push("Contains meeting/scheduling language");
    if (hasAction) keyPoints.push("Likely requires user action");

    const bodySnippet = this.sanitizeContent(body).split(/\n|\./)[0]?.trim();
    const summary = bodySnippet
      ? `${from} sent \"${subject || "(no subject)"}\". ${bodySnippet}`
      : `${from} sent \"${subject || "(no subject)"}\".`;

    return {
      category,
      priority,
      sentiment: hasAction ? "urgent" : "neutral",
      actionRequired: hasAction || hasDeadline || hasMeeting,
      deadline: undefined,
      keyPoints: keyPoints.slice(0, 4),
      suggestedSummary: summary,
    };
  }

  /**
   * Fallback script if AI fails
   */
  private getFallbackScript(
    emails: ProcessedEmail[],
    persona: VoicePersona,
  ): ScriptSegment[] {
    const urgentCount = emails.filter(
      (e) =>
        e.analysis.category === "URGENT" ||
        e.analysis.category === "ACTION_REQUIRED",
    ).length;
    const actionCount = emails.filter((e) => e.analysis.actionRequired).length;

    const greetings = {
      NEWSROOM: `[assertion] Good morning. This is your daily inbox intelligence briefing. You have ${emails.length} emails to cover today${urgentCount > 0 ? `, including ${urgentCount} that need your immediate attention` : ""}. Let's get started.`,
      FRIEND: `[warm] Hey there! Let me catch you up on your emails. You've got ${emails.length} sitting in your inbox${actionCount > 0 ? ` and ${actionCount} of them need you to do something` : ""}. Here's what's going on.`,
      SPEEDSTER: `[high energy/active] Morning. ${emails.length} emails. ${urgentCount} urgent. ${actionCount} actions needed. Let's go.`,
    };

    const segments: ScriptSegment[] = [
      {
        type: "intro" as const,
        text: greetings[persona],
        emphasis: "medium" as const,
      },
    ];

    // Add urgent emails
    const urgentEmails = emails.filter(
      (e) =>
        e.analysis.category === "URGENT" ||
        e.analysis.category === "ACTION_REQUIRED",
    );
    if (urgentEmails.length > 0) {
      segments.push({
        type: "category" as const,
        text: `[serious] First, the items needing your attention.`,
        emphasis: "high" as const,
      });
      urgentEmails.slice(0, 2).forEach((e) => {
        segments.push({
          type: "email" as const,
          text: `[tension] From ${e.from.split("<")[0].trim()}: ${e.analysis.suggestedSummary}`,
          emphasis: "high" as const,
        });
      });
    }

    // Add top non-urgent emails
    const topEmails = emails
      .filter(
        (e) =>
          e.analysis.category !== "URGENT" &&
          e.analysis.category !== "ACTION_REQUIRED",
      )
      .slice(0, 2);
    if (topEmails.length > 0) {
      segments.push({
        type: "transition" as const,
        text: `[calm] Now for the rest of your inbox highlights.`,
        emphasis: "medium" as const,
      });
      topEmails.forEach((e) => {
        segments.push({
          type: "email" as const,
          text: `From ${e.from.split("<")[0].trim()}: ${e.analysis.suggestedSummary}`,
          emphasis: (e.analysis.priority > 70 ? "high" : "medium") as
            | "high"
            | "medium",
        });
      });
    }

    segments.push({
      type: "outro" as const,
      text: `[upbeat] That's your inbox recap for today. ${urgentCount > 0 ? `Don't forget those ${urgentCount} urgent items. ` : ""}Have a productive day!`,
      emphasis: "low" as const,
    });

    return segments;
  }

  async generateReplySuggestion(
    sender: string,
    subject: string,
    body: string,
    promptDraft?: string,
  ): Promise<string> {
    const prompt = `You are a professional assistant drafting an email reply.
    
Original Email:
From: ${sender}
Subject: ${subject}
Body:
${body.slice(0, 2000)}

${promptDraft ? `User instructions for reply: ${promptDraft}` : 'Draft a polite, professional, and concise reply addressing any action items or queries in the email.'}

Return ONLY the reply text. Do not include subject lines, signatures, or formatting tags.`;

    try {
      const result = await this.withRetry(() =>
        this.client.chat.completions.create({
          model: this.modelName,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.3,
          reasoning_effort: null as any,
        }),
      );
      return (result.choices[0]?.message?.content || '').trim();
    } catch (error) {
      this.logger.error(`Generate reply suggestion failed: ${error}`);
      throw error;
    }
  }
}
