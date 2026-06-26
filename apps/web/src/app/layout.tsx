import { Outfit, JetBrains_Mono, Archivo_Black, EB_Garamond } from "next/font/google";
import Script from "next/script";
import { Metadata } from "next";

import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { ServiceWorkerRegistration } from "@/components/shared/ServiceWorkerRegistration";
import { PWAInstallPrompt } from "@/components/shared/PWAInstallPrompt";
import { CookieConsent } from "@/components/shared/CookieConsent";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo-black",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Inbox FM — Start Your Day Informed, Not Inbox-Bound | AI Audio Briefings",
    template: "%s | Inbox FM",
  },
  description: "InboxFM turns overnight emails, newsletters, follow-ups, deadlines, and decisions into a concise, high-fidelity daily spoken briefing you can listen to before your first coffee.",
  metadataBase: new URL("https://inboxfm.me"),
  manifest: "/manifest.webmanifest",
  keywords: [
    "AI email summary",
    "audio briefings",
    "Gmail podcast",
    "productivity tool",
    "email digest",
    "AI audio reader",
    "morning digest",
    "Inbox FM",
    "Vedlabs",
    "digital focus"
  ],
  alternates: {
    canonical: "https://inboxfm.me/",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Inbox FM — Start Your Day Informed, Not Inbox-Bound",
    description: "Calmly synthesize your Gmail inbox into a personalized, high-fidelity daily spoken briefing. Skip notification clutter and listen to outcomes.",
    type: "website",
    url: "https://inboxfm.me",
    siteName: "Inbox FM",
    locale: "en_US",
    images: [
      {
        url: "https://inboxfm.me/api/og?title=Inbox%20FM&subtitle=AI%20Audio%20Briefings&type=general",
        width: 1200,
        height: 630,
        alt: "Inbox FM — AI Audio Briefings for Digital Professionals",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Inbox FM — Start Your Day Informed, Not Inbox-Bound",
    description: "Convert noisy overnight email feeds into a concise 6-minute spoken daily broadcast.",
    images: ["https://inboxfm.me/api/og?title=Inbox%20FM&subtitle=AI%20Audio%20Briefings&type=general"],
    creator: "@vedlabs",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#FF9500", // Premium amber
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Inbox FM",
    "url": "https://inboxfm.me",
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Inbox FM",
    "operatingSystem": "All",
    "applicationCategory": "ProductivityApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "InboxFM turns overnight emails, newsletters, follow-ups, deadlines, and decisions into a concise, high-fidelity daily spoken briefing.",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "120"
    }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Inbox FM",
    "url": "https://inboxfm.me",
    "logo": "https://inboxfm.me/icons/apple-touch-icon.png",
    "sameAs": [
      "https://twitter.com/vedlabs",
      "https://github.com/Mihir-Rabari/inboxFM"
    ]
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="msapplication-TileColor" content="#c8803a" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([websiteSchema, softwareSchema, organizationSchema]),
          }}
        />
      </head>
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} ${archivoBlack.variable} ${ebGaramond.variable} font-sans antialiased`}
      >
        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id="3dee9d6c-6ebd-4101-8d74-bf4d625911bf"
          strategy="afterInteractive"
        />
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem={true}
          >
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
        <CookieConsent />
        <ServiceWorkerRegistration />
        <PWAInstallPrompt />
        <Toaster />
      </body>
    </html>
  );
}
