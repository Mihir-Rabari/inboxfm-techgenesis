"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const checkInstallation = () => {
      // Check if app is already installed
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true);
        return;
      }

      // Detect iOS app mode
      const nav = window.navigator as Navigator & { standalone?: boolean };
      if (nav.standalone === true) {
        setIsInstalled(true);
        return;
      }
    };

    // Defer state update to avoid calling setState synchronously within effect
    const timer = setTimeout(checkInstallation, 0);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const isDismissed = localStorage.getItem("inboxfm_pwa_dismissed") === "true";
      if (!isDismissed) {
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setShowPrompt(true);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const handleDontShowAgain = () => {
    localStorage.setItem("inboxfm_pwa_dismissed", "true");
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const pathname = usePathname();
  const isLandingOrAuthPage = pathname === "/" || pathname === "/waitlist" || pathname === "/login" || pathname === "/signup";

  if (!showPrompt || isInstalled || isLandingOrAuthPage) return null;

  return (
    <div className="fixed bottom-6 right-6 left-6 md:left-auto z-50 md:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800/80 p-5 animate-in slide-in-from-bottom-4 duration-300">
      {/* Top section: Logo pill on left, text on right */}
      <div className="flex gap-4 items-start">
        {/* Brand logo matching Sidebar: orange gradient pill */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 flex-shrink-0 font-archivo-black select-none">
          <span className="text-sm font-black tracking-tighter">FM</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-950 dark:text-white text-sm tracking-tight">
              Install Inbox FM
            </h3>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Dismiss install prompt"
            >
              <X size={15} />
            </button>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed font-medium">
            Get quick access to your email briefings on your home screen.
          </p>
        </div>
      </div>

      {/* Bottom section: Full-width action block (completely outside the flex column above) */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-150 dark:border-slate-850">
        <button
          onClick={handleDontShowAgain}
          className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2 hover:no-underline transition-colors font-medium whitespace-nowrap"
        >
          Don&apos;t show again
        </button>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="h-8 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 px-3.5"
          >
            Not now
          </Button>
          <Button
            size="sm"
            onClick={handleInstall}
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm h-8 text-xs px-4 rounded-lg transition-all"
          >
            Install
          </Button>
        </div>
      </div>
    </div>
  );
}
