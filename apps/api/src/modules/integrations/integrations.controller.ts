import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { User } from '@prisma/client';
import { IntegrationsService } from './integrations.service';
import { AuthService } from '../auth/auth.service';
import { ConnectIntegrationDto, UpdateStyleProfileDto } from './integrations.dto';
import * as crypto from 'crypto';

@Controller('integrations')
export class IntegrationsController {
  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getIntegrations(@Req() req: Request) {
    const user = req.user as User;
    return this.integrationsService.getUserIntegrations(user.id);
  }

  @Post(':provider/connect')
  @UseGuards(AuthGuard('jwt'))
  async connectIntegration(
    @Req() req: Request,
    @Param('provider') provider: string,
    @Body() dto: ConnectIntegrationDto,
  ) {
    const user = req.user as User;
    return this.integrationsService.connectIntegration(user.id, provider, dto);
  }

  @Post(':provider/disconnect')
  @UseGuards(AuthGuard('jwt'))
  async disconnectIntegration(
    @Req() req: Request,
    @Param('provider') provider: string,
  ) {
    const user = req.user as User;
    return this.integrationsService.disconnectIntegration(user.id, provider);
  }

  @Get('style-profile')
  @UseGuards(AuthGuard('jwt'))
  async getStyleProfile(@Req() req: Request) {
    const user = req.user as User;
    return this.integrationsService.getStyleProfile(user.id);
  }

  @Put('style-profile')
  @UseGuards(AuthGuard('jwt'))
  async updateStyleProfile(
    @Req() req: Request,
    @Body() dto: UpdateStyleProfileDto,
  ) {
    const user = req.user as User;
    return this.integrationsService.updateStyleProfile(user.id, dto);
  }

  /**
   * Initializes a secure stateful OAuth handshake.
   * Generates a 2-minute ticket and binds it to a secure httpOnly cookie session nonce.
   */
  @Post(':provider/init')
  @UseGuards(AuthGuard('jwt'))
  async initOAuth(
    @Req() req: Request,
    @Param('provider') provider: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as User;
    const nonce = crypto.randomBytes(16).toString('hex');

    // Generate ticket linked to the nonce
    const ticket = this.authService.generateOauthTicket(user.id, nonce);

    // Set secure, httpOnly cookie with the nonce
    res.cookie('oauth_nonce', nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 2 * 60 * 1000, // 2 minutes
    });

    return { ticket };
  }

  /**
   * Public GET endpoint to initiate Outlook or GitHub OAuth redirect.
   * Validates the single-use ticket against the httpOnly session nonce.
   */
  @Get(':provider/connect')
  async connectOAuth(
    @Param('provider') provider: string,
    @Query('ticket') ticket: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!ticket) {
      throw new BadRequestException('OAuth ticket is required');
    }

    // Manual cookie parsing since cookie-parser might be missing
    const cookies = req.headers.cookie
      ? req.headers.cookie.split(';').reduce(
          (acc, c) => {
            const [k, ...v] = c.trim().split('=');
            if (k && v.length > 0) acc[k] = decodeURIComponent(v.join('='));
            return acc;
          },
          {} as Record<string, string>,
        )
      : {};

    const nonce = cookies['oauth_nonce'];
    if (!nonce) {
      throw new BadRequestException('Authentication session expired or missing');
    }

    try {
      // Validate ticket against nonce and extract userId
      const userId = await this.authService.validateOauthTicket(ticket, nonce);

      // Generate redirection URL
      const redirectUrl = this.integrationsService.getOAuthRedirectUrl(provider, userId);
      return res.redirect(redirectUrl);
    } catch (err) {
      throw new BadRequestException(`OAuth initiation failed: ${err.message}`);
    }
  }

  /**
   * OAuth Callback endpoint registered with Microsoft Graph or GitHub.
   * Receives code and state (userId), exchanges code for real keys, and redirects back to web client.
   */
  @Get(':provider/callback')
  async callbackOAuth(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('state') state: string, // state carries the userId!
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (!code || !state) {
      return res.redirect(`${frontendUrl}/integrations?connected=false&error=Missing+code+or+state`);
    }

    try {
      // Complete server-to-server OAuth code token exchange
      await this.integrationsService.handleOAuthCallback(provider, code, state);
      return res.redirect(`${frontendUrl}/integrations?connected=true&provider=${provider}`);
    } catch (err) {
      return res.redirect(`${frontendUrl}/integrations?connected=false&error=${encodeURIComponent(err.message)}`);
    }
  }
}
