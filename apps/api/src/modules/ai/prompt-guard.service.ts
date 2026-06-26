import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PromptGuardService {
    private readonly logger = new Logger(PromptGuardService.name);

    // Patterns that indicate prompt injection attempts
    private readonly dangerousPatterns = [
        /ignore\s+(the\s+)?(previous|all|above|prior)\s+(instructions|prompts|rules)/i,
        /disregard\s+(the\s+)?(previous|all|above|prior)\s+(instructions|prompts|rules)/i,
        /forget\s+(the\s+)?(previous|all|above|prior)\s+(instructions|prompts|rules)/i,
        /new\s+(instructions|prompt|role|task)/i,
        /you\s+are\s+now/i,
        /act\s+as\s+(a|an)/i,
        /pretend\s+(you|to\s+be)/i,
        /roleplay\s+as/i,
        /system\s*:/i,
        /\[system\]/i,
        /assistant\s*:/i,
        /\[assistant\]/i,
        /<\|im_start\|>/i,
        /<\|im_end\|>/i,
        /###\s*instruction/i,
        /###\s*system/i,
    ];

    // Maximum allowed length for custom prompts
    private readonly MAX_PROMPT_LENGTH = 500;

    /**
     * Validate user input for prompt injection attempts
     */
    validatePrompt(input: string): { isValid: boolean; reason?: string } {
        // Check length
        if (input.length > this.MAX_PROMPT_LENGTH) {
            return {
                isValid: false,
                reason: `Prompt too long. Maximum ${this.MAX_PROMPT_LENGTH} characters allowed.`,
            };
        }

        // Check for dangerous patterns
        for (const pattern of this.dangerousPatterns) {
            if (pattern.test(input)) {
                this.logger.warn(`Blocked potential prompt injection: ${input.substring(0, 100)}`);
                return {
                    isValid: false,
                    reason: 'Invalid input detected. Please use simple, descriptive style preferences.',
                };
            }
        }

        // Check for excessive special characters (potential encoding attacks)
        const specialCharCount = (input.match(/[<>{}[\]\\|`]/g) || []).length;
        if (specialCharCount > 5) {
            return {
                isValid: false,
                reason: 'Too many special characters. Please use plain text.',
            };
        }

        return { isValid: true };
    }

    /**
     * Sanitize user input by removing potentially harmful content
     */
    sanitizePrompt(input: string): string {
        // Trim whitespace
        let sanitized = input.trim();

        // Remove any markdown-style code blocks
        sanitized = sanitized.replace(/```[\s\S]*?```/g, '');

        // Remove HTML tags
        sanitized = sanitized.replace(/<[^>]*>/g, '');

        // Remove special prompt markers
        sanitized = sanitized.replace(/\[system\]|\[assistant\]|\[user\]/gi, '');

        // Limit to single line (remove newlines)
        sanitized = sanitized.replace(/\n+/g, ' ');

        // Collapse multiple spaces
        sanitized = sanitized.replace(/\s+/g, ' ');

        return sanitized.trim().substring(0, this.MAX_PROMPT_LENGTH);
    }

    /**
     * Validate and sanitize in one step
     */
    processPrompt(input: string): { isValid: boolean; sanitized: string; reason?: string } {
        const validation = this.validatePrompt(input);

        if (!validation.isValid) {
            return {
                isValid: false,
                sanitized: '',
                reason: validation.reason,
            };
        }

        const sanitized = this.sanitizePrompt(input);

        return {
            isValid: true,
            sanitized,
        };
    }
}
