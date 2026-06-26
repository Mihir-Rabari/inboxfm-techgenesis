import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionUtil {
    private readonly algorithm = 'aes-256-gcm';
    private readonly key: Buffer;

    constructor(private readonly configService: ConfigService) {
        const keyString = this.configService.get<string>('ENCRYPTION_KEY');
        if (!keyString || keyString.length !== 32) {
            throw new Error('ENCRYPTION_KEY must be 32 characters long');
        }
        this.key = Buffer.from(keyString);
    }

    encrypt(text: string): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        // Format: iv:authTag:encrypted
        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    }

    decrypt(encryptedText: string): string {
        const [ivHex, authTagHex, encryptedHex] = encryptedText.split(':');
        if (!ivHex || !authTagHex || !encryptedHex) {
            throw new Error('Invalid encrypted text format');
        }

        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
