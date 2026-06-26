import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "text-card-foreground flex flex-col transition-all duration-300",
  {
    variants: {
      variant: {
        // Default: standard card with border and card bg
        default: "bg-card border-2 rounded-[var(--ds-radius-inner)] shadow-[var(--ds-shadow-card)]",
        // Glass: the premium frosted-glass section card used throughout the dashboard
        glass: "glass rounded-[var(--ds-radius-card)] shadow-[var(--ds-shadow-card)] hover:shadow-[var(--ds-shadow-hover)]",
        // Flat: no shadow, just a subtle border — for inner/nested cards
        flat: "bg-muted/30 border-2 border-border/50 rounded-[var(--ds-radius-inner)]",
        // Ghost: invisible background, just structure
        ghost: "rounded-[var(--ds-radius-inner)]",
      },
      gap: {
        none: "gap-0",
        sm: "gap-4",
        default: "gap-6",
        lg: "gap-8",
      },
    },
    defaultVariants: {
      variant: "default",
      gap: "default",
    },
  }
)

function Card({
  className,
  variant,
  gap,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant, gap }), className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
