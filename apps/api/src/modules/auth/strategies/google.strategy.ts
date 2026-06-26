import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback, Profile } from "passport-google-oauth20";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { AuthService, GoogleProfile } from "../auth.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>("GOOGLE_CLIENT_ID"),
      clientSecret: configService.get<string>("GOOGLE_CLIENT_SECRET"),
      callbackURL: configService.get<string>("GOOGLE_CALLBACK_URL"),
      scope: ["email", "profile"],
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const state = req.query.state as string;

    const googleProfile: GoogleProfile = {
      id: profile.id,
      email: profile.emails?.[0]?.value || "",
      displayName: profile.displayName || "",
      picture: profile.photos?.[0]?.value || "",
      accessToken,
      refreshToken,
    };

    // Direct login/signup flow (no ticket)
    if (!state || state === "direct_login") {
      const result =
        await this.authService.handleDirectGoogleLogin(googleProfile);
      return done(null, result as any);
    }

    // Gmail connection flow (existing authenticated user with ticket)
    const nonce = this.extractCookie(req, "oauth_nonce");
    if (!nonce) {
      throw new UnauthorizedException("Missing authentication session");
    }

    let userId: string;
    try {
      userId = await this.authService.validateOauthTicket(state, nonce);
    } catch (error) {
      throw new UnauthorizedException("Invalid authentication state");
    }

    const user = await this.authService.getUserById(userId);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Connect Gmail to the authenticated user identified by the ticket
    const updatedUser = await this.authService.connectGmail(
      user,
      googleProfile,
    );
    done(null, updatedUser);
  }

  private extractCookie(req: Request, name: string): string | null {
    if (req.headers.cookie) {
      const cookies = req.headers.cookie.split(";");
      for (const cookie of cookies) {
        const [key, value] = cookie.trim().split("=");
        if (key === name) {
          return decodeURIComponent(value);
        }
      }
    }
    return null;
  }
}
