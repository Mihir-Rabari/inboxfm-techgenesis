"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { List } from "@phosphor-icons/react";
import { Spinner } from "@/components/shared/Spinner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { OnboardingWizard } from "@/components/shared/OnboardingWizard";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Spinner size={48} className="text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const initials =
    user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase();
  const displayName = user.name || user.email.split("@")[0];

  return (
    <div className="flex min-h-screen bg-muted/20">
      <OnboardingWizard />
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile, slide in when open */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto lg:block transition-transform duration-300",
          mobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
        )}
      >
        <Sidebar onClose={() => setMobileSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-h-0 min-w-0">

        {/* Top Header — sticky glass */}
        <header className="h-16 md:h-18 bg-background/80 backdrop-blur-md border-b border-border/60 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">

          <div className="flex items-center gap-3">
            {/* Mobile hamburger button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-muted-foreground hover:text-primary"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <List size={24} />
            </Button>
            <div>
              <h2 className="text-xs md:text-sm font-medium text-muted-foreground">
                {getGreeting()},
              </h2>
              <p className="text-lg md:text-xl font-black">{displayName} 👋</p>
            </div>
          </div>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold">{displayName}</div>
                <div className="text-[10px] text-muted-foreground">
                  {user.gmailConnected ? "Gmail Connected" : "Free Plan"}
                </div>
              </div>
              <Avatar className="h-9 w-9 md:h-10 md:w-10 border-2 border-primary/20 p-0.5">
                <AvatarImage
                  src={user.picture || undefined}
                  alt={displayName}
                />
                <AvatarFallback className="font-bold text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-4 md:py-5">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
