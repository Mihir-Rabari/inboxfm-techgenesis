import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import * as crypto from "crypto";

@Injectable()
export class WaitlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async joinWaitlist(
    email: string,
    name?: string,
    role?: string,
    emailVolume?: string,
    biggestPain?: string,
    whyInboxfm?: string,
    notes?: string,
  ) {
    const existing = await this.prisma.waitlist.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.status === "APPROVED") {
        throw new ConflictException(
          "This email has already been approved. Check your inbox for your access code.",
        );
      }
      throw new ConflictException("This email is already on the waitlist.");
    }

    const entry = await this.prisma.waitlist.create({
      data: {
        email,
        name,
        role,
        emailVolume,
        biggestPain,
        whyInboxfm,
        notes,
      },
    });

    await this.mailService.sendWaitlistConfirmationEmail(
      email,
      name || "there",
    );

    return {
      success: true,
      id: entry.id,
      message: "Your application has been received!",
    };
  }

  async signupCheck(email: string, name?: string) {
    // 1. Check if user already exists
    const userExists = await this.prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return {
        status: "REGISTERED",
        message: "This email is already registered. Please sign in.",
      };
    }

    // 2. Check if email exists in waitlist
    const existing = await this.prisma.waitlist.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.status === "APPROVED") {
        return {
          status: "APPROVED",
          message: "You have been approved! Please enter your access code.",
        };
      }
      return {
        status: "WAITLISTED",
        message:
          "You're still on the waitlist! We are rolling out access in batches. You're still on the list.",
      };
    }

    // 3. Automatically join the waitlist if not present
    await this.prisma.waitlist.create({
      data: { email, name },
    });

    await this.mailService.sendWaitlistConfirmationEmail(
      email,
      name || "there",
    );

    return {
      status: "NEW_WAITLISTED",
      message: "You're on the waitlist! We've added you to the list.",
    };
  }

  async getAllEntries() {
    return this.prisma.waitlist.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async approveEntry(id: string) {
    const entry = await this.prisma.waitlist.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException("Waitlist entry not found");
    if (entry.status === "APPROVED")
      throw new BadRequestException("Already approved");

    // Generate a readable, unique access code
    const accessCode = `IFM-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    const updated = await this.prisma.waitlist.update({
      where: { id },
      data: { status: "APPROVED", accessCode },
    });

    // Send the approval email
    await this.mailService.sendWaitlistApprovedEmail(
      entry.email,
      entry.name || "there",
      accessCode,
    );

    return updated;
  }

  async rejectEntry(id: string) {
    const entry = await this.prisma.waitlist.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException("Waitlist entry not found");

    return this.prisma.waitlist.update({
      where: { id },
      data: { status: "REJECTED", accessCode: null },
    });
  }

  async waitlistEntry(id: string) {
    const entry = await this.prisma.waitlist.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException("Waitlist entry not found");

    return this.prisma.waitlist.update({
      where: { id },
      data: { status: "WAITLISTED", accessCode: null },
    });
  }

  async deleteEntry(id: string) {
    const entry = await this.prisma.waitlist.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException("Waitlist entry not found");
    return this.prisma.waitlist.delete({ where: { id } });
  }

  async validateAndConsumeCode(
    email: string,
    accessCode: string,
  ): Promise<boolean> {
    const entry = await this.prisma.waitlist.findFirst({
      where: { email, accessCode, status: "APPROVED" },
    });

    if (!entry) return false;

    // Consume the code so it can't be reused
    await this.prisma.waitlist.update({
      where: { id: entry.id },
      data: { accessCode: null },
    });

    return true;
  }
}
