import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog | Inbox FM",
  description: "Track the evolution, feature releases, improvements, and bug fixes of the Inbox FM product.",
  alternates: {
    canonical: "https://inboxfm.me/releases/",
  },
};

export default function ReleasesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
