import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meet the Team | Inbox FM",
  description: "Learn about the founders, engineers, and designers building the next generation of digital focus and context synthesis engines.",
  alternates: {
    canonical: "https://inboxfm.me/team/",
  },
};

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
