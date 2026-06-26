import { Test, TestingModule } from "@nestjs/testing";
import { AudioService } from "./audio.service";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { VoicePersona } from "@prisma/client";
import { ScriptSegment } from "../ai/ai.service";
import { Logger } from "@nestjs/common";

const mockS3Instance = {
  send: jest.fn(),
};

const mockGenerateContentStream = jest.fn();

jest.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: jest.fn().mockImplementation(() => mockS3Instance),
    PutObjectCommand: jest.fn().mockImplementation((args) => args),
    DeleteObjectCommand: jest.fn().mockImplementation((args) => args),
    GetObjectCommand: jest.fn().mockImplementation((args) => args),
  };
});

jest.mock("@aws-sdk/s3-request-presigner", () => {
  return {
    getSignedUrl: jest.fn(),
  };
});

jest.mock("@google/genai", () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => ({
      models: {
        generateContentStream: mockGenerateContentStream,
      },
    })),
  };
});

describe("AudioService", () => {
  let service: AudioService;

  const mockScript: ScriptSegment[] = [
    { type: "intro", text: "Hello world", emphasis: "medium" },
  ];
  const mockBriefId = "test-brief-id";

  const mockConfig = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    mockS3Instance.send.mockReset();
    mockGenerateContentStream.mockReset();
    (getSignedUrl as jest.Mock).mockReset();
    (PutObjectCommand as unknown as jest.Mock).mockClear();
    (DeleteObjectCommand as unknown as jest.Mock).mockClear();
    (GetObjectCommand as unknown as jest.Mock).mockClear();

    mockConfig.get.mockImplementation((key: string, defaultValue?: any) => {
      switch (key) {
        case "GEMINI_API_KEY":
          return "test-gemini-key";
        case "S3_BUCKET_NAME":
          return "test-bucket";
        case "S3_ENDPOINT":
          return "https://s3.amazonaws.com";
        case "S3_ACCESS_KEY_ID":
          return "test-key-id";
        case "S3_SECRET_ACCESS_KEY":
          return "test-app-key";
        default:
          return defaultValue;
      }
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AudioService,
        {
          provide: ConfigService,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<AudioService>(AudioService);

    jest.spyOn(Logger.prototype, "log").mockImplementation(() => {});
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => {});
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should initialize Gemini voice IDs", () => {
    const voiceIds = (service as any).voiceIds;
    expect(voiceIds[VoicePersona.NEWSROOM]).toBe("Aoede");
    expect(voiceIds[VoicePersona.FRIEND]).toBe("Kore");
    expect(voiceIds[VoicePersona.SPEEDSTER]).toBe("Puck");
  });

  describe("generateAudio", () => {
    it("should throw error when GEMINI_API_KEY is not set", async () => {
      mockConfig.get.mockImplementation((key: string, defaultValue?: any) => {
        if (key === "GEMINI_API_KEY") return "";
        if (key === "S3_BUCKET_NAME") return "test-bucket";
        if (key === "S3_ENDPOINT") return "https://s3.amazonaws.com";
        if (key === "S3_ACCESS_KEY_ID") return "test-key-id";
        if (key === "S3_SECRET_ACCESS_KEY") return "test-app-key";
        return defaultValue;
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AudioService,
          { provide: ConfigService, useValue: mockConfig },
        ],
      }).compile();
      const serviceNoKey = module.get<AudioService>(AudioService);

      await expect(
        serviceNoKey.generateAudio(
          mockScript,
          VoicePersona.NEWSROOM,
          mockBriefId,
        ),
      ).rejects.toThrow(
        "GEMINI_API_KEY is not configured. Audio generation is unavailable.",
      );
    });

    it("should generate audio, upload wav to S3, and return audioKey", async () => {
      const pcmChunk = Buffer.from([0, 1, 2, 3]).toString("base64");
      mockGenerateContentStream.mockResolvedValue(
        (async function* () {
          yield {
            candidates: [
              {
                content: {
                  parts: [
                    {
                      inlineData: {
                        mimeType: "audio/pcm;rate=24000",
                        data: pcmChunk,
                      },
                    },
                  ],
                },
              },
            ],
          };
        })(),
      );

      mockS3Instance.send.mockResolvedValue({});

      const result = await service.generateAudio(
        mockScript,
        VoicePersona.NEWSROOM,
        mockBriefId,
      );

      expect(mockGenerateContentStream).toHaveBeenCalled();
      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: "test-bucket",
          Key: `audio/brief_${mockBriefId}.wav`,
          ContentType: "audio/wav",
        }),
      );
      expect(mockS3Instance.send).toHaveBeenCalled();
      expect(result.audioKey).toBe(`audio/brief_${mockBriefId}.wav`);
      expect(result.duration).toBeGreaterThan(0);
    });

    it("should throw error if Gemini stream returns no audio", async () => {
      mockGenerateContentStream.mockResolvedValue(
        (async function* () {
          yield { candidates: [] };
        })(),
      );

      await expect(
        service.generateAudio(mockScript, VoicePersona.NEWSROOM, mockBriefId),
      ).rejects.toThrow("Received empty audio stream from Google Gen AI");
    });

    it("should throw error if S3 upload fails", async () => {
      const pcmChunk = Buffer.from([1, 2, 3, 4]).toString("base64");
      mockGenerateContentStream.mockResolvedValue(
        (async function* () {
          yield {
            candidates: [
              {
                content: {
                  parts: [{ inlineData: { data: pcmChunk } }],
                },
              },
            ],
          };
        })(),
      );

      mockS3Instance.send.mockRejectedValue(new Error("S3 Fail"));

      await expect(
        service.generateAudio(mockScript, VoicePersona.NEWSROOM, mockBriefId),
      ).rejects.toThrow("S3 Fail");
    });

    it("should throw error if S3 is not configured", async () => {
      mockConfig.get.mockImplementation((key: string, defaultValue?: any) => {
        if (key === "GEMINI_API_KEY") return "test-gemini-key";
        return "";
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AudioService,
          { provide: ConfigService, useValue: mockConfig },
        ],
      }).compile();
      const serviceNoS3 = module.get<AudioService>(AudioService);

      const pcmChunk = Buffer.from([1, 2, 3, 4]).toString("base64");
      mockGenerateContentStream.mockResolvedValue(
        (async function* () {
          yield {
            candidates: [
              {
                content: {
                  parts: [{ inlineData: { data: pcmChunk } }],
                },
              },
            ],
          };
        })(),
      );

      await expect(
        serviceNoS3.generateAudio(
          mockScript,
          VoicePersona.NEWSROOM,
          mockBriefId,
        ),
      ).rejects.toThrow("S3 client not configured");
    });
  });

  describe("getPresignedUrl", () => {
    it("should generate a presigned URL", async () => {
      const key = "audio/test.wav";
      (getSignedUrl as jest.Mock).mockResolvedValue("https://signed-url.com");

      const result = await service.getPresignedUrl(key);

      expect(GetObjectCommand).toHaveBeenCalled();
      expect(getSignedUrl).toHaveBeenCalled();
      expect(result).toBe("https://signed-url.com");
    });
  });

  describe("deleteAudio", () => {
    it("should delete audio from S3", async () => {
      const url = "https://host.com/audio/brief_123.wav";
      mockS3Instance.send.mockResolvedValue({});

      await service.deleteAudio(url);

      expect(DeleteObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: "audio/brief_123.wav",
        }),
      );
      expect(mockS3Instance.send).toHaveBeenCalled();
    });

    it("should handle deletion errors gracefully", async () => {
      mockS3Instance.send.mockRejectedValue(new Error("Fail"));
      await service.deleteAudio("url");
      expect(mockS3Instance.send).toHaveBeenCalled();
    });
  });
});
