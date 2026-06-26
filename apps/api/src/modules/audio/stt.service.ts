import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SarvamAIClient } from "sarvamai";

@Injectable()
export class SttService {
  private readonly logger = new Logger(SttService.name);
  private readonly client: SarvamAIClient | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("SARVAM_API_KEY", "");
    if (apiKey) {
      this.client = new SarvamAIClient({ apiSubscriptionKey: apiKey });
    } else {
      this.logger.warn("SARVAM_API_KEY not set. STT service will fail.");
    }
  }

  /**
   * Transcribes audio buffer to text using Sarvam AI Speech-To-Text REST API.
   * Uses saaras:v3 model optimized for Indian accents and English language (en-IN).
   */
  async transcribe(audioBuffer: Buffer, mimeType: string = "audio/wav"): Promise<string> {
    if (!this.client) {
      throw new Error("SARVAM_API_KEY is not configured. STT is unavailable.");
    }

    try {
      const response = await this.client.speechToText.transcribe({
        file: {
          data: audioBuffer,
          filename: "audio.wav",
          contentType: mimeType,
        },
        model: "saaras:v3",
        language_code: "en-IN",
      });

      if (!response.transcript) {
        throw new Error("Transcribe returned empty transcript");
      }

      this.logger.log(`Audio transcribed successfully: ${response.transcript.slice(0, 100)}...`);
      return response.transcript;
    } catch (error) {
      this.logger.error(`Failed to transcribe audio: ${error}`);
      throw error;
    }
  }
}
