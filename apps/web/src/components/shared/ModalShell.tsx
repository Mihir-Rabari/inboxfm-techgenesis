import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface ModalShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Phosphor icon inside the header icon pill */
  icon?: React.ReactNode;
  /** Modal title */
  title: string;
  /** Optional subtitle */
  description?: string;
  /** Footer slot — buttons, actions */
  footer?: React.ReactNode;
  /** Body content */
  children: React.ReactNode;
  /** Max-width size variant */
  size?: "xs" | "sm" | "default" | "lg" | "xl";
  /** Remove default p-8 padding — for edge-to-edge modals */
  noPadding?: boolean;
  /** Icon accent color — defaults to primary */
  iconVariant?: "primary" | "destructive" | "success" | "warning" | "neutral";
  className?: string;
}

const iconVariantClasses = {
  primary: "bg-primary/10 text-primary",
  destructive: "bg-destructive/10 text-destructive",
  success: "bg-emerald-500/10 text-emerald-500",
  warning: "bg-amber-500/10 text-amber-500",
  neutral: "bg-muted text-muted-foreground",
};

/**
 * ModalShell — the single reusable modal wrapper for the entire app.
 *
 * Composes the upgraded Dialog primitives with a consistent icon+title+description
 * header and a footer slot. Replaces the ~4 different per-modal layout patterns.
 *
 * Usage:
 * ```tsx
 * <ModalShell
 *   open={open}
 *   onOpenChange={setOpen}
 *   icon={<Gear size={22} weight="fill" />}
 *   title="Edit Schedule"
 *   description="Update your delivery time and voice persona."
 *   footer={<Button size="brand">Save Changes</Button>}
 *   size="default"
 * >
 *   <MyFormContent />
 * </ModalShell>
 * ```
 */
export function ModalShell({
  open,
  onOpenChange,
  icon,
  title,
  description,
  footer,
  children,
  size = "default",
  noPadding = false,
  iconVariant = "primary",
  className,
}: ModalShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size={size}
        className={cn(noPadding && "p-0 overflow-hidden", className)}
      >
        <DialogHeader>
          {icon && (
            <div
              className={cn(
                "w-11 h-11 rounded-[var(--ds-radius-inner)] flex items-center justify-center mb-3 shrink-0",
                iconVariantClasses[iconVariant]
              )}
            >
              {icon}
            </div>
          )}
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className={cn(noPadding ? "" : "space-y-4")}>{children}</div>

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

// Also export a simpler trigger-less content wrapper for inline Dialog usage
export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
