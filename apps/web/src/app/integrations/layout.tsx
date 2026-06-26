"use client";

import DashboardLayout from "@/app/dashboard/layout";

export default function IntegrationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
