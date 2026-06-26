import { InboxFMLandingClient } from "@/components/landing/InboxFMLandingClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "InboxFM — Your workday, summarized before it starts.",
  description: "InboxFM transforms emails, calendars, GitHub activity, newsletters, and news feeds into a personalized AI audio briefing so you can start your day with context instead of chaos.",
  keywords: [
    "InboxFM", 
    "AI audio briefing", 
    "email to audio", 
    "audio news digest", 
    "action item extraction", 
    "auto calendar sync", 
    "email reply assistant", 
    "workspace activity feed", 
    "productivity podcast",
    "commute audio digest",
    "Outlook email sending",
    "newsletter to voice"
  ],
  alternates: {
    canonical: "https://inboxfm.me",
  },
  openGraph: {
    title: "InboxFM — Your Inbox on Autopilot | AI Audio Briefings & Action Items",
    description: "Turn chaotic emails, calendar events, GitHub updates, and RSS feeds into a daily personalized audio briefing.",
    url: "https://inboxfm.me",
    siteName: "InboxFM",
    images: [
      {
        url: "https://inboxfm.me/images/og.png",
        width: 1200,
        height: 630,
        alt: "InboxFM — Turn your inbox into a personal morning podcast",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "InboxFM — Your Inbox on Autopilot | AI Audio Briefings & Action Items",
    description: "Turn chaotic emails, calendar events, GitHub updates, and RSS feeds into a daily personalized audio briefing.",
    images: ["https://inboxfm.me/images/og.png"],
    creator: "@inboxfm",
  },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": "https://inboxfm.me/#software",
        "name": "InboxFM",
        "url": "https://inboxfm.me",
        "applicationCategory": "ProductivityApplication",
        "operatingSystem": "Web",
        "description": "Turn chaotic emails, calendar events, GitHub updates, and RSS feeds into a daily personalized audio briefing.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      },
      {
        "@type": "Organization",
        "@id": "https://inboxfm.me/#organization",
        "name": "InboxFM",
        "url": "https://inboxfm.me",
        "logo": "https://inboxfm.me/images/logo.png",
        "sameAs": [
          "https://twitter.com/inboxfm",
          "https://github.com/Mihir-Rabari/inboxFM"
        ]
      },
      {
        "@type": "FAQPage",
        "@id": "https://inboxfm.me/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Does InboxFM read and store all my emails?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "InboxFM processes incoming email content solely to generate your narrative briefings. We use secure read-only API access via Google OAuth, never require your password, and do not store your raw emails or inbox threads on our servers."
            }
          },
          {
            "@type": "Question",
            "name": "Can I choose when my briefing arrives?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. Morning, evening, or custom delivery schedules can be configured under your account settings."
            }
          },
          {
            "@type": "Question",
            "name": "How is InboxFM different from an email summary?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "InboxFM combines email, calendar activity, GitHub updates, RSS feeds, and historical context into a single narrated briefing. Traditional email summaries only summarize individual messages. It also automatically ingests action items and prioritizes senders, ensuring you only hear what actually matters."
            }
          },
          {
            "@type": "Question",
            "name": "When can I access InboxFM?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We are currently onboarding new beta users in controlled batches to ensure maximum briefing quality and system reliability."
            }
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd)
        }}
      />
      <InboxFMLandingClient />
    </>
  );
}

