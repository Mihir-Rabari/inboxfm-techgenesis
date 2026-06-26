import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ── Priority Levels (Sender Preference / Settings) ────────────────────────────
const PRIORITY_CONFIG = {
  CRITICAL: {
    label: "Critical",
    className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
  HIGH: {
    label: "High",
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  },
  NORMAL: {
    label: "Normal",
    className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  },
  LOW: {
    label: "Low",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  IGNORE: {
    label: "Ignore",
    className: "bg-muted/60 text-muted-foreground border-muted/50",
  },
} as const;

// ── Brief Status ──────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  DELIVERED: {
    label: "Ready",
    className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
  PENDING: {
    label: "Pending",
    className: "bg-muted/60 text-muted-foreground border-muted/50",
  },
  PROCESSING: {
    label: "Processing",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  // Aliases for other processing states
  FETCHING: {
    label: "Fetching",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  GENERATING_AUDIO: {
    label: "Generating",
    className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  DELIVERING: {
    label: "Delivering",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
} as const;

// ── Schedule Status ───────────────────────────────────────────────────────────
const SCHEDULE_STATUS_CONFIG = {
  active: {
    label: "Active",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  paused: {
    label: "Paused",
    className: "bg-muted/60 text-muted-foreground border-muted/50",
  },
} as const;

type PriorityKey = keyof typeof PRIORITY_CONFIG;
type StatusKey = keyof typeof STATUS_CONFIG;
type ScheduleStatusKey = keyof typeof SCHEDULE_STATUS_CONFIG;

interface StatusBadgeProps {
  /** Priority level (for sender preferences / settings) */
  priority?: PriorityKey;
  /** Brief processing status */
  status?: StatusKey;
  /** Schedule active/paused state */
  scheduleStatus?: ScheduleStatusKey;
  /** Override label text */
  label?: string;
  /** Show a pulsing dot (for processing states) */
  dot?: boolean;
  className?: string;
  size?: "sm" | "default";
}

/**
 * StatusBadge — centralized status/priority badge component.
 *
 * Replaces all the manual `cn()` conditionals for priority tags and status
 * badges scattered across settings, profile, and BriefsList.
 *
 * Usage:
 * ```tsx
 * <StatusBadge priority="CRITICAL" />
 * <StatusBadge status="DELIVERED" />
 * <StatusBadge status="PROCESSING" dot />
 * <StatusBadge scheduleStatus="active" />
 * ```
 */
export function StatusBadge({
  priority,
  status,
  scheduleStatus,
  label,
  dot = false,
  className,
  size = "default",
}: StatusBadgeProps) {
  let config: { label: string; className: string } | null = null;

  if (priority && PRIORITY_CONFIG[priority]) {
    config = PRIORITY_CONFIG[priority];
  } else if (status && STATUS_CONFIG[status]) {
    config = STATUS_CONFIG[status];
  } else if (scheduleStatus && SCHEDULE_STATUS_CONFIG[scheduleStatus]) {
    config = SCHEDULE_STATUS_CONFIG[scheduleStatus];
  }

  if (!config) return null;

  const displayLabel = label ?? config.label;
  const isProcessing =
    status === "PROCESSING" ||
    status === "FETCHING" ||
    status === "GENERATING_AUDIO" ||
    status === "DELIVERING";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-black uppercase tracking-wider border rounded-[var(--ds-radius-pill)]",
        size === "default" ? "px-2.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[9px]",
        config.className,
        className
      )}
    >
      {(dot || isProcessing) && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full bg-current shrink-0",
            isProcessing && "animate-pulse"
          )}
        />
      )}
      {displayLabel}
    </span>
  );
}

// ── Helper to get config (for programmatic use) ───────────────────────────────
export { PRIORITY_CONFIG, STATUS_CONFIG, SCHEDULE_STATUS_CONFIG };
export type { PriorityKey, StatusKey, ScheduleStatusKey };
