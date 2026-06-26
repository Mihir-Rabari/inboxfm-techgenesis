"use client";

import DashboardLayout from "@/app/dashboard/layout";

export default function FeedbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
