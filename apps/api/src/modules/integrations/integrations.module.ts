import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { GmailModule } from '../gmail/gmail.module';
import { AuthModule } from '../auth/auth.module';
import { OutlookService } from './outlook.service';
import { GitHubService } from './github.service';
import { RssFetcherService } from './rss-fetcher.service';

@Module({
  imports: [PrismaModule, GmailModule, AuthModule],
  controllers: [IntegrationsController],
  providers: [
    IntegrationsService,
    OutlookService,
    GitHubService,
    RssFetcherService,
  ],
  exports: [
    IntegrationsService,
    OutlookService,
    GitHubService,
    RssFetcherService,
  ],
})
export class IntegrationsModule {}
