import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  Body,
  HttpCode,
  UnauthorizedException,
  BadRequestException,
  Header,
  Query,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { Request, Response } from "express";
import { Throttle } from "@nestjs/throttler";
import {
  AuthService,
  SignupDto,
  LoginDto,
  GooglePendingResult,
} from "./auth.service";
import { User } from "@prisma/client";
import { GoogleOauthGuard } from "./guards/google-oauth.guard";
import * as crypto from "crypto";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post("signup")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(201)
  async signup(@Body() data: SignupDto) {
    const { user, token } = await this.authService.signup(data);
    const isAdmin = await this.authService.checkIsAdmin(user.id);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        gmailConnected: user.gmailConnected,
        timezone: user.timezone,
        isActive: user.isActive,
        onboardingComplete: user.onboardingComplete,
        onboardingStep: user.onboardingStep,
        isAdmin,
      },
      token,
    };
  }

  @Post("login")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(200)
  async login(@Body() data: LoginDto) {
    const { user, token } = await this.authService.login(data);
    const isAdmin = await this.authService.checkIsAdmin(user.id);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        gmailConnected: user.gmailConnected,
        timezone: user.timezone,
        isActive: user.isActive,
        onboardingComplete: user.onboardingComplete,
        onboardingStep: user.onboardingStep,
        isAdmin,
      },
      token,
    };
  }

  @Post("google/init")
  @UseGuards(AuthGuard("jwt"))
  async googleInit(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as User;
    const nonce = crypto.randomBytes(16).toString("hex");

    // Generate ticket linked to the nonce
    const ticket = this.authService.generateOauthTicket(user.id, nonce);

    // Set secure, httpOnly cookie with the nonce
    res.cookie("oauth_nonce", nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 2 * 60 * 1000, // 2 minutes
    });

    return { ticket };
  }

  // Google OAuth for Gmail connection (authenticated users only)
  // Protected by ticket validation via GoogleOauthGuard
  @Get("google")
  @UseGuards(GoogleOauthGuard)
  googleConnect() {
    // Initiates Google OAuth flow for Gmail connection
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>("FRONTEND_URL");
    const finalFrontendUrl = frontendUrl || "http://localhost:3000";
    const isProd = process.env.NODE_ENV === "production";

    const result = req.user as User | GooglePendingResult;

    // New user — not on approved waitlist yet, needs to enter access code
    if ("pendingProfile" in result) {
      const pendingToken = this.authService.generatePendingGoogleToken(
        result.pendingProfile,
      );
      res.cookie("google_pending", pendingToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        maxAge: 10 * 60 * 1000, // 10 minutes
        path: "/",
      });
      return res.redirect(
        `${finalFrontendUrl}/auth/google-complete?email=${encodeURIComponent(result.pendingProfile.email)}`,
      );
    }

    // Existing user — normal login flow
    const token = await this.authService.generateToken(result);
    res.cookie("auth_token_exchange", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 60 * 1000,
      path: "/",
    });
    return res.redirect(`${finalFrontendUrl}/auth/callback`);
  }

  @Post("google/complete")
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async completeGoogleSignup(
    @Body() body: { accessCode: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Parse pending token from cookie
    const cookies = req.headers.cookie
      ? req.headers.cookie.split(";").reduce(
          (acc, c) => {
            const [k, ...v] = c.trim().split("=");
            if (k && v.length > 0) acc[k] = decodeURIComponent(v.join("="));
            return acc;
          },
          {} as Record<string, string>,
        )
      : {};

    const pendingToken = cookies["google_pending"];
    if (!pendingToken) {
      throw new UnauthorizedException(
        "No Google session found. Please try signing in with Google again.",
      );
    }

    const { user, token } = await this.authService.completeGoogleSignup(
      pendingToken,
      body.accessCode,
    );

    // Clear the pending cookie
    res.clearCookie("google_pending", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    const isAdmin = await this.authService.checkIsAdmin(user.id);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        gmailConnected: user.gmailConnected,
        timezone: user.timezone,
        isActive: user.isActive,
        onboardingComplete: user.onboardingComplete,
        onboardingStep: user.onboardingStep,
        isAdmin,
      },
      token,
    };
  }

  @Post("token-exchange")
  @HttpCode(200)
  async exchangeToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Manual cookie parsing since cookie-parser might be missing
    const cookies = req.headers.cookie
      ? req.headers.cookie.split(";").reduce(
          (acc, cookie) => {
            const [key, ...v] = cookie.trim().split("=");
            if (key && v.length > 0) {
              acc[key] = decodeURIComponent(v.join("="));
            }
            return acc;
          },
          {} as Record<string, string>,
        )
      : {};

    const token = cookies["auth_token_exchange"];

    if (!token) {
      throw new UnauthorizedException("No exchange token found");
    }

    // Clear the exchange cookie immediately
    res.clearCookie("auth_token_exchange", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    // Also clear any legacy auth_token cookie that might be stuck in the browser
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return { token };
  }

  @Post("disconnect-gmail")
  @UseGuards(AuthGuard("jwt"))
  async disconnectGmail(@Req() req: any) {
    const userId = req.user.id;
    const user = await this.authService.disconnectGmail(userId);
    return {
      success: true,
      gmailConnected: user.gmailConnected,
    };
  }

  @Get("me")
  @UseGuards(AuthGuard("jwt"))
  @Header(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  )
  @Header("Pragma", "no-cache")
  @Header("Expires", "0")
  async getMe(@Req() req: Request) {
    const user = req.user as User;
    const isAdmin = await this.authService.checkIsAdmin(user.id);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      gmailConnected: user.gmailConnected,
      timezone: user.timezone,
      isActive: user.isActive,
      onboardingComplete: user.onboardingComplete,
      onboardingStep: user.onboardingStep,
      isAdmin,
    };
  }

  @Post("forgot-password")
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(200)
  async requestPasswordReset(@Body() body: { email: string }) {
    await this.authService.requestPasswordReset(body.email);
    return {
      message:
        "If an account exists with that email, a password reset link has been sent.",
    };
  }

  @Post("reset-password")
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(200)
  async resetPassword(@Body() body: { token: string; password: string }) {
    await this.authService.resetPassword(body.token, body.password);
    return { message: "Password has been successfully reset." };
  }

  @Post("unsubscribe")
  @HttpCode(200)
  async unsubscribe(@Body() body: { token: string }) {
    if (!body.token) {
      throw new BadRequestException("Token is required");
    }
    return this.authService.unsubscribe(body.token);
  }

  @Get("unsubscribe/verify")
  async verifyUnsubscribeToken(@Query("token") token: string) {
    if (!token) {
      throw new BadRequestException("Token is required");
    }
    return this.authService.verifyUnsubscribeToken(token);
  }

  @Post("unsubscribe/preferences")
  @HttpCode(200)
  async updateEmailPreferences(
    @Body()
    body: {
      token: string;
      preferences: {
        subscribePromo?: boolean;
        subscribeDailyBrief?: boolean;
        subscribeAlerts?: boolean;
        optOutWaitlist?: boolean;
      };
    }
  ) {
    if (!body.token) {
      throw new BadRequestException("Token is required");
    }
    return this.authService.updateEmailPreferences(body.token, body.preferences);
  }
}
