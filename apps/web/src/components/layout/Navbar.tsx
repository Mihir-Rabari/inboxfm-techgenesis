"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export const Navbar = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-7xl z-[100] pointer-events-none"
    >
      <div className="relative bg-background/95 dark:bg-[#070709]/95 backdrop-blur-xl px-6 md:px-8 py-3 rounded-2xl border border-border/60 shadow-2xl pointer-events-auto transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col justify-center">
        
        <div className="w-full flex items-center justify-between relative h-10">
          {/* Logo on Left with Hover Dropdown */}
          <div className="flex items-center gap-4 z-20">
            {/* Mobile Hamburger menu toggle (Left aligned on mobile) */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-9 h-9 rounded-xl flex flex-col items-center justify-center gap-1 text-foreground hover:text-brand-orange transition-all active:scale-95 cursor-pointer border border-border/20 bg-secondary/40"
              >
                <span className={`w-4 h-0.5 bg-current rounded transition-transform duration-200 ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                <span className={`w-4 h-0.5 bg-current rounded transition-opacity duration-200 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`w-4 h-0.5 bg-current rounded transition-transform duration-200 ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
              </button>
            </div>

            {/* Desktop Logo */}
            <div className="hidden md:block py-2">
              <Link href="/" className="hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 block">
                <Logo size="sm" className="text-lg sm:text-xl font-black text-glow" />
              </Link>
            </div>

            {/* Mobile Logo (Standard, non-dropdown flex positioning) */}
            <div className="md:hidden">
              <Link href="/" className="hover:scale-[1.03] active:scale-[0.97] transition-all duration-200">
                <Logo size="sm" className="text-lg" />
              </Link>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6 z-10 absolute left-1/2 -translate-x-1/2">
            <Link href="/team" className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-brand-orange transition-colors">
              Team
            </Link>
            <Link href="/blog" className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-brand-orange transition-colors">
              Blog
            </Link>
            <Link href="/releases" className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-brand-orange transition-colors">
              Changelog
            </Link>
            <Link href="/support" className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-brand-orange transition-colors">
              Support
            </Link>
            <Link href="/feedback" className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-brand-orange transition-colors">
              Feedback
            </Link>
          </div>

          {/* Right aligned actions */}
          <div className="flex items-center gap-2 sm:gap-4 z-10 shrink-0">
            <ThemeToggle className="h-9 w-9 rounded-xl hidden sm:flex text-muted-foreground hover:text-foreground border border-border/20 bg-secondary/35" />
            {!isLoading &&
              (isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="sm" className="font-bold text-xs h-9 px-3 sm:px-4 rounded-xl group shadow-lg shadow-brand-orange/10 cursor-pointer">
                    <span className="hidden sm:inline">Dashboard</span>
                    <span className="inline sm:hidden">Portal</span>{" "}
                    <ArrowRight
                      weight="bold"
                      className="ml-1 sm:ml-2 group-hover:translate-x-0.5 transition-transform"
                    />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" className="hidden sm:inline">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-bold text-xs h-9 px-3 rounded-xl hover:text-foreground"
                    >
                      Log in
                    </Button>
                  </Link>
                  <Link href="/apply">
                    <Button size="sm" className="font-bold text-xs h-9 px-3 sm:px-4 rounded-xl group shadow-lg shadow-brand-orange/10 cursor-pointer">
                      <span className="hidden sm:inline">Apply for Access</span>
                      <span className="inline sm:hidden">Apply</span>{" "}
                      <ArrowRight
                        weight="bold"
                        className="ml-1 sm:ml-2 group-hover:translate-x-0.5 transition-transform"
                      />
                    </Button>
                  </Link>
                </>
              ))}
          </div>
        </div>

        {/* Mobile Menu Dropdown list with smooth height expansion */}
        <div
          className="grid transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] md:hidden w-full overflow-hidden"
          style={{
            gridTemplateRows: mobileMenuOpen ? "1fr" : "0fr",
            opacity: mobileMenuOpen ? 1 : 0,
            marginTop: mobileMenuOpen ? "1rem" : "0px",
          }}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-3 pb-3 pt-3 border-t border-border/20 text-left font-bold text-sm">
              <Link
                href="/team"
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-xl hover:bg-secondary/40 transition-colors"
              >
                Meet the Team
              </Link>
              <Link
                href="/blog"
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-xl hover:bg-secondary/40 transition-colors"
              >
                Journal (Blog)
              </Link>
              <Link
                href="/releases"
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-xl hover:bg-secondary/40 transition-colors"
              >
                Changelog
              </Link>
              <Link
                href="/support"
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-xl hover:bg-secondary/40 transition-colors"
              >
                Help Desk (Support)
              </Link>
              <Link
                href="/feedback"
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-xl hover:bg-secondary/40 transition-colors"
              >
                System Feedback
              </Link>
            </div>
          </div>
        </div>

      </div>
    </motion.nav>
  );
};
