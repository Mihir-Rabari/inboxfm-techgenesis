import { MailService } from '../src/modules/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as fs from 'fs';
import * as path from 'path';

// Mock NestJS dependencies
const mockConfigService = {
  get: (key: string) => {
    if (key === 'FRONTEND_URL') return 'http://localhost:3000';
    if (key === 'RESEND_API_KEY') return 're_dummy_key_for_rendering';
    return null;
  }
} as any;

const mockJwtService = {
  sign: () => 'mock-jwt-token',
  verify: () => ({ email: 'test@example.com' }),
} as any;

const mockPrismaService = {
  user: {
    findUnique: async () => ({
      isActive: true,
      subscribePromo: true,
      subscribeAlerts: true,
    }),
  },
  waitlist: {
    findUnique: async () => ({
      status: 'APPROVED',
    }),
  },
} as any;

const mailService = new MailService(mockConfigService, mockJwtService, mockPrismaService);

const renderedTemplates: Array<{ filename: string; subject: string; html: string; description: string }> = [];

// Intercept resend.emails.send call to capture html output
(mailService as any).resend = {
  emails: {
    send: async (payload: any) => {
      return { data: { id: 'mock-id' }, error: null };
    }
  }
};

// Override the private sendMail to capture HTML directly
const originalSendMail = (mailService as any).sendMail;
(mailService as any).sendMail = async function(to: string, subject: string, content: string, preheader: string) {
  const html = this.getBaseTemplate(content, preheader, to);
  renderedTemplates.push({
    filename: subject.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') + '.html',
    subject,
    html,
    description: preheader
  });
};

// Also override sendMarketingEmail to capture HTML
const originalSendMarketingEmail = mailService.sendMarketingEmail;
mailService.sendMarketingEmail = async function(to: string, subject: string, content: string, fromEmail?: string) {
  const html = this.getBaseTemplate(content, subject, to);
  renderedTemplates.push({
    filename: 'marketing_' + subject.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') + '.html',
    subject,
    html,
    description: `Marketing email: ${subject}`
  });
};

async function main() {
  console.log('Generating email template previews...');

  // 1. Waitlist Confirmation
  await mailService.sendWaitlistConfirmationEmail('user@example.com', 'Mihir Rabari');

  // 2. Welcome Email
  await mailService.sendWelcomeEmail('user@example.com', 'Mihir');

  // 3. Login Alert
  await mailService.sendLoginAlert('user@example.com', 'Chrome on Windows 11 (Mumbai, India)');

  // 4. Password Reset
  await mailService.sendPasswordReset('user@example.com', 'xyz-mock-password-reset-token');

  // 5. Broadcast Email
  await mailService.sendBroadcast(
    'user@example.com',
    'System Maintenance & Performance Upgrades',
    `We are upgrading our core transcription pipelines to offer even lower latency audio digests.
    
### Expected Downtime
- Generation windows between **3:00 AM and 5:00 AM UTC** may experience delays.
- Your summaries are perfectly safe and queued for retry.

Thank you for your patience as we build the best audio briefing system.

- **Inbox FM Team**`
  );

  // 6. Daily Brief Email
  await mailService.sendDailyBriefEmail(
    { email: 'user@example.com', name: 'Mihir Rabari' },
    {
      id: 'brief_123_abc',
      textSummary: `__INBOXFM_STRUCTURED_JSON__
Morning recap of your inbox:
- Google Cloud Billing: Monthly statement is ready for review.
- GitHub Notifications: 3 Pull Requests merged, 2 issues opened on Mihir-Rabari/inboxFM.
- Slack Digest: 4 mentions in #engineering regarding the database migration.
- Substack Newsletter: New article by Paul Graham on "How to Start a Startup in 2026".`,
      audioUrl: 'https://example.com/audio.mp3',
      audioDuration: 185, // 3:05
      emailsProcessed: 12
    }
  );

  // 7a. Brief Error Email - Auth Expired
  await mailService.sendBriefErrorEmail(
    { email: 'user@example.com', name: 'Mihir' },
    'Authentication expired or credentials revoked'
  );

  // 7b. Brief Error Email - Generic
  await mailService.sendBriefErrorEmail(
    { email: 'user@example.com', name: 'Mihir' },
    'Connection timeout during Gmail sync'
  );

  // 8. Waitlist Approved Email
  await mailService.sendWaitlistApprovedEmail('user@example.com', 'Mihir Rabari', 'IFM-987-AX5');

  // 9. Gmail Not Connected Email
  await mailService.sendGmailNotConnectedEmail('user@example.com', 'Mihir');

  // 10. Google Warning Email
  await mailService.sendGoogleWarningEmail('user@example.com', 'Mihir');

  // 11. Google Disconnected Email
  await mailService.sendGoogleDisconnectedEmail('user@example.com', 'Mihir');

  // 12. Support Confirmation
  await mailService.sendSupportConfirmation('user@example.com', 'Trouble connecting Google account during waitlist onboarding', 'SUP-9821');

  // 13. Release Notification
  await mailService.sendReleaseNotification(
    'user@example.com',
    'Mihir',
    '0.2.0',
    'The Big Update',
    `We just shipped the closed beta v0.2.0 update! Here's what's new:
- **Charcoal-Obsidian Themes**: Modern look and feel for all system communications.
- **JWT Unsubscribe Headers**: Secure unsubscribe links with infinite expiry.
- **Bulk Outreach Deck**: Full screen CSV composition console for admin outreach.`
  );

  // Write files
  const outputDirs = [
    path.join(__dirname, 'previews'),
    'C:\\Users\\mihir\\.gemini\\antigravity\\brain\\291c2a5e-af03-4ff8-bbbe-16845f4b41fb\\email-previews'
  ];

  for (const outputDir of outputDirs) {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    console.log(`Writing previews to ${outputDir}...`);

    for (const temp of renderedTemplates) {
      const filePath = path.join(outputDir, temp.filename);
      fs.writeFileSync(filePath, temp.html, 'utf8');
    }

    // Write index.html
    const indexHtml = generateIndexHtml();
    fs.writeFileSync(path.join(outputDir, 'index.html'), indexHtml, 'utf8');
  }

  console.log(`Successfully generated ${renderedTemplates.length} email previews!`);
}

function generateIndexHtml(): string {
  const listItems = renderedTemplates.map((t, idx) => {
    return `
      <div class="template-card" onclick="loadPreview('${t.filename}', '${t.subject.replace(/'/g, "\\'")}', this)">
        <h3>${t.subject}</h3>
        <p class="filename">${t.filename}</p>
        <p class="desc">${t.description}</p>
      </div>
    `;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inbox FM Email Previews</title>
  <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Outfit:wght@400;500;700;900&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #050505;
      color: #B8B8B8;
      font-family: 'Outfit', sans-serif;
      display: flex;
      height: 100vh;
      overflow: hidden;
    }
    #sidebar {
      width: 320px;
      background-color: #0B0B0B;
      border-right: 1px solid rgba(255,255,255,0.08);
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    #sidebar-header {
      padding: 24px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    #sidebar-header h1 {
      font-family: 'Archivo Black', sans-serif;
      font-size: 20px;
      margin: 0;
      color: #FFF;
      text-transform: uppercase;
      letter-spacing: -0.02em;
    }
    #sidebar-header h1 span {
      color: #FF6A00;
    }
    #template-list {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }
    .template-card {
      padding: 16px;
      background-color: #121212;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .template-card:hover {
      border-color: #FF6A00;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 106, 0, 0.1);
    }
    .template-card.active {
      border-color: #FF6A00;
      background-color: rgba(255, 106, 0, 0.05);
    }
    .template-card h3 {
      margin: 0 0 6px 0;
      font-size: 14px;
      font-weight: 700;
      color: #E5D8C9;
    }
    .template-card p {
      margin: 0;
      font-size: 11px;
    }
    .template-card p.filename {
      color: #707070;
      font-family: monospace;
      margin-bottom: 4px;
    }
    .template-card p.desc {
      color: #B8B8B8;
    }
    #preview-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      background-color: #050505;
    }
    #preview-header {
      padding: 16px 24px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      background-color: #0B0B0B;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    #preview-header h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: #FFF;
    }
    #preview-frame-wrapper {
      flex: 1;
      padding: 24px;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: auto;
    }
    iframe {
      width: 100%;
      max-width: 650px;
      height: 100%;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      background-color: #050505;
      box-shadow: 0 20px 50px rgba(0,0,0,0.8);
    }
    .no-preview {
      color: #707070;
      font-size: 16px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div id="sidebar">
    <div id="sidebar-header">
      <h1>Inbox<span>FM</span> Email Previews</h1>
    </div>
    <div id="template-list">
      ${listItems}
    </div>
  </div>
  <div id="preview-container">
    <div id="preview-header">
      <h2 id="current-subject">Select a template to preview</h2>
    </div>
    <div id="preview-frame-wrapper">
      <iframe id="preview-frame" style="display: none;"></iframe>
      <div id="no-preview-text" class="no-preview">Click any template card on the left to load the interactive HTML email layout.</div>
    </div>
  </div>

  <script>
    function loadPreview(filename, subject, element) {
      // Set active card
      const cards = document.querySelectorAll('.template-card');
      cards.forEach(c => c.classList.remove('active'));
      element.classList.add('active');

      document.getElementById('current-subject').innerText = subject;
      const iframe = document.getElementById('preview-frame');
      const noPreview = document.getElementById('no-preview-text');
      
      iframe.style.display = 'block';
      noPreview.style.display = 'none';
      iframe.src = filename;
    }
  </script>
</body>
</html>`;
}

main().catch(console.error);
