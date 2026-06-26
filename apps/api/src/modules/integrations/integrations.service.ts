import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IntegrationProvider, IntegrationStatus } from '@prisma/client';
import { INTEGRATION_REGISTRY } from './integration-registry';
import { ConnectIntegrationDto, UpdateStyleProfileDto } from './integrations.dto';
import { GmailService, RawEmail } from '../gmail/gmail.service';
import { OutlookService } from './outlook.service';
import { GitHubService } from './github.service';
import { RssFetcherService } from './rss-fetcher.service';
import { EncryptionUtil } from '../../utils/encryption.util';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gmailService: GmailService,
    private readonly outlookService: OutlookService,
    private readonly githubService: GitHubService,
    private readonly rssFetcherService: RssFetcherService,
    private readonly encryptionUtil: EncryptionUtil,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Orchestrates fetching of recent items from ALL connected integrations for a user.
   * Runs queries concurrently and catches errors gracefully per-source so a single 
   * integration failure does not break the entire briefing synthesis.
   */
  async fetchRecentItemsFromAll(
    userId: string,
    sinceTimestamp?: number,
    options?: { includeGmail?: boolean; includeOutlook?: boolean },
  ): Promise<RawEmail[]> {
    this.logger.log(`Orchestrating multi-source fetch for user ${userId} with options: ${JSON.stringify(options || {})}`);
 
    const includeGmail = options?.includeGmail !== false;
    const includeOutlook = options?.includeOutlook !== false;

    // Fetch user for Gmail connected checks
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { gmailConnected: true },
    });
 
    // Fetch all active UserIntegration connections
    const activeConnections = await this.prisma.userIntegration.findMany({
      where: {
        userId,
        status: IntegrationStatus.CONNECTED,
      },
    });
 
    const fetchPromises: Promise<RawEmail[]>[] = [];
 
    // 1. Fetch Gmail & Google Calendar if connected and enabled
    if (user?.gmailConnected && includeGmail) {
      fetchPromises.push(
        this.gmailService.fetchRecentEmails(userId, sinceTimestamp).catch((err) => {
          this.logger.error(`Gmail fetching failed for user ${userId}: ${err.message}`);
          return [];
        }),
      );
      fetchPromises.push(
        this.gmailService.fetchRecentCalendarEvents(userId, sinceTimestamp).catch((err) => {
          this.logger.error(`Google Calendar fetching failed for user ${userId}: ${err.message}`);
          return [];
        }),
      );
    }
 
    // Map other providers to their fetchers
    for (const conn of activeConnections) {
      const decryptedToken = conn.accessToken
        ? this.encryptionUtil.decrypt(conn.accessToken)
        : '';
 
      if (conn.provider === IntegrationProvider.OUTLOOK) {
        if (!includeOutlook) {
          continue;
        }
        fetchPromises.push(
          this.getOrRefreshOutlookToken(conn)
            .then((validToken) => this.outlookService.fetchRecentItems(validToken, sinceTimestamp))
            .catch((err) => {
              this.logger.error(`Outlook Mail & Calendar fetching failed for user ${userId}: ${err.message}`);
              return [];
            }),
        );
      }
 
      if (conn.provider === IntegrationProvider.GITHUB) {
        fetchPromises.push(
          this.githubService.fetchRecentNotifications(decryptedToken, sinceTimestamp).catch((err) => {
            this.logger.error(`GitHub fetching failed for user ${userId}: ${err.message}`);
            return [];
          }),
        );
      }

      if (conn.provider === IntegrationProvider.RSS_FEED) {
        const metadata = conn.metadata as any;
        const urls = Array.isArray(metadata?.urls) ? (metadata.urls as string[]) : [];
        fetchPromises.push(
          this.rssFetcherService.fetchRecentArticles(urls, sinceTimestamp).catch((err) => {
            this.logger.error(`RSS feeds fetching failed for user ${userId}: ${err.message}`);
            return [];
          }),
        );
      }
    }

    // Gather and flatten all results
    const resultsArray = await Promise.all(fetchPromises);
    const flattened = resultsArray.flat();

    this.logger.log(`Successfully completed multi-source fetch. Aggregated ${flattened.length} items total.`);
    return flattened;
  }

  /**
   * Helper to fetch a valid decrypted access token for Outlook, refreshing it if expired or expiring soon.
   */
  async getOrRefreshOutlookToken(conn: any): Promise<string> {
    if (!conn.accessToken) {
      return '';
    }

    const accessToken = this.encryptionUtil.decrypt(conn.accessToken);
    const refreshToken = conn.refreshToken ? this.encryptionUtil.decrypt(conn.refreshToken) : undefined;


    const expiresAt = conn.tokenExpiry ? new Date(conn.tokenExpiry).getTime() : 0;
    const fiveMinutes = 5 * 60 * 1000;
    const needsRefresh = !expiresAt || expiresAt < Date.now() + fiveMinutes;

    if (needsRefresh && refreshToken) {
      this.logger.log(`Proactively refreshing expired/expiring Outlook token for user ${conn.userId}`);
      try {
        const clientId = this.configService.get('OUTLOOK_CLIENT_ID') || 'mock_outlook_client_id';
        const clientSecret = this.configService.get('OUTLOOK_CLIENT_SECRET') || 'mock_outlook_client_secret';
        const apiAppUrl = this.configService.get('APP_URL') || 'http://localhost:3001';
        const redirectUri = `${apiAppUrl}/api/integrations/outlook/callback`;

        const params = new URLSearchParams();
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);
        params.append('refresh_token', refreshToken);
        params.append('redirect_uri', redirectUri);
        params.append('grant_type', 'refresh_token');

        const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        if (!res.ok) {
          throw new Error(`Microsoft token refresh returned ${res.status}: ${res.statusText}`);
        }

        const data = await res.json() as any;
        if (data.error) {
          throw new Error(`Microsoft returned error: ${data.error_description || data.error}`);
        }

        const newAccessToken = data.access_token;
        const newRefreshToken = data.refresh_token || refreshToken; // fallback to old refresh token if not returned
        const expiresIn = data.expires_in || 3600;
        const newTokenExpiry = new Date(Date.now() + expiresIn * 1000);

        if (newAccessToken) {
          // Encrypt and persist new tokens
          const encryptedAccessToken = this.encryptionUtil.encrypt(newAccessToken);
          const encryptedRefreshToken = this.encryptionUtil.encrypt(newRefreshToken);

          await this.prisma.userIntegration.update({
            where: { id: conn.id },
            data: {
              accessToken: encryptedAccessToken,
              refreshToken: encryptedRefreshToken,
              tokenExpiry: newTokenExpiry,
            },
          });

          this.logger.log(`Successfully persisted refreshed Outlook token for user ${conn.userId}`);
          return newAccessToken;
        }
      } catch (err) {
        this.logger.error(`Failed to refresh Outlook token for user ${conn.userId}: ${err.message}`);
        // If refresh fails, return current accessToken as fallback, which will eventually throw on Graph API call
        return accessToken;
      }
    }

    return accessToken;
  }

  /**
   * Generates Microsoft or GitHub OAuth redirection authorize URLs
   */
  getOAuthRedirectUrl(providerStr: string, userId: string): string {
    const provider = this.validateProvider(providerStr.toUpperCase());
    const apiAppUrl = this.configService.get('APP_URL') || 'http://localhost:3001';

    if (provider === IntegrationProvider.GITHUB) {
      const clientId = this.configService.get('GITHUB_CLIENT_ID') || 'mock_github_client_id';
      const redirectUri = `${apiAppUrl}/api/integrations/github/callback`;
      return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user%20notifications%20repo&state=${userId}`;
    }

    if (provider === IntegrationProvider.OUTLOOK) {
      const clientId = this.configService.get('OUTLOOK_CLIENT_ID') || 'mock_outlook_client_id';
      const redirectUri = `${apiAppUrl}/api/integrations/outlook/callback`;
      return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=offline_access%20User.Read%20Mail.Read%20Calendars.Read&state=${userId}`;
    }

    throw new BadRequestException(`OAuth not supported for provider '${providerStr}'`);
  }

  /**
   * Handles the live server-to-server OAuth callback exchange
   */
  async handleOAuthCallback(
    providerStr: string,
    code: string,
    userId: string,
  ): Promise<void> {
    const provider = this.validateProvider(providerStr.toUpperCase());
    const apiAppUrl = this.configService.get('APP_URL') || 'http://localhost:3001';

    if (provider === IntegrationProvider.GITHUB) {
      const clientId = this.configService.get('GITHUB_CLIENT_ID') || 'mock_github_client_id';
      const clientSecret = this.configService.get('GITHUB_CLIENT_SECRET') || 'mock_github_client_secret';
      
      const res = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      });

      if (!res.ok) {
        throw new Error(`GitHub OAuth exchange failed: ${res.statusText}`);
      }

      const data = await res.json() as any;
      if (data.error) {
        throw new Error(`GitHub returned error: ${data.error_description || data.error}`);
      }

      const accessToken = data.access_token;
      if (!accessToken) {
        throw new Error('No access token returned from GitHub');
      }

      await this.connectIntegration(userId, 'GITHUB', {
        accessToken,
        metadata: { connectedAs: 'GitHub Live Authorization' },
      });
      return;
    }

    if (provider === IntegrationProvider.OUTLOOK) {
      const clientId = this.configService.get('OUTLOOK_CLIENT_ID') || 'mock_outlook_client_id';
      const clientSecret = this.configService.get('OUTLOOK_CLIENT_SECRET') || 'mock_outlook_client_secret';
      const redirectUri = `${apiAppUrl}/api/integrations/outlook/callback`;

      const params = new URLSearchParams();
      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);
      params.append('code', code);
      params.append('redirect_uri', redirectUri);
      params.append('grant_type', 'authorization_code');

      const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!res.ok) {
        throw new Error(`Microsoft Outlook OAuth exchange failed: ${res.statusText}`);
      }

      const data = await res.json() as any;
      if (data.error) {
        throw new Error(`Microsoft returned error: ${data.error_description || data.error}`);
      }

      const accessToken = data.access_token;
      const refreshToken = data.refresh_token;
      const expiresIn = data.expires_in || 3600;
      const tokenExpiry = new Date(Date.now() + expiresIn * 1000);
      if (!accessToken) {
        throw new Error('No access token returned from Outlook');
      }

      await this.connectIntegration(userId, 'OUTLOOK', {
        accessToken,
        refreshToken,
        tokenExpiry,
        metadata: { connectedAs: 'Outlook Live Authorization' },
      });
      return;
    }

    throw new BadRequestException(`OAuth callback not supported for provider '${providerStr}'`);
  }

  /**
   * Returns all integrations for a user, merging DB records with the static registry.
   * Every registry entry is returned, with status from DB if a record exists.
   */
  async getUserIntegrations(userId: string) {
    const dbIntegrations = await this.prisma.userIntegration.findMany({
      where: { userId },
    });

    // Also check legacy Gmail connection on User model
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { gmailConnected: true },
    });

    const dbMap = new Map(dbIntegrations.map((i) => [i.provider, i]));

    return INTEGRATION_REGISTRY.map((def) => {
      const dbRecord = dbMap.get(def.provider as IntegrationProvider);

      // Special case: Gmail & Google Calendar use legacy User.gmailConnected field
      if (def.provider === 'GMAIL' || def.provider === 'GOOGLE_CALENDAR') {
        return {
          ...def,
          id: dbRecord?.id || null,
          status: user?.gmailConnected ? 'CONNECTED' : 'DISCONNECTED',
          connectedAt: dbRecord?.connectedAt || null,
          metadata: dbRecord?.metadata || {},
        };
      }

      return {
        ...def,
        id: dbRecord?.id || null,
        status: dbRecord?.status || 'DISCONNECTED',
        connectedAt: dbRecord?.connectedAt || null,
        metadata: dbRecord?.metadata || {},
      };
    });
  }

  /**
   * Connect (or re-connect) an integration for a user.
   */
  async connectIntegration(
    userId: string,
    providerStr: string,
    dto: ConnectIntegrationDto,
  ) {
    const provider = this.validateProvider(providerStr);
    const registryDef = INTEGRATION_REGISTRY.find((d) => d.provider === providerStr);

    if (!registryDef?.isAvailable) {
      throw new BadRequestException(`Integration '${providerStr}' is not yet available.`);
    }

    // Encrypt token if provided
    const encryptedAccessToken = dto.accessToken
      ? this.encryptionUtil.encrypt(dto.accessToken)
      : null;
    const encryptedRefreshToken = dto.refreshToken
      ? this.encryptionUtil.encrypt(dto.refreshToken)
      : null;

    return this.prisma.userIntegration.upsert({
      where: {
        userId_provider: { userId, provider },
      },
      create: {
        userId,
        provider,
        status: IntegrationStatus.CONNECTED,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiry: dto.tokenExpiry || null,
        metadata: (dto.metadata as any) || {},
        connectedAt: new Date(),
      },
      update: {
        status: IntegrationStatus.CONNECTED,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiry: dto.tokenExpiry || null,
        metadata: (dto.metadata as any) || {},
        connectedAt: new Date(),
      },
    });
  }

  /**
   * Disconnect an integration for a user.
   */
  async disconnectIntegration(userId: string, providerStr: string) {
    const provider = this.validateProvider(providerStr);

    if (provider === IntegrationProvider.GMAIL || provider === IntegrationProvider.GOOGLE_CALENDAR) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          gmailConnected: false,
          googleId: null,
          accessToken: null,
          refreshToken: null,
          tokenExpiry: null,
        },
      });
      return { success: true };
    }

    const existing = await this.prisma.userIntegration.findUnique({
      where: { userId_provider: { userId, provider } },
    });

    if (!existing) {
      throw new NotFoundException(`Integration '${providerStr}' not found.`);
    }

    await this.prisma.userIntegration.update({
      where: { id: existing.id },
      data: {
        status: IntegrationStatus.DISCONNECTED,
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null,
      },
    });

    return { success: true };
  }

  /**
   * Get the user's style profile (markdown taste preferences).
   */
  async getStyleProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { styleProfile: true },
    });

    return { content: user?.styleProfile || '' };
  }

  /**
   * Update the user's style profile.
   */
  async updateStyleProfile(userId: string, dto: UpdateStyleProfileDto) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { styleProfile: dto.content },
    });

    return { success: true };
  }

  /**
   * Validate and cast a provider string to the Prisma enum.
   */
  private validateProvider(provider: string): IntegrationProvider {
    const valid = Object.values(IntegrationProvider);
    if (!valid.includes(provider as IntegrationProvider)) {
      throw new BadRequestException(
        `Invalid provider '${provider}'. Valid: ${valid.join(', ')}`,
      );
    }
    return provider as IntegrationProvider;
  }
}
