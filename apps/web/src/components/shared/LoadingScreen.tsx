import * as React from "react";
import { Spinner } from "@/components/shared/Spinner";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  /** Optional message below the spinner */
  message?: string;
  className?: string;
  /** Use `page` for full-viewport, `inline` for section-level */
  variant?: "page" | "inline";
}

/**
 * LoadingScreen — branded full-page or inline loading state.
 *
 * Replaces the `min-h-screen flex items-center justify-center` + Spinner
 * pattern duplicated in 8+ pages. Uses `min-h-dvh` for correct mobile
 * viewport behavior (UX Pro Max: viewport-units rule).
 *
 * Usage:
 * ```tsx
 * // Full-page auth guard loading
 * if (isLoading) return <LoadingScreen />;
 *
 * // Inline section loading
 * <LoadingScreen variant="inline" message="Loading your schedule..." />
 * ```
 */
export function LoadingScreen({
  message,
  className,
  variant = "page",
}: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        variant === "page" ? "min-h-dvh" : "min-h-48 w-full",
        className
      )}
    >
      <Spinner size={48} className="text-primary" />
      {message && (
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}
