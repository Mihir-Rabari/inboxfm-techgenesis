import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base: tactile scale feedback (Emil principle), accessible focus, smooth transition
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:shadow-none dark:disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-500 disabled:border-zinc-300 dark:disabled:border-zinc-700 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary border-2 border-black dark:border-black text-primary-foreground shadow-[3px_3px_0px_0px_#000000] dark:shadow-[3px_3px_0px_0px_var(--primary)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_0px_#000000] dark:hover:shadow-[5px_5px_0px_0px_var(--primary)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
        destructive:
          "bg-destructive border-2 border-black dark:border-black text-white shadow-[3px_3px_0px_0px_#000000] dark:shadow-[3px_3px_0px_0px_var(--destructive)] hover:bg-destructive/90 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_0px_#000000] dark:hover:shadow-[5px_5px_0px_0px_var(--destructive)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
        outline:
          "border-2 border-[var(--ds-border-brutalist)] bg-transparent text-foreground dark:text-[#E5D8C9] shadow-[3px_3px_0px_0px_#000000] dark:shadow-[3px_3px_0px_0px_rgba(255,106,0,0.15)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_0px_#000000] dark:hover:shadow-[5px_5px_0px_0px_rgba(255,106,0,0.25)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary border-2 border-[var(--ds-border-brutalist)] text-secondary-foreground shadow-[3px_3px_0px_0px_#000000] dark:shadow-[3px_3px_0px_0px_#27272A] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_0px_#000000] dark:hover:shadow-[5px_5px_0px_0px_#27272A] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 active:scale-[0.97]",
        link: "text-primary underline-offset-4 hover:underline active:scale-[0.97]",
        // Brand danger — clear visual separation for destructive-adjacent actions
        danger:
          "border-2 border-destructive text-destructive bg-destructive/5 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[var(--ds-shadow-hover)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-destructive hover:text-white transition-all",
      },
      size: {
        default: "h-10 px-5 py-2 rounded-[var(--ds-radius-btn)] has-[>svg]:px-4",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 rounded-[var(--ds-radius-btn)] px-6 has-[>svg]:px-4",
        // Brand CTA — the sleek primary call-to-action button used on page headers
        brand: "h-11 px-6 rounded-[var(--ds-radius-btn)] font-bold text-sm tracking-wide",
        icon: "size-9 rounded-[var(--ds-radius-btn)]",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-10 rounded-[var(--ds-radius-btn)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        ref={ref}
        data-slot="button"
        data-variant={variant}
        data-size={size}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-1.5 h-4 w-4 text-current shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
