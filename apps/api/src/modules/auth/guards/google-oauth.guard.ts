import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class GoogleOauthGuard extends AuthGuard("google") {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const ticket = request.query.ticket;

    if (ticket) {
      // Gmail connection flow — needs Gmail scopes + offline refresh token
      return {
        state: ticket,
        scope: [
          "email",
          "profile",
          "https://www.googleapis.com/auth/gmail.readonly",
          "https://www.googleapis.com/auth/calendar.events",
          "https://www.googleapis.com/auth/calendar",
        ],
        accessType: "offline",
        prompt: "consent",
      };
    }

    // Direct login/signup — basic profile only
    return {
      state: "direct_login",
      scope: ["email", "profile"],
      prompt: "select_account",
    };
  }
}
