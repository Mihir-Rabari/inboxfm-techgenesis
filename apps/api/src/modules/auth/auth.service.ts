import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PrismaService } from "../../prisma/prisma.service";

import { EncryptionUtil } from "../../utils/encryption.util";
import { User } from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import {
  UserSignedUpEvent,
  UserLoggedInEvent,
  PasswordResetRequestedEvent,
  GmailConnectedEvent,
} from "./auth.events";

export interface GoogleProfile {
  id: string;
  email: string;
  displayName: string;
  picture: string;
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface SignupDto {
  email: string;
  password: string;
  name?: string;
  accessCode: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface GooglePendingResult {
  pendingProfile: GoogleProfile;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,

    private readonly eventEmitter: EventEmitter2,
    private readonly encryptionUtil: EncryptionUtil,
  ) {}

  // Email/Password Authentication
  async signup(data: SignupDto): Promise<{ user: User; token: string }> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException("An account with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
      },
    });

    const token = await this.generateToken(user);

    // Emit user signed up event
    this.eventEmitter.emit(
      "auth.signedUp",
      new UserSignedUpEvent(user.id, user.email, user.name || "there"),
    );

    return { user, token };
  }

  async login(data: LoginDto): Promise<{ user: User; token: string }> {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException("Invalid email or password");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    // Update last active
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    const token = await this.generateToken(user);

    // Emit user logged in event
    this.eventEmitter.emit(
      "auth.loggedIn",
      new UserLoggedInEvent(user.id, user.email),
    );

    return { user, token };
  }

  // Gmail Connection (for existing authenticated users)
  async connectGmail(user: User, profile: GoogleProfile): Promise<User> {
    // Verify they're connecting the same Gmail account they registered with
    if (user.email !== profile.email) {
      throw new BadRequestException(
        "You must connect the same Gmail account you used to sign up",
      );
    }

    // Update user with Gmail OAuth tokens
    // IMPORTANT: Google only returns a refresh_token on first auth, never on re-auth.
    // Never overwrite an existing refresh token with undefined — that permanently breaks auto-refresh.
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: profile.id,
        accessToken: this.encryptionUtil.encrypt(profile.accessToken),
        ...(profile.refreshToken && {
          refreshToken: this.encryptionUtil.encrypt(profile.refreshToken),
        }),
        gmailConnected: true,
        picture: profile.picture,
        googleConnectedAt: new Date(),
        googleWarningSent: false,
      },
    });

    // Emit Gmail connected event
    if (!user.gmailConnected) {
      this.eventEmitter.emit(
        "auth.gmailConnected",
        new GmailConnectedEvent(user.id),
      );
    }

    return updatedUser;
  }

  async handleGoogleCallback(profile: GoogleProfile): Promise<User> {
    // This should only be called for users who are already authenticated
    // and are connecting their Gmail account
    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      throw new BadRequestException(
        "No account found. Please sign up with an access code first.",
      );
    }

    // Connect Gmail to existing account
    return this.connectGmail(user, profile);
  }

  // Direct Google login/signup — no ticket required.
  // Creates the user if they don't exist yet (sign-up via Google),
  // or logs them in and refreshes their tokens (sign-in via Google).
  async handleDirectGoogleLogin(
    profile: GoogleProfile,
  ): Promise<User | GooglePendingResult> {
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ googleId: profile.id }, { email: profile.email }],
      },
    });

    if (user) {
      // Existing user — update profile info only.
      // Do NOT overwrite access/refresh tokens — those are Gmail-scoped tokens
      // managed separately via the Gmail connection flow.
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: profile.id,
          picture: profile.picture || user.picture,
          lastActiveAt: new Date(),
        },
      });

      if (!user.gmailConnected) {
        this.eventEmitter.emit(
          "auth.gmailConnected",
          new GmailConnectedEvent(user.id),
        );
      }

      return user;
    }

    // No waitlist/access code check required anymore, register directly

    // New user — create account via Google.
    // We store a random placeholder password that can never match a bcrypt hash,
    // so users who signed up via Google cannot log in via email/password.
    const unusablePassword = `google_oauth_${crypto.randomBytes(24).toString("hex")}`;
    user = await this.prisma.user.create({
      data: {
        email: profile.email,
        name: profile.displayName,
        picture: profile.picture,
        googleId: profile.id,
        password: unusablePassword,
        accessToken: this.encryptionUtil.encrypt(profile.accessToken),
        refreshToken: profile.refreshToken
          ? this.encryptionUtil.encrypt(profile.refreshToken)
          : null,
        gmailConnected: true,
        googleConnectedAt: new Date(),
        googleWarningSent: false,
      },
    });

    this.eventEmitter.emit(
      "auth.signedUp",
      new UserSignedUpEvent(user.id, user.email, user.name || "there"),
    );
    this.eventEmitter.emit(
      "auth.gmailConnected",
      new GmailConnectedEvent(user.id),
    );

    return user;
  }

  async disconnectGmail(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        googleId: null,
        accessToken: null,
        refreshToken: null,
        gmailConnected: false,
        googleConnectedAt: null,
        googleWarningSent: false,
      },
    });
  }

  async generateToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };
    return this.jwtService.sign(payload);
  }

  async validateJwtUser(payload: JwtPayload): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
  }

  async getUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async checkIsAdmin(userId: string): Promise<boolean> {
    const admin = await this.prisma.admin.findUnique({
      where: { userId },
    });
    return !!admin;
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return; // Don't reveal user existence

    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hour expiry

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpires: expires,
      },
    });

    this.eventEmitter.emit(
      "auth.passwordReset",
      new PasswordResetRequestedEvent(email, token),
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await this.prisma.user.findUnique({
      where: { resetToken: hashedToken },
    });

    if (
      !user ||
      !user.resetTokenExpires ||
      user.resetTokenExpires < new Date()
    ) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });
  }

  generatePendingGoogleToken(profile: GoogleProfile): string {
    const payload = {
      type: "pending_google",
      id: profile.id,
      email: profile.email,
      displayName: profile.displayName,
      picture: profile.picture,
      accessToken: profile.accessToken,
      refreshToken: profile.refreshToken || null,
    };
    // Short-lived — user has 10 minutes to enter their access code
    return this.jwtService.sign(payload, { expiresIn: "10m" });
  }

  async completeGoogleSignup(
    pendingToken: string,
    accessCode: string,
  ): Promise<{ user: User; token: string }> {
    // Verify the pending token
    let payload: Record<string, string>;
    try {
      payload = this.jwtService.verify(pendingToken);
    } catch {
      throw new UnauthorizedException(
        "Your Google session has expired. Please try signing in again.",
      );
    }

    if (payload["type"] !== "pending_google") {
      throw new UnauthorizedException("Invalid session token.");
    }

    const profile: GoogleProfile = {
      id: payload["id"],
      email: payload["email"],
      displayName: payload["displayName"],
      picture: payload["picture"],
      accessToken: payload["accessToken"],
      refreshToken: payload["refreshToken"] || "",
    };

    // Race condition guard — user might already exist
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ googleId: profile.id }, { email: profile.email }] },
    });
    if (existingUser) {
      const token = await this.generateToken(existingUser);
      return { user: existingUser, token };
    }

    // Validate + consume the access code
    const waitlistEntry = await this.prisma.waitlist.findFirst({
      where: { email: profile.email, accessCode, status: "APPROVED" },
    });

    if (!waitlistEntry) {
      throw new BadRequestException(
        "Invalid access code. Please check your invitation email.",
      );
    }

    await this.prisma.waitlist.update({
      where: { id: waitlistEntry.id },
      data: { accessCode: null },
    });

    // Create user — Gmail not connected yet (no Gmail scopes were requested)
    const unusablePassword = `google_oauth_${crypto.randomBytes(24).toString("hex")}`;
    const user = await this.prisma.user.create({
      data: {
        email: profile.email,
        name: profile.displayName,
        picture: profile.picture,
        googleId: profile.id,
        password: unusablePassword,
        gmailConnected: false,
      },
    });

    this.eventEmitter.emit(
      "auth.signedUp",
      new UserSignedUpEvent(user.id, user.email, user.name || "there"),
    );

    const token = await this.generateToken(user);
    return { user, token };
  }

  generateOauthTicket(userId: string, nonce: string): string {
    const payload = { sub: userId, type: "oauth_ticket", nonce };
    // Short expiration (2 minutes) for security
    return this.jwtService.sign(payload, { expiresIn: "2m" });
  }

  async validateOauthTicket(
    ticket: string,
    expectedNonce: string,
  ): Promise<string> {
    try {
      const payload = this.jwtService.verify(ticket);
      if (payload.type !== "oauth_ticket") {
        throw new UnauthorizedException("Invalid token type");
      }
      if (payload.nonce !== expectedNonce) {
        throw new UnauthorizedException("Invalid authentication nonce");
      }
      return payload.sub;
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        throw e;
      }
      throw new UnauthorizedException("Invalid or expired ticket");
    }
  }

  async unsubscribe(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      if (!payload || !payload.email) {
        throw new BadRequestException("Invalid token payload");
      }

      const email = payload.email;

      // 1. Unsubscribe from waitlist if present
      const waitlistEntry = await this.prisma.waitlist.findUnique({
        where: { email },
      });

      if (waitlistEntry) {
        await this.prisma.waitlist.update({
          where: { email },
          data: {
            status: "REJECTED",
            notes: "Unsubscribed via automated email link.",
          },
        });
      }

      // 2. Unsubscribe from registered user if present
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        // Disable user activity
        await this.prisma.user.update({
          where: { email },
          data: { isActive: false },
        });

        // Disable all of their schedules
        await this.prisma.summarySchedule.updateMany({
          where: { userId: user.id },
          data: { isActive: false },
        });
      }

      return {
        success: true,
        message: "Successfully unsubscribed. You will not receive any more communications.",
      };
    } catch (error) {
      throw new BadRequestException("Invalid or expired unsubscribe link.");
    }
  }

  verifyToken(token: string): JwtPayload {
    return this.jwtService.verify(token);
  }

  async verifyUnsubscribeToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      if (!payload || !payload.email) {
        throw new BadRequestException("Invalid token payload");
      }

      const email = payload.email;

      // Look up registered user first
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        return {
          success: true,
          type: "registered" as const,
          email,
          preferences: {
            subscribePromo: user.subscribePromo,
            subscribeDailyBrief: user.isActive,
            subscribeAlerts: user.subscribeAlerts,
          },
        };
      }

      // Look up waitlist entry
      const waitlistEntry = await this.prisma.waitlist.findUnique({
        where: { email },
      });

      if (waitlistEntry) {
        return {
          success: true,
          type: "waitlist" as const,
          email,
          status: waitlistEntry.status,
        };
      }

      throw new BadRequestException("No waitlist or user record associated with this token.");
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Invalid or expired unsubscribe link."
      );
    }
  }

  async updateEmailPreferences(
    token: string,
    preferences: {
      subscribePromo?: boolean;
      subscribeDailyBrief?: boolean;
      subscribeAlerts?: boolean;
      optOutWaitlist?: boolean;
    }
  ) {
    try {
      const payload = this.jwtService.verify(token);
      if (!payload || !payload.email) {
        throw new BadRequestException("Invalid token payload");
      }

      const email = payload.email;

      // 1. Process Waitlist opt-out if specified
      if (preferences.optOutWaitlist) {
        const waitlistEntry = await this.prisma.waitlist.findUnique({
          where: { email },
        });

        if (waitlistEntry) {
          await this.prisma.waitlist.update({
            where: { email },
            data: {
              status: "REJECTED",
              notes: "Opted out via preferences page.",
            },
          });
          return {
            success: true,
            message: "Successfully opted out from the waitlist.",
          };
        }
      }

      // 2. Process Registered User preferences
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        const dataToUpdate: any = {};
        if (preferences.subscribePromo !== undefined) {
          dataToUpdate.subscribePromo = preferences.subscribePromo;
        }
        if (preferences.subscribeAlerts !== undefined) {
          dataToUpdate.subscribeAlerts = preferences.subscribeAlerts;
        }
        if (preferences.subscribeDailyBrief !== undefined) {
          dataToUpdate.isActive = preferences.subscribeDailyBrief;
        }

        await this.prisma.user.update({
          where: { email },
          data: dataToUpdate,
        });

        // Sync schedules: if user disables briefs, disable schedules
        if (preferences.subscribeDailyBrief !== undefined) {
          await this.prisma.summarySchedule.updateMany({
            where: { userId: user.id },
            data: { isActive: preferences.subscribeDailyBrief },
          });
        }

        return {
          success: true,
          message: "Preferences updated successfully.",
        };
      }

      throw new BadRequestException("No associated account found for this email.");
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to update email preferences."
      );
    }
  }
}
