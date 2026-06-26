import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground/55 selection:bg-primary selection:text-primary-foreground",
        "flex field-sizing-content min-h-24 w-full",
        "rounded-[var(--ds-radius-inner)] bg-muted/30 dark:bg-muted/20",
        "border border-border/70 dark:border-border/60",
        "px-4 py-3 text-base shadow-none",
        "transition-[box-shadow,border-color,background-color] duration-150 outline-none",
        "focus-visible:border-primary/50 focus-visible:bg-muted/40 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0",
        "aria-invalid:border-destructive/60 aria-invalid:ring-2 aria-invalid:ring-destructive/20 aria-invalid:bg-destructive/5",
        "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
