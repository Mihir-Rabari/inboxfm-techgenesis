import { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Security Policy | Inbox FM",
  description:
    "How Inbox FM handles Gmail permissions, encryption, retention, and third-party processing.",
};

const sections = [
  {
    title: "Data Access",
    items: [
      "Inbox FM currently integrates with Gmail.",
      "We request only the permissions required to fetch and summarize inbox content for your briefings.",
      "Access is tied to your authenticated account and can be disconnected from Profile.",
    ],
  },
  {
    title: "What We Store",
    items: [
      "Encrypted OAuth credentials required for ongoing Gmail access.",
      "Generated briefing artifacts (summary text, structured script, audio file metadata).",
      "Operational metadata like delivery schedules and sender preferences.",
      "We do not permanently store raw inbox threads as a product dataset.",
    ],
  },
  {
    title: "Encryption & Security Controls",
    items: [
      "OAuth tokens are encrypted before being written to the database.",
      "Access to authenticated APIs requires valid user JWTs.",
      "Admin routes are protected with admin authorization guards.",
    ],
  },
  {
    title: "Third-Party Processors",
    items: [
      "Google APIs (Gmail access, secure context summarization/TTS).",
      "AWS S3-compatible object storage for generated audio assets.",
      "Resend for transactional email delivery.",
      "Sentry for error monitoring and reliability insights.",
    ],
  },
  {
    title: "Retention & Deletion",
    items: [
      "Brief history and audio remain available to you in-product until removed.",
      "Disconnecting Gmail revokes further inbox syncing.",
      "You can request account/data deletion via support.",
    ],
  },
];

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-background spotlight-bg grain-bg selection:bg-brand-orange/30 selection:text-white overflow-hidden text-foreground">
      {/* Global Sticky Capsule Navbar */}
      <Navbar />

      <div className="relative max-w-4xl mx-auto px-6 pt-32 pb-24 z-10">
        <div className="bg-[#FAF6F0] dark:bg-[#161519] border-2 border-black dark:border-zinc-800 rounded-[var(--ds-radius-card)] p-8 md:p-12 space-y-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.06)]">
          <div className="space-y-3">
            <h1 className="text-4xl font-black tracking-tight">Security Policy</h1>
            <p className="text-muted-foreground font-medium mb-12">
              We are building Inbox FM with explicit guardrails for sensitive inbox
              data. This page explains what we access, what we store, and why.
            </p>
          </div>

          <div className="space-y-8">
            {sections.map((section) => (
              <section key={section.title} className="rounded-[var(--ds-radius-inner)] border-2 border-black/10 dark:border-zinc-800/80 bg-white/20 dark:bg-black/20 p-6 md:p-8 space-y-3">
                <h2 className="text-xl font-black">{section.title}</h2>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground font-medium">
                  {section.items.map((item) => (
                    <li key={item} className="leading-relaxed">{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>

      {/* Shared Footer */}
      <Footer />
    </main>
  );
}
