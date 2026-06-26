"use client";

import DashboardLayout from "@/app/dashboard/layout";

export default function SummariesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
