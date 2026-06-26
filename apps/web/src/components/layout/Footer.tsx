"use client";

import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

export const Footer = () => {
  return (
    <footer className="pt-24 border-t-2 border-[var(--ds-border-brutalist)] pb-12 bg-background text-left w-full">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="space-y-6 col-span-1 md:col-span-1">
          <Logo size="sm" />
          <p className="text-sm text-muted-foreground/80 max-w-xs leading-relaxed font-medium">
            Premium AI audio briefings helping you capture outcomes and clear inbox noise hands-free.
          </p>
        </div>

        <div className="space-y-5 text-left col-span-1">
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-foreground">Product</p>
          <div className="flex flex-col gap-3 text-xs font-semibold text-muted-foreground">
            <Link href="/team" className="hover:text-brand-orange hover:translate-x-0.5 transition-all duration-200">Meet the Team</Link>
            <Link href="/blog" className="hover:text-brand-orange hover:translate-x-0.5 transition-all duration-200">Journal (Blog)</Link>
            <Link href="/releases" className="hover:text-brand-orange hover:translate-x-0.5 transition-all duration-200">Changelog</Link>
          </div>
        </div>

        <div className="space-y-5 text-left col-span-1">
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-foreground">Support</p>
          <div className="flex flex-col gap-3 text-xs font-semibold text-muted-foreground">
            <Link href="/support" className="hover:text-brand-orange hover:translate-x-0.5 transition-all duration-200">Help Desk</Link>
            <Link href="/feedback" className="hover:text-brand-orange hover:translate-x-0.5 transition-all duration-200">Feedback Hub</Link>
          </div>
        </div>

        <div className="space-y-5 text-left col-span-1">
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-foreground">Legal</p>
          <div className="flex flex-col gap-3 text-xs font-semibold text-muted-foreground">
            <Link href="/privacy" className="hover:text-brand-orange hover:translate-x-0.5 transition-all duration-200">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-brand-orange hover:translate-x-0.5 transition-all duration-200">Terms of Service</Link>
            <Link href="/cookies" className="hover:text-brand-orange hover:translate-x-0.5 transition-all duration-200">Cookie Policy</Link>
            <Link href="/security" className="hover:text-brand-orange hover:translate-x-0.5 transition-all duration-200">Security Policy</Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 border-t-2 border-[var(--ds-border-brutalist)] pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-[0.2em]">
          © {new Date().getFullYear()} VEDLABS &amp; INBOXFM. ALL RIGHTS RESERVED.
        </p>
        <div className="flex items-center gap-6 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/60">
          <Link
            href="https://sarvam.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-brand-orange transition-colors"
          >
            POWERED BY SARVAM
          </Link>
        </div>
      </div>
    </footer>
  );
};
