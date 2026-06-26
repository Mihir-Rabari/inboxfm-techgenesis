import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Text + selection
        "file:text-foreground placeholder:text-muted-foreground/55 selection:bg-primary selection:text-primary-foreground",
        // Layout + shape
        "h-12 w-full min-w-0 rounded-[var(--ds-radius-inner)]",
        // Background + visible border
        "bg-background px-4 py-2 text-base",
        "border-2 border-[var(--ds-border-brutalist)]",
        // Transition
        "shadow-none transition-all duration-150 outline-none",
        // File input
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        // Disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        // Focus: border goes primary + flat orange shadow
        "focus-visible:border-primary focus-visible:ring-0 focus-visible:shadow-[3px_3px_0px_0px_rgba(255,106,0,1)] dark:focus-visible:shadow-[3px_3px_0px_0px_rgba(255,106,0,0.8)]",
        // Invalid
        "aria-invalid:border-destructive aria-invalid:shadow-[3px_3px_0px_0px_rgba(239,68,68,1)] dark:aria-invalid:shadow-[3px_3px_0px_0px_rgba(239,68,68,0.8)] aria-invalid:bg-destructive/5",
        className
      )}
      {...props}
    />
  )
}

export { Input }
