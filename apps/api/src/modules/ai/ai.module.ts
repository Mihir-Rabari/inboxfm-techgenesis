import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { PromptGuardService } from './prompt-guard.service';
import { EmbeddingService } from './embedding.service';

@Module({
    providers: [AiService, PromptGuardService, EmbeddingService],
    exports: [AiService, PromptGuardService, EmbeddingService],
})
export class AiModule { }
