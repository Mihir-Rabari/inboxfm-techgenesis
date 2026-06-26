"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  House,
  ListBullets,
  User,
  SignOut,
  CaretLeft,
  CaretRight,
  ShieldCheck,
  X,
  Gear,
  Plugs,
  Lifebuoy,
  ChatCircle,
  Broadcast,
  PaintBrush,
  CheckSquare,
  Briefcase,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Logo } from "@/components/shared/Logo";
import { useActionItems } from "@/hooks/useActionItems";
import { useEffect } from "react";

interface SidebarProps {
  onClose?: () => void;
}

type NavItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  exact?: boolean;
};

const overviewLinks: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <House size={18} weight="regular" />,
    activeIcon: <House size={18} weight="fill" />,
    exact: true,
  },
  {
    name: "Workspace",
    href: "/workspace",
    icon: <Briefcase size={18} weight="regular" />,
    activeIcon: <Briefcase size={18} weight="fill" />,
  },
  {
    name: "Action Items",
    href: "/action-items",
    icon: <CheckSquare size={18} weight="regular" />,
    activeIcon: <CheckSquare size={18} weight="fill" />,
  },
  {
    name: "Briefings",
    href: "/briefings",
    icon: <Broadcast size={18} weight="regular" />,
    activeIcon: <Broadcast size={18} weight="fill" />,
  },
  {
    name: "Summaries",
    href: "/summaries",
    icon: <ListBullets size={18} weight="regular" />,
    activeIcon: <ListBullets size={18} weight="fill" />,
  },
  {
    name: "Styles",
    href: "/styles",
    icon: <PaintBrush size={18} weight="regular" />,
    activeIcon: <PaintBrush size={18} weight="fill" />,
  },
];

const accountLinks: NavItem[] = [
  {
    name: "Profile",
    href: "/profile",
    icon: <User size={18} weight="regular" />,
    activeIcon: <User size={18} weight="fill" />,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: <Gear size={18} weight="regular" />,
    activeIcon: <Gear size={18} weight="fill" />,
  },
  {
    name: "Integrations",
    href: "/integrations",
    icon: <Plugs size={18} weight="regular" />,
    activeIcon: <Plugs size={18} weight="fill" />,
  },
];

const supportLinks: NavItem[] = [
  {
    name: "Support",
    href: "/support",
    icon: <Lifebuoy size={18} weight="regular" />,
    activeIcon: <Lifebuoy size={18} weight="fill" />,
  },
  {
    name: "Feedback",
    href: "/feedback",
    icon: <ChatCircle size={18} weight="regular" />,
    activeIcon: <ChatCircle size={18} weight="fill" />,
  },
];

const sections = [
  { title: "Overview", links: overviewLinks },
  { title: "Account", links: accountLinks },
  { title: "Support", links: supportLinks },
];

export const Sidebar = ({ onClose }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { counts } = useActionItems();

  const isAdminActive = pathname.startsWith("/admin");
  const isActive = (link: NavItem) => {
    const normPath = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
    const normHref = link.href.endsWith("/") && link.href.length > 1 ? link.href.slice(0, -1) : link.href;
    return link.exact ? normPath === normHref : normPath.startsWith(normHref);
  };

  const userInitial =
    user?.name?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "U";
  const displayName = user?.name || user?.email?.split("@")[0] || "User";

  const renderLink = (link: NavItem) => {
    const active = isActive(link);
    return (
      <Link key={link.href} href={link.href} onClick={onClose}>
        <div
          className={cn(
            "group relative flex items-center gap-3 rounded-[var(--ds-radius-btn)] px-3 py-2.5 transition-all duration-150 select-none border-2",
            active
              ? "bg-primary text-primary-foreground border-[var(--ds-border-brutalist)] shadow-[var(--ds-shadow-primary)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[var(--ds-shadow-hover)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            isCollapsed && "justify-center px-2",
          )}
        >


          {/* Icon */}
          <span className="shrink-0">
            {active ? link.activeIcon : link.icon}
          </span>

          {/* Label */}
          {!isCollapsed && (
            <span className={cn("text-sm", active ? "font-bold" : "font-medium")}>
              {link.name}
            </span>
          )}

          {/* Pending Action Items Count Badge */}
          {!isCollapsed && link.name === "Action Items" && counts.PENDING > 0 && (
            <span className="ml-auto bg-red-500 text-white border border-black font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:border-zinc-700 shrink-0">
              {counts.PENDING}
            </span>
          )}

          {/* Collapsed tooltip */}
          {isCollapsed && (
            <div className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-lg bg-popover border border-border/50 px-2.5 py-1.5 text-xs font-semibold text-popover-foreground shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
              {link.name}
            </div>
          )}
        </div>
      </Link>
    );
  };

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 68 : 256 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="sticky top-0 z-40 flex h-screen flex-col bg-background border-r-2 border-[var(--ds-border-brutalist)] overflow-hidden"
    >
      {/* ── Brand header ── */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b-2 border-[var(--ds-border-brutalist)] shrink-0",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed ? (
          <Link href="/" className="flex items-center">
            <Logo size="sm" />
          </Link>
        ) : (
          <Link href="/" className="flex items-center justify-center">
            {/* Collapsed: icon-only pill */}
            <div className="w-8 h-8 rounded-[var(--ds-radius-btn)] bg-primary border-2 border-[var(--ds-border-brutalist)] text-primary-foreground flex items-center justify-center shadow-[var(--ds-shadow-primary)]">
              <span className="text-[11px] font-black">FM</span>
            </div>
          </Link>
        )}

        {!isCollapsed && (
          <div className="flex items-center gap-1">
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-lg lg:hidden"
                aria-label="Close menu"
              >
                <X size={16} />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsCollapsed(true)}
              className="h-8 w-8 rounded-lg hidden lg:flex border-2 border-[var(--ds-border-brutalist)] shadow-[var(--ds-shadow-primary)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[var(--ds-shadow-hover)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none bg-background text-foreground"
              aria-label="Collapse sidebar"
            >
              <CaretLeft size={16} weight="bold" />
            </Button>
          </div>
        )}

        {isCollapsed && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsCollapsed(false)}
            className="absolute bottom-[88px] left-1/2 -translate-x-1/2 h-8 w-8 rounded-lg hidden lg:flex border-2 border-[var(--ds-border-brutalist)] shadow-[var(--ds-shadow-primary)] hover:bg-muted active:scale-95 bg-background text-foreground"
            aria-label="Expand sidebar"
          >
            <CaretRight size={14} weight="bold" />
          </Button>
        )}
      </div>

      {/* ── Nav content ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-6 scrollbar-none">
        {sections.map((section) => (
          <div key={section.title}>
            {/* Section label */}
            {!isCollapsed && (
              <p className="mb-1.5 px-3 text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground/45">
                {section.title}
              </p>
            )}
            {isCollapsed && (
              <div className="mb-1.5 h-px bg-border/40 mx-1" />
            )}
            <div className="space-y-0.5">
              {section.links.map(renderLink)}
            </div>
          </div>
        ))}

        {/* Admin section */}
        {user?.isAdmin && (
          <div>
            {!isCollapsed && (
              <p className="mb-1.5 px-3 text-[9px] font-black uppercase tracking-[0.22em] text-primary/60">
                Admin
              </p>
            )}
            {isCollapsed && <div className="mb-1.5 h-px bg-primary/20 mx-1" />}
            <Link href="/admin" onClick={onClose}>
              <div
                className={cn(
                  "group relative flex items-center gap-3 rounded-[var(--ds-radius-btn)] px-3 py-2.5 transition-all duration-150 select-none border-2",
                  isAdminActive
                    ? "bg-primary text-primary-foreground border-[var(--ds-border-brutalist)] shadow-[var(--ds-shadow-primary)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[var(--ds-shadow-hover)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                    : "border-transparent text-primary/70 hover:bg-primary/8 hover:text-primary",
                  isCollapsed && "justify-center px-2",
                )}
              >
                <span className="shrink-0">
                  <ShieldCheck size={18} weight={isAdminActive ? "fill" : "regular"} />
                </span>
                {!isCollapsed && (
                  <span className={cn("text-sm", isAdminActive ? "font-bold" : "font-medium")}>
                    Admin Panel
                  </span>
                )}
                {isCollapsed && (
                  <div className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-lg bg-popover border border-border/50 px-2.5 py-1.5 text-xs font-semibold text-popover-foreground shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
                    Admin Panel
                  </div>
                )}
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* ── Bottom: User + actions ── */}
      <div className="shrink-0 border-t-2 border-[var(--ds-border-brutalist)] px-3 py-3 space-y-1">
        {/* Powered by Sarvam */}
        <a
          href="https://sarvam.ai"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "group relative w-full flex items-center gap-2 px-3 py-1.5 mb-1 rounded-[var(--ds-radius-btn)] text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/40 transition-all duration-200 select-none",
            isCollapsed && "justify-center px-2"
          )}
        >
          {!isCollapsed && (
            <span className="text-[10px] font-bold tracking-wide">
              Powered by Sarvam
            </span>
          )}
          {isCollapsed && (
            <div className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-lg bg-popover border border-border/50 px-2.5 py-1.5 text-xs font-semibold text-popover-foreground shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
              Powered by Sarvam
            </div>
          )}
        </a>

        {/* User card */}
        {user && !isCollapsed && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1">
            <Avatar className="h-8 w-8 shrink-0 border-2 border-[var(--ds-border-brutalist)]">
              <AvatarImage src={user.picture || undefined} />
              <AvatarFallback className="text-[10px] font-black bg-primary/10 text-primary">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold leading-tight">
                {displayName}
              </p>
              <p className="truncate text-[10px] text-muted-foreground/60 font-medium leading-tight">
                {user.email}
              </p>
            </div>
            <ThemeToggle className="h-7 w-7 shrink-0 rounded-lg text-muted-foreground" />
          </div>
        )}

        {/* Collapsed: avatar + theme toggle stacked */}
        {user && isCollapsed && (
          <div className="flex flex-col items-center gap-1 pb-1">
            <Avatar className="h-8 w-8 border-2 border-[var(--ds-border-brutalist)]">
              <AvatarImage src={user.picture || undefined} />
              <AvatarFallback className="text-[10px] font-black bg-primary/10 text-primary">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <ThemeToggle className="h-7 w-7 rounded-lg text-muted-foreground" />
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={logout}
          className={cn(
            "group w-full flex items-center gap-3 rounded-[var(--ds-radius-btn)] px-3 py-2.5 text-sm text-muted-foreground border-2 border-transparent hover:bg-red-500/10 hover:text-red-500 transition-all duration-205 select-none",
            isCollapsed && "justify-center px-2.5"
          )}
        >
          <SignOut
            size={18}
            weight="bold"
            className="shrink-0 group-hover:-translate-x-0.5 transition-transform"
          />
          {!isCollapsed && (
            <span className="font-medium">Sign out</span>
          )}
          {isCollapsed && (
            <div className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-lg bg-popover border border-border/50 px-2.5 py-1.5 text-xs font-semibold text-popover-foreground shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
              Sign out
            </div>
          )}
        </button>
      </div>
    </motion.aside>
  );
};
