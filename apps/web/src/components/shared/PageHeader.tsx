import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  /** Use h1 (default) for the main page title, h2 for sub-sections */
  level?: 1 | 2;
}

/**
 * PageHeader — unified page-level heading component.
 *
 * Replaces the duplicated `<h1 className="text-3xl font-black tracking-tight">`
 * + `<p className="text-muted-foreground">` pattern that appeared in 8+ pages.
 *
 * Usage:
 * ```tsx
 * <PageHeader
 *   title="Sender Settings"
 *   description="Control sender-level rules used during brief generation."
 *   action={<Button size="brand">Add Rule</Button>}
 * />
 * ```
 */
export function PageHeader({
  title,
  description,
  action,
  className,
  level = 1,
}: PageHeaderProps) {
  const Tag = level === 1 ? "h1" : "h2";

  return (
    <header
      className={cn(
        "flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2",
        className
      )}
    >
      <div className="space-y-1 min-w-0">
        <Tag
          className={cn(
            "font-black tracking-tight leading-none",
            level === 1 ? "text-3xl md:text-4xl" : "text-2xl"
          )}
        >
          {title}
        </Tag>
        {description && (
          <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-lg">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-3 shrink-0">{action}</div>
      )}
    </header>
  );
}
