import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const version = "0.2.0";
const title = "The Big Update";
const slug = "the-big-update-0-2-0";
const description = "A major closed beta update to the InboxFM ecosystem introducing a robust browser reverse-proxy redirection loop fix, fully responsive charcoal-obsidian transactional and marketing email templates, a secure signed immortal JWT unsubscribe system, a fullscreen admin email marketing center with CSV loaders, and theme-neutral creator and team pages.";

const changes = [
  {
    "category": "FEATURE",
    "description": "Imagine Tomorrow Morning: A gorgeous, dark glassmorphic comparison timeline section replacing the updates comparison layout on the main landing page."
  },
  {
    "category": "FEATURE",
    "description": "Full Email Marketing Console: A fully integrated fullscreen admin deck supporting manual compositions, @-autocomplete placeholders, and batch CSV imports."
  },
  {
    "category": "FEATURE",
    "description": "Immortal JWT Unsubscribe System: High-security signed footers and List-Unsubscribe headers using 100-year validity tokens to securely offboard users."
  },
  {
    "category": "IMPROVEMENT",
    "description": "Premium Dark Theme Email Redesign: Redesigned all 11 core email layouts to render high-contrast cream-ivory text on elegant obsidian and charcoal surfaces."
  },
  {
    "category": "IMPROVEMENT",
    "description": "Deliverability Polish: Added automatic plain-text body extraction fallback mapping to Resend to maximize anti-spam ratings."
  },
  {
    "category": "IMPROVEMENT",
    "description": "Dynamic Team Directory: Refactored '/inboxfm/team/[slug]' from hardcoded hex background tags to adaptive design tokens supporting light and dark modes."
  },
  {
    "category": "FIX",
    "description": "Reverse-Proxy Redirection Loops: Enforced trailingSlash: true on root Next.js configuration to eliminate cloud proxy ERR_FAILED crashes."
  },
  {
    "category": "FIX",
    "description": "Branding & Copy Alignment: Removed SOC-2 and Google OAuth claims, corrected mobile screen title overflows, and integrated robust static SEO meta blocks."
  }
];

const content = `## InboxFM Closed Beta v0.2.0 — The Big Update

Welcome to the biggest update to **InboxFM** yet! In this milestone, we have hardened our infrastructure, dramatically upgraded email deliverability, and shipped a beautiful new visual comparison section to tell our story.

---

### 🎨 1. "Imagine Tomorrow Morning" Visual Ritual
We replaced our old text comparison blocks with a beautiful, high-fidelity timeline comparison detailing the start of your day:
* **The Legacy Friction**: Waking up to 47 blue-light notifications, wading through commercial spam, opening 14 tabs just to catch up, and generating morning cognitive overload.
* **The Narrated Ritual**: Reclaiming 45 minutes of quiet time. Brew your coffee, press play on a calm, professional voice summary, and know exactly what requires your action before you even sit at your desk.

---

### 📧 2. Bulletproof Transactional Emails & Immortal Unsubscribe Tokens
* **Premium Obsidian Styles**: All 11 notification templates are now rendered in a high-end dark theme (\`#050505\` outer surfaces with \`#121212\` elevated card boundaries). Headings display in warm cream \`#E5D8C9\` and body text in smooth readable grey \`#B8B8B8\`.
* **Signed Unsubscribe Footers**: Each email contains a List-Unsubscribe header and footer anchor linked directly to an active unsubscribe endpoint \`/inboxfm/unsubscribe?token=<token>\`. Tokens are securely signed against \`JWT_SECRET\` with an infinite expiration (\`36500d\`) to ensure links never expire.
* **State Operations**: Clicking unsubscribe triggers backend status mutations that flag waitlists to \`REJECTED\` (with audit notes) and turns off registered digests (\`isActive: false\`), stopping active briefing scripts.
* **Friendly Masked Handlers**: Removed all raw system traces (like Gmail API limits) from client views, substituting a polite retry notification.

---

### ⚙️ 3. Integrated Email Marketing Console
Administrators can now manage outreach campaigns in a dedicated fullscreen viewport layout:
* **CSV Bulk Parsing**: Upload, review, and map rows of waitlist applicants or newsletters directly.
* **@-Variable Expansion**: Seamlessly insert autocompleted markers like \`@name\` or \`@email\` during compose routines.
* **Outgoing Sender Overrides**: Select and target outbound paths ending in \`@vedlabs.tech\` cleanly.

---

### 🌐 4. Core Infrastructure & Reverse-Proxy Fixes
* **Redirection Loop Repair (\`ERR_FAILED\`)**: A major conflict between Next.js (stripping trailing slashes) and cloud Nginx proxies (enforcing trailing slashes) was causing random browser crash errors when visiting \`https://vedlabs.tech/inboxfm/\`. By specifying \`trailingSlash: true\` inside our root configurations, routes are perfectly synchronized.
* **Rich Static SEO**: Upgraded \`layout.tsx\` for static rendering while exporting deep metadata structures (canonical headers, OpenGraph images, Twitter summaries, and search crawler robots flags).
`;

async function main() {
    console.log(`Checking if release ${version} already exists...`);
    const existing = await prisma.releaseNote.findFirst({
        where: { version }
    });

    if (existing) {
        console.log(`Release ${version} already exists (ID: ${existing.id}). Updating...`);
        const updated = await prisma.releaseNote.update({
            where: { id: existing.id },
            data: {
                title,
                slug,
                description,
                changes,
                content,
                isPublished: true,
                updatedAt: new Date()
            }
        });
        console.log(`Successfully updated release ${version} (ID: ${updated.id})`);
    } else {
        console.log(`Release ${version} does not exist. Creating...`);
        const created = await prisma.releaseNote.create({
            data: {
                version,
                title,
                slug,
                description,
                changes,
                content,
                isPublished: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });
        console.log(`Successfully created release ${version} (ID: ${created.id})`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
