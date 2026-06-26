"use client";

import * as React from "react";
import { Warning, Trash, CheckCircle } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/Spinner";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dialog heading */
  title: string;
  /** Supporting description / consequences */
  description?: string;
  /** Confirm button label */
  confirmLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Called when user confirms */
  onConfirm: () => void | Promise<void>;
  /** Visual style of the confirm button + icon accent */
  variant?: "destructive" | "default";
  /** Whether the confirm action is in progress */
  isLoading?: boolean;
}

const variantIconMap = {
  destructive: {
    icon: <Trash size={20} weight="fill" />,
    iconBg: "bg-destructive/10 text-destructive",
  },
  default: {
    icon: <CheckCircle size={20} weight="fill" />,
    iconBg: "bg-primary/10 text-primary",
  },
};

/**
 * ConfirmDialog — accessible, styled confirmation dialog.
 *
 * Replaces `window.confirm()` which is unstyled, inaccessible, and
 * blocked in some iframe/PWA contexts. Uses Radix Dialog under the hood.
 *
 * Usage:
 * ```tsx
 * <ConfirmDialog
 *   open={showDeleteConfirm}
 *   onOpenChange={setShowDeleteConfirm}
 *   title="Delete this brief?"
 *   description="This action cannot be undone. The audio file will also be removed."
 *   onConfirm={handleDelete}
 *   variant="destructive"
 *   confirmLabel="Yes, delete"
 * />
 * ```
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "default",
  isLoading = false,
}: ConfirmDialogProps) {
  const [isPending, setIsPending] = React.useState(false);

  const handleConfirm = async () => {
    setIsPending(true);
    try {
      await onConfirm();
    } finally {
      setIsPending(false);
      onOpenChange(false);
    }
  };

  const loading = isLoading || isPending;
  const { icon, iconBg } = variantIconMap[variant];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xs" showCloseButton={false}>
        <DialogHeader>
          {/* Icon pill */}
          <div
            className={cn(
              "w-12 h-12 rounded-[var(--ds-radius-inner)] flex items-center justify-center mb-1",
              iconBg
            )}
          >
            {icon}
          </div>
          <DialogTitle className="mt-1">{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            size="sm"
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 gap-2"
          >
            {loading && <Spinner size={15} />}
            {loading ? "Please wait…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
