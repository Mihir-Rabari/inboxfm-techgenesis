import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { VoicePersona } from "@prisma/client";
import { ScriptSegment } from "../ai/ai.service";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { SarvamAIClient } from "sarvamai";

interface WavConversionOptions {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}

@Injectable()
export class AudioService {
  private readonly logger = new Logger(AudioService.name);
  private readonly client: SarvamAIClient | null = null;
  private readonly s3Client: S3Client | null = null;
  private readonly bucketName: string;
  private readonly bucketEndpoint: string;
  private readonly voiceIds: Record<VoicePersona, string>;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("SARVAM_API_KEY", "");
    if (apiKey) {
      this.client = new SarvamAIClient({ apiSubscriptionKey: apiKey });
    } else {
      this.logger.warn("SARVAM_API_KEY not set. Audio generation will fail.");
    }

    this.bucketName = this.configService.get<string>("S3_BUCKET_NAME", "");
    this.bucketEndpoint = this.configService.get<string>("S3_ENDPOINT", "");

    // Map VoicePersona to Sarvam AI voice names
    this.voiceIds = {
      [VoicePersona.NEWSROOM]: "aditya", // Professional male
      [VoicePersona.FRIEND]: "ritu", // Warm female
      [VoicePersona.SPEEDSTER]: "ritu", // Fast female
    };

    const s3AccessKeyId = this.configService.get<string>(
      "S3_ACCESS_KEY_ID",
      "",
    );
    const s3SecretAccessKey = this.configService.get<string>(
      "S3_SECRET_ACCESS_KEY",
      "",
    );

    // Initialize S3 client (AWS S3 or S3-compatible providers)
    if (this.bucketName && s3AccessKeyId && s3SecretAccessKey) {
      const region = this.configService.get<string>("S3_REGION", "us-east-1");
      const forcePathStyle = this.configService.get<string>(
        "S3_FORCE_PATH_STYLE",
        "false",
      );
      this.s3Client = new S3Client({
        endpoint: this.bucketEndpoint || undefined,
        region,
        credentials: {
          accessKeyId: s3AccessKeyId,
          secretAccessKey: s3SecretAccessKey,
        },
        forcePathStyle: forcePathStyle === "true",
      });
      this.logger.log("S3 client initialized");
    } else {
      this.logger.warn(
        "S3 credentials/bucket not configured, audio uploads will fail",
      );
    }
  }

  /**
   * Generate audio from script segments using Sarvam AI REST TTS
   */
  async generateAudio(
    script: ScriptSegment[],
    persona: VoicePersona,
    briefId: string,
  ): Promise<{ audioKey: string; duration: number }> {
    // Combine script segments into full text and strip expressive tags like [serious] or [warm] to prevent voice from speaking them
    const fullText = script
      .map((s) => s.text.replace(/\[[^\]]+\]/g, ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    let textToConvert = fullText;
    if (textToConvert.length > 2490) {
      // Find the last sentence end (period, exclamation, question mark) before index 2490
      const lastSentenceEnd = textToConvert.slice(0, 2490).search(/[.!?][^.!?]*$/);
      if (lastSentenceEnd !== -1) {
        textToConvert = textToConvert.slice(0, lastSentenceEnd + 1);
      } else {
        textToConvert = textToConvert.slice(0, 2490);
      }
      this.logger.warn(`Truncated script from ${fullText.length} to ${textToConvert.length} characters to fit under Sarvam TTS 2500 character limit.`);
    }

    if (!this.client) {
      throw new Error(
        "SARVAM_API_KEY is not configured. Audio generation is unavailable.",
      );
    }

    const speaker = this.voiceIds[persona] || "ritu";

    try {
      const response = await this.client.textToSpeech.convert({
        text: textToConvert,
        model: "bulbul:v3",
        target_language_code: "en-IN",
        speaker: speaker as any,
      });

      if (!response.audios || response.audios.length === 0) {
        throw new Error("Received empty audio response from Sarvam AI");
      }

      const base64Audio = response.audios[0];
      const audioBuffer = Buffer.from(base64Audio, "base64");

      const fileName = `brief_${briefId}.wav`;

      // Upload to S3 and get the key
      const audioKey = await this.uploadToS3(
        fileName,
        audioBuffer,
        "audio/wav",
      );

      // Estimate duration (roughly 150 words per minute)
      const wordCount = fullText.split(/\s+/).length;
      const duration = Math.ceil((wordCount / 150) * 60);

      this.logger.log(`Generated audio via Sarvam: ${fileName} (~${duration}s)`);

      return {
        audioKey,
        duration,
      };
    } catch (error) {
      this.logger.error(`Audio generation failed: ${error}`);
      throw error;
    }
  }

  private parseMimeType(mimeType: string): WavConversionOptions {
    const [fileType, ...params] = mimeType.split(";").map((s) => s.trim());
    const [_, format] = fileType.split("/");

    const options: Partial<WavConversionOptions> = {
      numChannels: 1,
      sampleRate: 24000,
      bitsPerSample: 16,
    };

    if (format && format.startsWith("L")) {
      const bits = parseInt(format.slice(1), 10);
      if (!isNaN(bits)) {
        options.bitsPerSample = bits;
      }
    } else if (format && format.toLowerCase() === "pcm") {
      options.bitsPerSample = 16;
    }

    for (const param of params) {
      const [key, value] = param.split("=").map((s) => s.trim());
      if (key === "rate") {
        options.sampleRate = parseInt(value, 10);
      }
    }

    return options as WavConversionOptions;
  }

  private createWavHeader(
    dataLength: number,
    options: WavConversionOptions,
  ): Buffer {
    const { numChannels, sampleRate, bitsPerSample } = options;

    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const buffer = Buffer.alloc(44);

    buffer.write("RIFF", 0); // ChunkID
    buffer.writeUInt32LE(36 + dataLength, 4); // ChunkSize
    buffer.write("WAVE", 8); // Format
    buffer.write("fmt ", 12); // Subchunk1ID
    buffer.writeUInt32LE(16, 16); // Subchunk1Size (PCM)
    buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
    buffer.writeUInt16LE(numChannels, 22); // NumChannels
    buffer.writeUInt32LE(sampleRate, 24); // SampleRate
    buffer.writeUInt32LE(byteRate, 28); // ByteRate
    buffer.writeUInt16LE(blockAlign, 32); // BlockAlign
    buffer.writeUInt16LE(bitsPerSample, 34); // BitsPerSample
    buffer.write("data", 36); // Subchunk2ID
    buffer.writeUInt32LE(dataLength, 40); // Subchunk2Size

    return buffer;
  }

  /**
   * Upload file to S3-compatible object storage
   * Returns the S3 key (not a URL)
   */
  private async uploadToS3(
    fileName: string,
    body: Buffer,
    contentType: string,
  ): Promise<string> {
    if (!this.s3Client) {
      throw new Error("S3 client not configured");
    }

    const key = `audio/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await this.s3Client.send(command);

    // Return the key for later presigned URL generation
    return key;
  }

  /**
   * Generate a presigned URL for accessing private audio files
   * URL is valid for 1 hour (3600 seconds)
   */
  async getPresignedUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    if (!this.s3Client) {
      throw new Error("S3 client not configured");
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Delete audio file from S3
   */
  async deleteAudio(audioUrl: string): Promise<void> {
    if (!this.s3Client) {
      this.logger.warn("Cannot delete audio: S3 client not configured");
      return;
    }

    try {
      let key: string;
      if (audioUrl.startsWith("http")) {
        const url = new URL(audioUrl);
        key = url.pathname.replace(/^\//, "");
      } else {
        key = audioUrl;
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`Deleted audio from S3: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete audio: ${error}`);
    }
  }
}
