"use client";

import DashboardLayout from "@/app/dashboard/layout";

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
