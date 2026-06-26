import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly frontendUrl: string;
  private readonly fromEmail = "notifications@vedlabs.tech";

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {
    const frontendUrl = this.configService.get<string>("FRONTEND_URL");
    if (!frontendUrl && process.env.NODE_ENV === "production") {
      throw new Error("FRONTEND_URL is not defined in production environment");
    }
    const baseUri = frontendUrl || "http://localhost:3000";
    // In production, to align the link domain with the sender domain (notifications@vedlabs.tech)
    // and prevent emails from going into spam, we use https://vedlabs.tech as the base URL.
    // In development or local environments, we keep the original frontendUrl.
    this.frontendUrl = baseUri.includes("inboxfm.me")
      ? "https://vedlabs.tech"
      : baseUri;

    const apiKey = this.configService.get<string>("RESEND_API_KEY");
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    this.resend = new Resend(apiKey);
    this.logger.log(`MailService initialized (from: ${this.fromEmail}, links: ${this.frontendUrl})`);
  }

  /**
   * Helper utility to strip HTML and provide a robust plain text version for email clients.
   * This significantly reduces spam scores and ensures compatibility.
   */
  private stripHtml(html: string): string {
    if (!html) return "";
    return html
      .replace(/<style([\s\S]*?)<\/style>/gi, "")
      .replace(/<script([\s\S]*?)<\/script>/gi, "")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/h1>/gi, "\n\n")
      .replace(/<\/h2>/gi, "\n\n")
      .replace(/<\/h3>/gi, "\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<(?:.|\n)*?>/gm, "")
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&gt;/g, ">")
      .replace(/&lt;/g, "<")
      .replace(/&amp;/g, "&")
      .replace(/&nbsp;/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  public parseMarkdownToHtml(markdown: string): string {
    if (!markdown) return "";
    
    let html = markdown;

    // 1. Headers (e.g., ### Heading 3, ## Heading 2, # Heading 1)
    html = html.replace(/^### (.*?)$/gm, '<h3 style="font-family: \'Archivo Black\', \'Outfit\', -apple-system, sans-serif; font-size: 18px; font-weight: 900; color: #E5D8C9; margin: 24px 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em;">$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2 style="font-family: \'Archivo Black\', \'Outfit\', -apple-system, sans-serif; font-size: 22px; font-weight: 900; color: #E5D8C9; margin: 28px 0 14px 0; border-bottom: 2px solid #000000; padding-bottom: 6px;">$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1 style="font-family: \'Archivo Black\', \'Outfit\', -apple-system, sans-serif; font-size: 28px; font-weight: 900; color: #E5D8C9; margin: 32px 0 16px 0;">$1</h1>');

    // 2. Bold (**text** or __text__)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #E5D8C9; font-weight: 700;">$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong style="color: #E5D8C9; font-weight: 700;">$1</strong>');

    // 3. Italic (*text* or _text_)
    html = html.replace(/\*(.*?)\*/g, '<em style="color: #B8B8B8; font-style: italic;">$1</em>');
    html = html.replace(/_(.*?)_/g, '<em style="color: #B8B8B8; font-style: italic;">$1</em>');

    // 4. Code block (```code```)
    html = html.replace(/```([\s\S]*?)```/g, '<pre style="background-color: #121212; border: 2px solid #000000; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 13px; color: #E5D8C9; overflow-x: auto; margin: 16px 0; box-shadow: 3px 3px 0px 0px #000000;">$1</pre>');

    // 5. Inline Code (`code`)
    html = html.replace(/`(.*?)`/g, '<code style="background-color: #121212; border: 1px solid #000000; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; color: #FF6A00;">$1</code>');

    // 6. Horizontal Rules (---)
    html = html.replace(/^---$/gm, '<div style="height: 2px; background-color: #000000; margin: 32px 0;"></div>');

    // 7. Unordered Lists (- item or * item)
    const lines = html.split("\n");
    let inList = false;
    const processedLines = lines.map(line => {
      const match = line.match(/^[-*+]\s+(.*)$/);
      if (match) {
        let prefix = "";
        if (!inList) {
          inList = true;
          prefix = '<ul style="margin: 16px 0; padding-left: 20px; list-style-type: square; color: #B8B8B8;">';
        }
        return prefix + `<li style="margin-bottom: 8px; font-size: 14px; line-height: 1.6; color: #B8B8B8;">${match[1]}</li>`;
      } else {
        if (inList) {
          inList = false;
          return '</ul>' + line;
        }
        return line;
      }
    });
    if (inList) {
      processedLines.push('</ul>');
    }
    html = processedLines.join("\n");

    // 8. Paragraphs & Line breaks
    const blocks = html.split(/\n\s*\n/);
    const wrappedBlocks = blocks.map(block => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      
      if (trimmed.startsWith("<h") || trimmed.startsWith("<ul") || trimmed.startsWith("<li") || trimmed.startsWith("<pre") || trimmed.startsWith("<div") || trimmed.startsWith("</ul")) {
        return trimmed;
      }
      
      return `<p style="margin: 0 0 16px 0; font-size: 14px; color: #B8B8B8; line-height: 1.6;">${trimmed.replace(/\n/g, "<br>")}</p>`;
    });

    return wrappedBlocks.join("\n").trim();
  }

  private getBaseTemplate(content: string, preheader: string = "", recipientEmail?: string): string {
    const year = new Date().getFullYear();
    const unsubscribeToken = recipientEmail
      ? this.jwtService.sign({ email: recipientEmail }, { expiresIn: "36500d" })
      : "";
    const unsubscribeUrl = unsubscribeToken
      ? `${this.frontendUrl}/unsubscribe?token=${unsubscribeToken}`
      : `${this.frontendUrl}/settings`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="dark only">
    <meta name="supported-color-schemes" content="dark only">
    <title>Inbox FM</title>
    <style>
        :root { color-scheme: dark only; supported-color-schemes: dark only; }
        body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #050505; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #B8B8B8; }
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }

        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Outfit:wght@400;500;700;900&display=swap');

        a { color: #FF6A00; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body style="margin:0;padding:0;background-color:#050505;color:#B8B8B8;">
    <div role="article" aria-roledescription="email" lang="en" style="background-color:#050505;padding:40px 0;">
        <span style="display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; max-height:0; max-width:0; overflow:hidden;">${preheader}</span>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#050505;">
            <tr>
                <td align="center" style="padding: 0 16px;">
                    <table class="container" role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background-color: #161519; border: 3px solid #000000; border-radius: 16px; overflow: hidden; box-shadow: 6px 6px 0px 0px #000000;">
                        <!-- Header -->
                        <tr>
                            <td style="padding: 40px 48px 24px 48px; text-align: left; background-color: #161519;">
                                <a href="${this.frontendUrl}" style="text-decoration: none; display: inline-block; color: #FFFFFF; font-family: 'Archivo Black', 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 28px; font-weight: normal; letter-spacing: -0.05em; text-transform: uppercase;">
                                    INBOXFM
                                </a>
                            </td>
                        </tr>

                        <!-- Content Body -->
                        <tr>
                            <td style="padding: 16px 48px 48px 48px; background-color: #161519; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 15px; line-height: 1.6; color: #B8B8B8;">
                                ${content}
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="padding: 40px; text-align: left; background-color: #0F0E11; border-top: 3px solid #000000; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td style="padding-bottom: 24px;">
                                            <div style="font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; color: #FFFFFF; font-size: 16px; font-weight: 900; letter-spacing: -0.02em; text-transform: uppercase;">VEDLABS</div>
                                            <div style="margin-top: 4px; color: #707070; font-size: 12px; font-weight: 500;">High-Performance Digital Tools</div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="border-top: 2px solid #000000; padding-top: 24px;">
                                            <p style="color: #707070; font-size: 12px; line-height: 1.6; margin: 0 0 12px 0;">
                                                © ${year} VedLabs. All rights reserved.<br>
                                                Anand, Gujarat, India - 388580
                                            </p>
                                            <p style="color: #707070; font-size: 11px; line-height: 1.6; margin: 0;">
                                                This is a transactional email related to your Inbox FM account.<br>
                                                If you don&apos;t need these summaries anymore, you can turn them off <a href="${unsubscribeUrl}" style="color: #707070; text-decoration: underline; font-weight: 700;">here</a> or change your delivery schedule and preferences.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>`;
  }
  async sendWaitlistConfirmationEmail(to: string, name: string): Promise<void> {
    const content = `
            <div style="display: inline-block; border: 2px solid #000000; padding: 6px 16px; border-radius: 4px; font-size: 11px; font-weight: 900; color: #FF6A00; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 20px; background-color: #211F24; box-shadow: 2px 2px 0px 0px #000000;">Waitlist Update</div>
            <h1 style="font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-size: 32px; font-weight: 900; line-height: 1.15; letter-spacing: -0.04em; margin: 0 0 20px 0; color: #E5D8C9;">You&apos;re on the waitlist, ${name || "there"}.</h1>
            <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; color: #B8B8B8;">Thanks for signing up for Inbox FM. We&apos;ve added your email to the waitlist and will let you know as soon as access becomes available.</p>

            <div style="background-color: #211F24; border: 2px solid #000000; padding: 32px; margin: 32px 0; border-radius: 12px; box-shadow: 4px 4px 0px 0px #000000;">
                <h3 style="margin-top: 0; font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #E5D8C9; margin-bottom: 16px;">What happens next?</h3>
                <div style="margin-bottom: 0; font-size: 15px; color: #B8B8B8; line-height: 1.8;">
                    <span style="color: #FF6A00; font-weight: 900; margin-right: 8px;">01</span> We&apos;ll review waitlist requests in batches<br>
                    <span style="color: #FF6A00; font-weight: 900; margin-right: 8px;">02</span> When it&apos;s your turn, you&apos;ll receive an access code by email<br>
                    <span style="color: #FF6A00; font-weight: 900; margin-right: 8px;">03</span> Use that code to create your account and get started
                </div>
            </div>

            <p style="color: #707070; font-size: 13px; margin-top: 32px;">You don&apos;t need to do anything else right now. We&apos;ll notify you at this same email address once access opens up for you.</p>
        `;

    await this.sendMail(
      to,
      "You're on the Inbox FM waitlist 🕒",
      content,
      "We've added you to the waitlist and will email you when access opens.",
    );
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const content = `
            <div style="display: inline-block; border: 2px solid #000000; padding: 6px 16px; border-radius: 4px; font-size: 11px; font-weight: 900; color: #FF6A00; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 20px; background-color: #211F24; box-shadow: 2px 2px 0px 0px #000000;">Access Granted</div>
            <h1 style="font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-size: 32px; font-weight: 900; line-height: 1.15; letter-spacing: -0.04em; margin: 0 0 20px 0; color: #E5D8C9;">The Wait is Over, ${name || "Operator"}.</h1>
            <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; color: #B8B8B8;">You have officially entered the future of digital focus. No more noise. No more clutter. Just pure, high-fidelity intelligence delivered to your ears.</p>

            <div style="background-color: #211F24; border: 2px solid #000000; padding: 32px; margin: 32px 0; border-radius: 12px; box-shadow: 4px 4px 0px 0px #000000;">
                <h3 style="margin-top: 0; font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #E5D8C9; margin-bottom: 16px;">The Protocol:</h3>
                <div style="margin-bottom: 0; font-size: 15px; color: #B8B8B8; line-height: 1.8;">
                    <span style="color: #FF6A00; font-weight: 900; margin-right: 8px;">01</span> Connect your Gmail securely<br>
                    <span style="color: #FF6A00; font-weight: 900; margin-right: 8px;">02</span> Calibrate your Drop Time<br>
                    <span style="color: #FF6A00; font-weight: 900; margin-right: 8px;">03</span> Wake up to absolute clarity.
                </div>
            </div>

            <div style="margin-top: 40px;">
                <a href="${this.frontendUrl}/dashboard" style="display: inline-block; background-color: #FF6A00; color: #000000 !important; padding: 16px 32px; border-radius: 8px; border: 2px solid #000000; font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-size: 14px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 4px 4px 0px 0px #000000;">Initialize Dashboard</a>
            </div>
        `;

    await this.sendWelcomeEmailPlain(to, name, content);
  }

  // Extracted simple helper to avoid nested naming loops in typescript mocks
  private async sendWelcomeEmailPlain(to: string, name: string, content: string): Promise<void> {
    await this.sendMail(
      to,
      "Welcome to Inbox FM 🎧",
      content,
      "Your premium audio briefing experience starts here.",
    );
  }

  async sendLoginAlert(
    to: string,
    device: string = "New Device",
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email: to } });
    if (user && !user.subscribeAlerts) {
      this.logger.log(`Skipping login alert to ${to} (unsubscribed from alerts)`);
      return;
    }

    const content = `
            <div style="display: inline-block; border: 2px solid #000000; padding: 6px 16px; border-radius: 4px; font-size: 11px; font-weight: 900; color: #EF4444; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 20px; background-color: #211F24; box-shadow: 2px 2px 0px 0px #000000;">Security Alert</div>
            <h1 style="font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-size: 32px; font-weight: 900; line-height: 1.15; letter-spacing: -0.04em; margin: 0 0 20px 0; color: #E5D8C9;">New Sign-in Detected.</h1>
            <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; color: #B8B8B8;">Your Inbox FM account was just accessed from a <strong style="color: #E5D8C9; font-weight: 700;">${device}</strong>. If this was you, no further action is required.</p>

            <div style="background-color: #211F24; border: 2px solid #000000; padding: 32px; text-align: left; margin: 32px 0; border-radius: 12px; box-shadow: 4px 4px 0px 0px #000000;">
                <p style="margin-top: 0; margin-bottom: 24px; font-weight: 700; color: #E5D8C9;">Not you?</p>
                <a href="${this.frontendUrl}/profile" style="display: inline-block; background-color: #FFFFFF; color: #000000 !important; padding: 14px 28px; border-radius: 8px; border: 2px solid #000000; font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-size: 13px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 4px 4px 0px 0px #000000;">Secure Account</a>
            </div>
        `;

    await this.sendMail(
      to,
      "Security Alert: New Login 🔐",
      content,
      "A new login was detected on your account.",
    );
  }

  async sendPasswordReset(to: string, token: string): Promise<void> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;
    const content = `
            <div style="display: inline-block; border: 2px solid #000000; padding: 6px 16px; border-radius: 4px; font-size: 11px; font-weight: 900; color: #FF6A00; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 20px; background-color: #211F24; box-shadow: 2px 2px 0px 0px #000000;">Authentication</div>
            <h1 style="font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-size: 32px; font-weight: 900; line-height: 1.15; letter-spacing: -0.04em; margin: 0 0 20px 0; color: #E5D8C9;">Reset your Access Key.</h1>
            <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; color: #B8B8B8;">A password reset was requested for your account. This link will expire in 60 minutes for security purposes.</p>

            <div style="margin: 40px 0;">
                <a href="${resetUrl}" style="display: inline-block; background-color: #FF6A00; color: #000000 !important; padding: 16px 32px; border-radius: 8px; border: 2px solid #000000; font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-size: 14px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 4px 4px 0px 0px #000000;">Reset Password</a>
            </div>

            <div style="height: 2px; background-color: #000000; margin: 32px 0;"></div>
            <p style="color: #707070; font-size: 13px; margin: 0;">If you did not initiate this request, you can safely ignore this communication.</p>
        `;

    await this.sendMail(
      to,
      "Reset your Inbox FM password 🔑",
      content,
      "Click here to reset your password.",
    );
  }

  async sendBroadcast(
    to: string,
    subject: string,
    message: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email: to } });
    if (user && !user.subscribePromo) {
      this.logger.log(`Skipping broadcast to ${to} (unsubscribed from promo)`);
      return;
    }

    const content = `
            <div style="display: inline-block; border: 2px solid #000000; padding: 6px 16px; border-radius: 4px; font-size: 11px; font-weight: 900; color: #FF6A00; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 20px; background-color: #211F24; box-shadow: 2px 2px 0px 0px #000000;">Inbox FM HQ</div>
            <h1 style="font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-size: 32px; font-weight: 900; line-height: 1.15; letter-spacing: -0.04em; margin: 0 0 20px 0; color: #E5D8C9;">A quick update 📢</h1>
            <div style="margin-bottom: 32px; font-family: 'Outfit', sans-serif;">
                ${this.parseMarkdownToHtml(message)}
            </div>

            <div style="text-align: left; margin: 40px 0 20px 0;">
                <a href="${this.frontendUrl}/dashboard" style="display: inline-block; background-color: #FF6A00; color: #000000 !important; padding: 16px 32px; border-radius: 8px; border: 2px solid #000000; font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-size: 14px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 4px 4px 0px 0px #000000;">Jump In</a>
            </div>
        `;

    await this.sendMail(
      to,
      subject,
      content,
      "Important update from the Inbox FM team.",
    );
  }

  async sendMarketingEmail(
    to: string,
    subject: string,
    content: string,
    fromEmail?: string,
  ): Promise<void> {
    try {
      const html = this.getBaseTemplate(content, subject, to);
      const plainText = this.stripHtml(html);
      const fromAddress = fromEmail || this.fromEmail;
      const unsubscribeToken = this.jwtService.sign({ email: to }, { expiresIn: "36500d" });
      const { error } = await this.resend.emails.send({
        from: `Inbox FM <${fromAddress}>`,
        to,
        subject,
        html,
        text: plainText,
        headers: {
          "List-Unsubscribe": `<${this.frontendUrl}/unsubscribe?token=${unsubscribeToken}>`,
        },
      });
      if (error) {
        throw new Error(
          `Failed to send marketing email to ${to} (subject: ${subject}): ${error.message}`,
        );
      }
      this.logger.log(`Marketing email sent to ${to}: ${subject} (from: ${fromAddress})`);
    } catch (error) {
      this.logger.error(`Failed to send marketing email to ${to}: ${error.message}`);
      throw error;
    }
  }

  private stripStructuredSummaryMarker(textSummary: string): string {
    const marker = "__INBOXFM_STRUCTURED_JSON__";
    if (!textSummary?.startsWith(marker)) return textSummary || "";

    const newlineIdx = textSummary.indexOf("\n");
    if (newlineIdx === -1) return "";

    return textSummary.slice(newlineIdx + 1).trim();
  }

  async sendDailyBriefEmail(
    user: { email: string; name: string | null },
    brief: {
      id: string;
      textSummary: string;
      audioUrl: string | null;
      audioDuration: number | null;
      emailsProcessed: number;
    },
  ): Promise<void> {
    const dbUser = await this.prisma.user.findUnique({ where: { email: user.email } });
    if (dbUser && !dbUser.isActive) {
      this.logger.log(`Skipping daily brief email to ${user.email} (user inactive/unsubscribed from digests)`);
      return;
    }

    const greeting = user.name ? user.name.split(" ")[0] : "there";
    const cleanSummary = this.stripStructuredSummaryMarker(brief.textSummary);
    const summaryPreview =
      cleanSummary.length > 500
        ? `${cleanSummary.slice(0, 500)}...`
        : cleanSummary;

    const duration = brief.audioDuration
      ? `${Math.floor(brief.audioDuration / 60)}:${String(brief.audioDuration % 60).padStart(2, "0")}`
      : "~3:00";

    const content = `
            <div style="display: inline-block; border: 2px solid #000000; padding: 6px 16px; border-radius: 4px; font-size: 11px; font-weight: 900; color: #FF6A00; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 20px; background-color: #211F24; box-shadow: 2px 2px 0px 0px #000000;">Daily Report</div>
            <h1 style="font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-size: 32px; font-weight: 900; line-height: 1.15; letter-spacing: -0.04em; margin: 0 0 20px 0; color: #E5D8C9;">Morning Recap, ${greeting}.</h1>
            <p style="font-size: 15px; line-height: 1.6; color: #B8B8B8; margin-bottom: 24px;">We have distilled <strong style="color: #E5D8C9; font-weight: 700;">${brief.emailsProcessed} communications</strong> into a single, high-fidelity briefing.</p>

            <div style="background-color: #211F24; border: 2px solid #000000; padding: 40px; margin: 32px 0; border-radius: 12px; text-align: center; box-shadow: 4px 4px 0px 0px #000000;">
                <div style="font-size: 48px; margin-bottom: 20px; line-height: 1;">🎙️</div>
                <div style="display: inline-block; margin-bottom: 28px; text-align: center;">
                    <span style="display: inline-block; border: 2px solid #000000; padding: 6px 16px; border-radius: 4px; font-size: 11px; font-weight: 900; color: #FF6A00; letter-spacing: 0.1em; text-transform: uppercase; margin-right: 8px; background-color: #161519; box-shadow: 2px 2px 0px 0px #000000;">${duration} MIN</span>
                    <span style="display: inline-block; border: 2px solid #000000; padding: 6px 16px; border-radius: 4px; font-size: 11px; font-weight: 900; color: #FFFFFF; letter-spacing: 0.1em; text-transform: uppercase; background-color: #161519; box-shadow: 2px 2px 0px 0px #000000;">${brief.emailsProcessed} ITEMS</span>
                </div>
                <br>
                ${
                  brief.audioUrl
                    ? `
                    <a href="${this.frontendUrl}/player/${brief.id}" style="display: inline-block; background-color: #FF6A00; color: #000000 !important; padding: 16px 32px; border-radius: 8px; border: 2px solid #000000; font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-size: 14px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 4px 4px 0px 0px #000000;">▶ Begin Briefing</a>
                `
                    : '<p style="color: #707070; font-style: italic; font-weight: 700; font-size: 14px; margin: 0;">Audio processing in progress...</p>'
                }
            </div>

            <div style="border-left: 4px solid #FF6A00; padding-left: 24px; margin: 32px 0;">
                <h3 style="margin-top: 0; font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-weight: 900; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #707070; margin-bottom: 8px;">Executive Summary</h3>
                <p style="font-size: 15px; margin-bottom: 0; line-height: 1.8; color: #B8B8B8; font-weight: 500;">${summaryPreview || "No summary available yet."}</p>
            </div>

            <div style="margin-top: 32px; text-align: left;">
                <a href="${this.frontendUrl}/dashboard" style="color: #FF6A00; font-weight: 900; text-decoration: none; text-transform: uppercase; font-size: 11px; letter-spacing: 0.15em; font-family: 'Archivo Black', 'Outfit', sans-serif;">View Dashboard Analytics →</a>
            </div>
        `;

    await this.sendMail(
      user.email,
      `🎧 Your Daily Briefing - ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      content,
      `You have ${brief.emailsProcessed} emails summarized in your audio brief.`,
    );
  }

  async sendBriefErrorEmail(
    user: { email: string; name: string | null },
    error: string,
  ): Promise<void> {
    const dbUser = await this.prisma.user.findUnique({ where: { email: user.email } });
    if (dbUser && !dbUser.subscribeAlerts) {
      this.logger.log(`Skipping brief error email to ${user.email} (unsubscribed from alerts)`);
      return;
    }

    const isAuthError =
      error.toLowerCase().includes("credential") ||
      error.toLowerCase().includes("auth") ||
      error.toLowerCase().includes("token");

    const content = `
            <div style="display: inline-block; border: 2px solid #000000; padding: 6px 16px; border-radius: 4px; font-size: 11px; font-weight: 900; color: #EF4444; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 20px; background-color: #211F24; box-shadow: 2px 2px 0px 0px #000000;">System Alert</div>
            <h1 style="font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-size: 32px; font-weight: 900; line-height: 1.15; letter-spacing: -0.04em; margin: 0 0 20px 0; color: #E5D8C9;">Briefing Interrupted.</h1>
            <p style="font-size: 15px; line-height: 1.6; color: #B8B8B8;">We encountered a technical hurdle while preparing your morning recap.</p>

            ${
              isAuthError
                ? `
                <div style="background-color: #211F24; border: 2px solid #EF4444; padding: 32px; margin: 32px 0; border-radius: 12px; box-shadow: 4px 4px 0px 0px #000000;">
                    <h3 style="margin-top: 0; font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #EF4444; margin-bottom: 12px;">Authentication Expired</h3>
                    <p style="margin-bottom: 0; font-size: 15px; color: #B8B8B8; line-height: 1.6; font-family: 'Outfit', sans-serif;">
                        Your Gmail connection has expired or been revoked by Google. Re-authenticating your account will restore service immediately.
                    </p>
                </div>
                <div style="margin-top: 32px;">
                    <a href="${this.frontendUrl}/settings" style="display: inline-block; background-color: #FF6A00; color: #000000 !important; padding: 16px 32px; border-radius: 8px; border: 2px solid #000000; font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-size: 14px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 4px 4px 0px 0px #000000;">Reconnect Now</a>
                </div>
            `
                : `
                <div style="background-color: #211F24; border: 2px solid #EF4444; padding: 32px; margin: 32px 0; border-radius: 12px; box-shadow: 4px 4px 0px 0px #000000;">
                    <h3 style="margin-top: 0; font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #EF4444; margin-bottom: 12px;">Transmission Status</h3>
                    <p style="margin-bottom: 0; font-size: 15px; color: #B8B8B8; line-height: 1.6; font-family: 'Outfit', sans-serif;">
                        Due to a temporary technical failure, your audio digest could not be prepared at this scheduled time. 
                        Our <strong style="color: #FF6A00; font-weight: 700;">automatic retry system will trigger shortly</strong> to attempt generation again. 
                        Our engineers have been notified that you encountered this issue, and we are extremely regretful for this inconvenience.
                    </p>
                </div>
                <div style="margin-top: 32px;">
                    <a href="${this.frontendUrl}/dashboard" style="display: inline-block; background-color: #FF6A00; color: #000000 !important; padding: 16px 32px; border-radius: 8px; border: 2px solid #000000; font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-size: 14px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 4px 4px 0px 0px #000000;">Return to Dashboard</a>
                </div>
            `
            }
        `;

    await this.sendMail(
      user.email,
      `⚠️ Issue with your Daily Briefing`,
      content,
      "We encountered an error while processing your emails.",
    );
  }

  async sendWaitlistApprovedEmail(
    to: string,
    name: string,
    accessCode: string,
  ): Promise<void> {
    const waitlist = await this.prisma.waitlist.findUnique({ where: { email: to } });
    if (waitlist && waitlist.status === "REJECTED") {
      this.logger.log(`Skipping waitlist approval email to ${to} (unsubscribed/rejected status)`);
      return;
    }

    const content = `
            <div style="display: inline-block; border: 2px solid #000000; padding: 6px 16px; border-radius: 4px; font-size: 11px; font-weight: 900; color: #FF6A00; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 20px; background-color: #211F24; box-shadow: 2px 2px 0px 0px #000000;">Access Granted</div>
            <h1 style="font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-size: 32px; font-weight: 900; line-height: 1.15; letter-spacing: -0.04em; margin: 0 0 20px 0; color: #E5D8C9;">You're In, ${name}.</h1>
            <p style="font-size: 15px; line-height: 1.6; color: #B8B8B8;">Your waitlist application has been approved. You now have exclusive access to Inbox FM — the AI-powered audio briefing system for digital professionals.</p>

            <div style="background-color: #211F24; border: 2px solid #FF6A00; border-radius: 12px; padding: 36px 40px; margin: 36px 0; text-align: center; box-shadow: 4px 4px 0px 0px #000000;">
                <p style="color: #707070; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; margin: 0 0 12px 0;">Your Access Code</p>
                <div style="font-family: 'Outfit', monospace; font-size: 32px; font-weight: 900; color: #FF6A00; letter-spacing: 0.15em;">${accessCode}</div>
                <p style="color: #707070; font-size: 12px; margin: 12px 0 0 0;">Enter this code during sign-up to create your account.</p>
            </div>

            <div style="background-color: #211F24; border: 2px solid #000000; padding: 28px 32px; margin: 28px 0; border-radius: 12px; box-shadow: 4px 4px 0px 0px #000000;">
                <h3 style="margin-top: 0; font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-weight: 900; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; color: #E5D8C9; margin-bottom: 12px;">How to Get Started:</h3>
                <div style="font-size: 14px; color: #B8B8B8; line-height: 2;">
                    <span style="color: #FF6A00; font-weight: 900; margin-right: 8px;">01</span> Go to the sign-up page<br>
                    <span style="color: #FF6A00; font-weight: 900; margin-right: 8px;">02</span> Enter your details & the access code above<br>
                    <span style="color: #FF6A00; font-weight: 900; margin-right: 8px;">03</span> Connect your Gmail & start tuning in
                </div>
            </div>

            <div style="margin-top: 40px;">
                <a href="${this.frontendUrl}/signup" style="display: inline-block; background-color: #FF6A00; color: #000000 !important; padding: 16px 32px; border-radius: 8px; border: 2px solid #000000; font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-size: 14px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 4px 4px 0px 0px #000000;">Create Your Account</a>
            </div>

            <div style="height: 2px; background-color: #000000; margin: 32px 0;"></div>
            <p style="color: #707070; font-size: 13px; margin: 0;">This access code is unique to you. Do not share it. It will be consumed upon account creation.</p>
        `;

    await this.sendMail(
      to,
      "You're in — Your Inbox FM Access Code 🎧",
      content,
      `Your access code: ${accessCode}`,
    );
  }

  private async sendMail(
    to: string,
    subject: string,
    content: string,
    preheader: string,
  ): Promise<void> {
    try {
      const html = this.getBaseTemplate(content, preheader, to);
      const plainText = this.stripHtml(html);
      const unsubscribeToken = this.jwtService.sign({ email: to }, { expiresIn: "36500d" });
      const { error } = await this.resend.emails.send({
        from: `Inbox FM <${this.fromEmail}>`,
        to,
        subject,
        html,
        text: plainText,
        headers: {
          "List-Unsubscribe": `<${this.frontendUrl}/unsubscribe?token=${unsubscribeToken}>`,
        },
      });
      if (error) {
        throw new Error(
          `Failed to send email to ${to} (subject: ${subject}): ${error.message}`,
        );
      }
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw error;
    }
  }

  async sendSupportConfirmation(
    email: string,
    subject: string,
    ticketId: string,
  ): Promise<void> {
    const content = `
            <div style="display: inline-block; border: 2px solid #000000; padding: 6px 16px; border-radius: 4px; font-size: 11px; font-weight: 900; color: #FF6A00; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 20px; background-color: #211F24; box-shadow: 2px 2px 0px 0px #000000;">Support Transmission</div>
            <h1 style="font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-size: 32px; font-weight: 900; line-height: 1.15; letter-spacing: -0.04em; margin: 0 0 20px 0; color: #E5D8C9;">We've Received Your Signal.</h1>
            <p style="font-size: 15px; line-height: 1.6; color: #B8B8B8; margin-bottom: 24px;">Our team has been notified. We will review your request and get back to you within 24-48 business hours.</p>

            <div style="background-color: #211F24; border: 2px solid #000000; padding: 32px; border-radius: 12px; margin: 32px 0; box-shadow: 4px 4px 0px 0px #000000;">
                <p style="margin: 0; font-size: 10px; color: #707070; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 900;">Ticket Identifier</p>
                <p style="margin: 8px 0 0 0; font-size: 28px; font-weight: 900; color: #FF6A00; font-family: 'Outfit', sans-serif;">#${ticketId}</p>
            </div>

            <p style="font-weight: 700; color: #E5D8C9; font-size: 14px; margin-bottom: 8px;">Your Request:</p>
            <p style="padding: 16px; background-color: #121212; border: 2px solid #000000; border-radius: 8px; font-size: 14px; line-height: 1.6; color: #B8B8B8; margin: 0; box-shadow: 3px 3px 0px 0px #000000;">${subject}</p>
        `;

    await this.sendMail(
      email,
      `Ticket #${ticketId} - Signal Received`,
      content,
      "Your support request has been received.",
    );
  }

  async sendReleaseNotification(
    email: string,
    name: string,
    version: string,
    title: string,
    content: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && !user.subscribePromo) {
      this.logger.log(`Skipping release notification to ${email} (unsubscribed from promo)`);
      return;
    }

    const htmlContent = `
            <div style="display: inline-block; border: 2px solid #000000; padding: 6px 16px; border-radius: 4px; font-size: 11px; font-weight: 900; color: #FF6A00; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 20px; background-color: #211F24; box-shadow: 2px 2px 0px 0px #000000;">System Release</div>
            <h1 style="font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-size: 32px; font-weight: 900; line-height: 1.15; letter-spacing: -0.04em; margin: 0 0 20px 0; color: #E5D8C9;">🚀 New Update: ${title}</h1>
            <p style="font-size: 15px; line-height: 1.6; color: #B8B8B8;">Hey ${name}!</p>
            <p style="font-size: 15px; line-height: 1.6; color: #B8B8B8;">We just shipped something exciting for you. Here's what's new in <strong style="color: #E5D8C9; font-weight: 700;">v${version}</strong>:</p>

            <div style="background-color: #211F24; border: 2px solid #000000; padding: 32px; border-radius: 12px; margin: 32px 0; font-family: 'Outfit', sans-serif; box-shadow: 4px 4px 0px 0px #000000;">
                ${this.parseMarkdownToHtml(content)}
            </div>

            <div style="text-align: left; margin-top: 40px; margin-bottom: 20px;">
                <a href="${this.frontendUrl}/dashboard" style="display: inline-block; background-color: #FF6A00; color: #000000 !important; padding: 16px 32px; border-radius: 8px; border: 2px solid #000000; font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-size: 14px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 4px 4px 0px 0px #000000;">See What's New →</a>
            </div>

            <p style="margin-top: 40px; color: #707070; font-size: 14px; line-height: 1.6; margin-bottom: 0;">Thanks for being part of the Inbox FM community. Your feedback shapes what we build next!</p>
        `;

    await this.sendMail(
      email,
      `🚀 Inbox FM v${version}: ${title}`,
      htmlContent,
      `We just shipped ${title} - check it out!`,
    );
  }

  async sendGmailNotConnectedEmail(
    email: string,
    name: string | null,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && !user.subscribeAlerts) {
      this.logger.log(`Skipping Gmail not connected alert to ${email} (unsubscribed from alerts)`);
      return;
    }

    const content = `
            <div style="display: inline-block; border: 2px solid #000000; padding: 6px 16px; border-radius: 4px; font-size: 11px; font-weight: 900; color: #EF4444; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 20px; background-color: #211F24; box-shadow: 2px 2px 0px 0px #000000;">Delivery Failed</div>
            <h1 style="font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-size: 32px; font-weight: 900; line-height: 1.15; letter-spacing: -0.04em; margin: 0 0 20px 0; color: #E5D8C9;">Gmail Connection Required 📧</h1>
            <p style="font-size: 15px; line-height: 1.6; color: #B8B8B8; margin-bottom: 12px;">Hey ${name || "there"},</p>
            <p style="font-size: 15px; line-height: 1.6; color: #B8B8B8; margin-bottom: 24px;">We tried to deliver your daily brief, but your <strong style="color: #E5D8C9; font-weight: 700;">Gmail account isn't connected</strong> yet.</p>

            <div style="background-color: #211F24; border: 2px solid #000000; border-radius: 12px; padding: 28px 32px; margin: 28px 0; box-shadow: 4px 4px 0px 0px #000000;">
                <h3 style="margin-top: 0; font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-weight: 900; font-size: 16px; color: #E5D8C9; margin-bottom: 8px;">Why Connect Gmail?</h3>
                <p style="color: #B8B8B8; margin-bottom: 0; font-size: 14px; line-height: 1.6;">We need secure access to your Gmail to fetch and summarize your emails. Without it, we can't create your personalized audio briefs.</p>
            </div>

            <div style="margin-top: 40px; margin-bottom: 20px;">
                <a href="${this.frontendUrl}/settings" style="display: inline-block; background-color: #FF6A00; color: #000000 !important; padding: 16px 32px; border-radius: 8px; border: 2px solid #000000; font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-size: 14px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 4px 4px 0px 0px #000000;">Connect Gmail Now →</a>
            </div>

            <div style="height: 2px; background-color: #000000; margin: 32px 0;"></div>
            <p style="color: #707070; font-size: 14px; margin: 0; line-height: 1.6;">Once connected, your briefs will be delivered automatically at your scheduled time.</p>
        `;

    await this.sendMail(
      email,
      `⚠️ Brief Delivery Failed - Gmail Not Connected`,
      content,
      "Connect your Gmail to receive daily briefs.",
    );
  }

  async sendGoogleWarningEmail(
    email: string,
    name: string | null,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && !user.subscribeAlerts) {
      this.logger.log(`Skipping Google warning email to ${email} (unsubscribed from alerts)`);
      return;
    }

    const greeting = name ? name.split(" ")[0] : "there";
    const content = `
            <div style="display: inline-block; border: 2px solid #000000; padding: 6px 16px; border-radius: 4px; font-size: 11px; font-weight: 900; color: #FF6A00; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 20px; background-color: #211F24; box-shadow: 2px 2px 0px 0px #000000;">Action Required</div>
            <h1 style="font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-size: 32px; font-weight: 900; line-height: 1.15; letter-spacing: -0.04em; margin: 0 0 20px 0; color: #E5D8C9;">Re-authenticate Google Today.</h1>
            <p style="font-size: 15px; line-height: 1.6; color: #B8B8B8; margin-bottom: 12px;">Hey ${greeting},</p>
            <p style="font-size: 15px; line-height: 1.6; color: #B8B8B8; margin-bottom: 24px;">Please re-authenticate your Google account today, otherwise your tomorrow's briefing will not arrive to you!</p>

            <div style="margin-top: 40px; margin-bottom: 20px;">
                <a href="${this.frontendUrl}/integrations" style="display: inline-block; background-color: #FF6A00; color: #000000 !important; padding: 16px 32px; border-radius: 8px; border: 2px solid #000000; font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-size: 14px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 4px 4px 0px 0px #000000;">Re-authenticate Now</a>
            </div>
        `;

    await this.sendMail(
      email,
      `⚠️ Action Required: Re-authenticate Google today`,
      content,
      "Re-authenticate your Google account today to avoid briefing interruptions.",
    );
  }

  async sendGoogleDisconnectedEmail(
    email: string,
    name: string | null,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && !user.subscribeAlerts) {
      this.logger.log(`Skipping Google disconnected email to ${email} (unsubscribed from alerts)`);
      return;
    }

    const greeting = name ? name.split(" ")[0] : "there";
    const content = `
            <div style="display: inline-block; border: 2px solid #000000; padding: 6px 16px; border-radius: 4px; font-size: 11px; font-weight: 900; color: #EF4444; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 20px; background-color: #211F24; box-shadow: 2px 2px 0px 0px #000000;">Connection Expired</div>
            <h1 style="font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-size: 32px; font-weight: 900; line-height: 1.15; letter-spacing: -0.04em; margin: 0 0 20px 0; color: #E5D8C9;">Google Disconnected.</h1>
            <p style="font-size: 15px; line-height: 1.6; color: #B8B8B8; margin-bottom: 12px;">Hey ${greeting},</p>
            <p style="font-size: 15px; line-height: 1.6; color: #B8B8B8; margin-bottom: 24px;">Your Google connection has expired after 7 days for security. Please re-login and re-authenticate to continue receiving briefings.</p>

            <div style="margin-top: 40px; margin-bottom: 20px;">
                <a href="${this.frontendUrl}/login" style="display: inline-block; background-color: #FF6A00; color: #000000 !important; padding: 16px 32px; border-radius: 8px; border: 2px solid #000000; font-family: 'Archivo Black', 'Outfit', -apple-system, sans-serif; font-size: 14px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 4px 4px 0px 0px #000000;">Log In & Reconnect</a>
            </div>
        `;

    await this.sendMail(
      email,
      `🔒 Google Connection Expired`,
      content,
      "Your Google connection has expired. Please reconnect to receive briefs.",
    );
  }
}
