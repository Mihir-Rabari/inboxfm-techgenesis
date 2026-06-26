"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import {
  ChartBar,
  Users,
  Ticket,
  ArrowLeft,
  ShieldCheck,
  Rocket,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/shared/Spinner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!user?.isAdmin) {
        router.push("/dashboard");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size={48} className="text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-background">
      {/* Admin Header */}
      <header className="flex-none h-16 bg-background border-b border-border flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2 rounded-full">
              <ArrowLeft size={18} />
              Back to App
            </Button>
          </Link>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <ShieldCheck size={24} weight="fill" className="text-primary" />
            <span className="font-black text-xl">Admin Panel</span>
          </div>
          <div className="h-6 w-px bg-border mx-2" />
          <nav className="flex items-center gap-1">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-2 rounded-full">
                <ChartBar size={18} />
                Dashboard
              </Button>
            </Link>
            <Link href="/admin/releases">
              <Button variant="ghost" size="sm" className="gap-2 rounded-full">
                <Rocket size={18} />
                Releases
              </Button>
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Logged in as{" "}
            <span className="font-bold text-foreground">{user?.email}</span>
          </span>
          <Logo />
        </div>
      </header>

      {/* Admin Content */}
      <main className="flex-1 flex overflow-hidden bg-muted/10">{children}</main>
    </div>
  );
}
