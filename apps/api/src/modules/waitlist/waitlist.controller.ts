import { Controller, Post, Body, HttpCode } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { WaitlistService } from "./waitlist.service";

@Controller("waitlist")
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post("join")
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async joinWaitlist(
    @Body() body: {
      email: string;
      name?: string;
      role?: string;
      emailVolume?: string;
      biggestPain?: string;
      whyInboxfm?: string;
      notes?: string;
    },
  ) {
    return this.waitlistService.joinWaitlist(
      body.email,
      body.name,
      body.role,
      body.emailVolume,
      body.biggestPain,
      body.whyInboxfm,
      body.notes,
    );
  }

  @Post("signup-check")
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async signupCheck(@Body() body: { email: string; name?: string }) {
    return this.waitlistService.signupCheck(body.email, body.name);
  }
}
