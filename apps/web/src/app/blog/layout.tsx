import { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Journal | Inbox FM",
  description: "Insights on morning focus preservation, cognitive stress reduction, eye fatigue, and the engineering behind our context extraction pipelines.",
  alternates: {
    canonical: "https://inboxfm.me/blog/",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
