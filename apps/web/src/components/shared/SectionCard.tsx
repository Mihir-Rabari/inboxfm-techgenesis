"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  /** Phosphor icon element — shown in the header pill */
  icon?: React.ReactNode;
  /** Section title */
  title?: string;
  /** Optional subtitle/description below the title */
  description?: string;
  /** Optional right-side action (button, badge, etc.) */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Inner content padding variant */
  padding?: "default" | "tight" | "none";
  /** Whether to show the hover lift effect */
  hoverable?: boolean;
}

/**
 * SectionCard — the reusable glass card used throughout the dashboard.
 *
 * Replaces the `glass rounded-[2rem] p-6 md:p-8 space-y-6 shadow-sm hover:shadow-md`
 * pattern that was copy-pasted across 15+ locations.
 *
 * Usage:
 * ```tsx
 * <SectionCard icon={<Gear weight="duotone" />} title="Schedule Settings" description="...">
 *   <MyFormContent />
 * </SectionCard>
 * ```
 */
export function SectionCard({
  icon,
  title,
  description,
  action,
  children,
  className,
  padding = "default",
  hoverable = true,
}: SectionCardProps) {
  const paddingClasses = {
    default: "p-6 md:p-8",
    tight: "p-4 md:p-6",
    none: "p-0",
  };

  return (
    <div
      className={cn(
        "glass rounded-[var(--ds-radius-card)] shadow-[var(--ds-shadow-card)]",
        "transition-all duration-300",
        hoverable && "hover:shadow-[var(--ds-shadow-hover)]",
        paddingClasses[padding],
        className
      )}
    >
      {(icon || title || action) && (
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="w-10 h-10 rounded-[var(--ds-radius-inner)] bg-primary/10 text-primary flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="text-base font-black tracking-tight leading-none">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>
          {action && (
            <div className="shrink-0 flex items-center gap-2">{action}</div>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}
