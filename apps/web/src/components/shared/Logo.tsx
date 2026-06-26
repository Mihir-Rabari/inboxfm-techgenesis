import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /**
   * "default" — adapts to theme (foreground text, works on both light + dark bg)
   * "onDark"  — forces white wordmark (use when placed on a dark panel)
   * "onLight" — forces dark wordmark (use when placed on a light panel)
   */
  variant?: "default" | "onDark" | "onLight";
  /** Size of the logo text */
  size?: "sm" | "default" | "lg";
  /** Target corporate name */
  company?: "inboxfm" | "vedlabs";
}

const sizeClasses = {
  sm: "text-lg lg:text-xl",
  default: "text-2xl lg:text-3xl",
  lg: "text-3xl lg:text-4xl",
};

const wordmarkVariant = {
  default: "text-foreground",
  onDark: "text-white",
  onLight: "text-black dark:text-black",
};

export const Logo = ({
  className,
  variant = "default",
  size = "default",
  company = "inboxfm",
}: LogoProps) => {
  const text = company === "vedlabs" ? "VEDLABS" : "INBOXFM";
  return (
    <span
      className={cn(
        "font-archivo-black font-normal tracking-tight select-none",
        sizeClasses[size],
        wordmarkVariant[variant],
        className
      )}
    >
      {text}
    </span>
  );
};
