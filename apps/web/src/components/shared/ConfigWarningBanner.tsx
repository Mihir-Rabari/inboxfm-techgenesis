"use client";

import * as React from "react";
import Link from "next/link";
import { Warning, Info, X, ArrowRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ConfigWarningBannerProps {
  type?: "warning" | "info";
  message: string;
  action?: {
    label: string;
    href: string;
  };
  dismissable?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function ConfigWarningBanner({
  type = "warning",
  message,
  action,
  dismissable = true,
  onDismiss,
  className,
}: ConfigWarningBannerProps) {
  const [isDismissed, setIsDismissed] = React.useState(false);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) onDismiss();
  };

  const isWarning = type === "warning";

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-2 border-black dark:border-zinc-700 rounded-lg select-none transition-all duration-200 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(39,39,42,1)]",
        isWarning
          ? "bg-amber-100 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300"
          : "bg-blue-100 dark:bg-blue-950/20 text-blue-900 dark:text-blue-300",
        className
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="shrink-0 mt-0.5">
          {isWarning ? (
            <Warning className="w-5 h-5 text-amber-600 dark:text-amber-400" weight="fill" />
          ) : (
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" weight="fill" />
          )}
        </div>
        <p className="text-sm font-bold leading-relaxed">{message}</p>
      </div>

      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
        {action && (
          <Link href={action.href} passHref>
            <Button
              size="xs"
              variant="outline"
              className={cn(
                "font-black text-[11px] uppercase tracking-wider gap-1.5 border-black dark:border-zinc-700 bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black dark:text-white"
              )}
            >
              <span>{action.label}</span>
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        )}

        {dismissable && (
          <button
            onClick={handleDismiss}
            className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-current"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
