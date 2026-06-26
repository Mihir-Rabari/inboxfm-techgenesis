import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  /** Phosphor icon element */
  icon?: React.ReactNode;
  /** Main heading */
  title: React.ReactNode;
  /** Supporting description */
  description?: string;
  /** Optional CTA button or content */
  action?: React.ReactNode;
  className?: string;
  /** Controls vertical padding */
  size?: "sm" | "default" | "lg";
  /** Visual variation style */
  variant?: "default" | "minimal";
}

/**
 * EmptyState — unified empty/zero-data placeholder component.
 *
 * Replaces 5+ inconsistent empty state layouts across dashboard pages.
 * Renders a centered icon, heading, description, and optional action.
 *
 * Usage:
 * ```tsx
 * <EmptyState
 *   icon={<FunnelSimple size={32} weight="duotone" />}
 *   title="No sender rules yet"
 *   description="Rules allow you to bypass standard email sorting."
 *   action={<Button size="brand" onClick={...}>Add Rule</Button>}
 * />
 * ```
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  size = "default",
  variant = "default",
}: EmptyStateProps) {
  const paddingClasses = {
    sm: "py-12",
    default: "py-20",
    lg: "py-32",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        variant === "default" && "border-2 border-dashed border-muted/40 rounded-[var(--ds-radius-card)] bg-muted/5",
        "group",
        paddingClasses[size],
        className
      )}
    >
      {icon && (
        <div className={cn(
          "w-16 h-16 mb-5 rounded-[var(--ds-radius-inner)] flex items-center justify-center transition-all group-hover:scale-110",
          variant === "minimal"
            ? "bg-brand-orange/15 border border-brand-orange/20 text-brand-orange"
            : "bg-muted/60 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
        )}>
          {icon}
        </div>
      )}
      {typeof title === "string" ? (
        <h3 className="text-lg font-black tracking-tight mb-2 italic">{title}</h3>
      ) : (
        <div className="mb-2">{title}</div>
      )}
      {description && (
        <p className="text-sm text-muted-foreground font-medium mb-6 max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </motion.div>
  );
}
