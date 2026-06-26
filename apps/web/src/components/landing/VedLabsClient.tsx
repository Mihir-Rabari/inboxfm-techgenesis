"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Headphones,
  Atom,
  Globe,
  GithubLogo,
  TwitterLogo,
  Calendar,
  Waves,
  ShieldCheck,
  Lightning,
  Users,
  Notebook,
  ArrowUpRight,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";

export function VedLabsClient() {
  const customEase = [0.23, 1, 0.32, 1] as [number, number, number, number];
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { href: "#mission", label: "Philosophy" },
    { href: "", label: "Inbox FM" },
    { href: "/team", label: "Team" },
    { href: "/releases", label: "Changelog" },
  ];

  return (
    <main className="min-h-screen bg-background spotlight-bg grain-bg selection:bg-primary/30 selection:text-white overflow-hidden text-foreground">
      {/* Navigation — Collapsible, matches InboxFM pattern */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-7xl z-[100] pointer-events-none">
        <div className="relative bg-background/95 dark:bg-[#050505]/95 backdrop-blur-xl px-6 md:px-8 py-3 rounded-[var(--ds-radius-inner)] flex flex-col justify-center border border-border/60 shadow-[var(--ds-shadow-card)] pointer-events-auto transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]">
          
          <div className="w-full flex items-center justify-between relative h-10">
            {/* Left: Hamburger (mobile) + Logo */}
            <div className="flex items-center gap-4 z-20">
              {/* Mobile Hamburger */}
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

              {/* Logo */}
              <Link href="/" className="hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 block">
                <Logo company="vedlabs" size="sm" className="text-lg sm:text-xl font-black text-glow" />
              </Link>
            </div>

            {/* Center: Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground px-3 py-2 rounded-xl hover:bg-secondary/40 transition-all duration-200 uppercase tracking-widest"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right: CTA */}
            <div className="ml-auto z-10 shrink-0">
              <Link href="">
                <Button className="font-bold text-xs h-9 px-3 sm:px-5 rounded-xl shadow-lg shadow-primary/20 group active:scale-[0.96] transition-transform duration-200 cursor-pointer">
                  <span className="hidden sm:inline">Launch Inbox FM</span>
                  <span className="inline sm:hidden">Launch</span>{" "}
                  <ArrowRight
                    weight="bold"
                    className="ml-1 sm:ml-2 group-hover:translate-x-0.5 transition-transform"
                  />
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Dropdown — smooth height expansion */}
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
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-xl hover:bg-secondary/40 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>
      </nav>

      <div className="relative max-w-7xl mx-auto px-6 pt-40 pb-24 space-y-40">
        {/* ═══════════════════════════════════════════════════
            HERO SECTION — Left-aligned, asymmetric
        ═══════════════════════════════════════════════════ */}
        <section className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-center">
          <div className="lg:col-span-7 space-y-8 text-left">

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: customEase }}
              className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9]"
            >
              Digital tools <br />
              <span className="text-brand-orange font-normal italic">
                #that empower.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8, ease: customEase }}
              className="text-lg md:text-xl text-muted-foreground max-w-[50ch] leading-relaxed font-medium"
            >
              We craft high-performance, minimalist software designed to respect your focus and automate your daily catch-up.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: customEase }}
              className="flex flex-wrap gap-4 pt-4"
            >
              <Link href="">
                <Button
                  size="lg"
                  className="h-14 px-8 rounded-full font-bold text-sm shadow-xl shadow-primary/10 hover:scale-[1.02] active:scale-[0.97] transition-all group cursor-pointer"
                >
                  Explore Inbox FM{" "}
                  <ArrowRight
                    weight="bold"
                    className="ml-2 group-hover:translate-x-1 transition-transform"
                  />
                </Button>
              </Link>
              <Link href="#mission">
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-14 px-8 rounded-full font-bold bg-secondary/40 text-foreground hover:bg-secondary/60 hover:scale-[1.02] active:scale-[0.97] transition-all border border-border cursor-pointer"
                >
                  Our Philosophy
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Right Column: Abstract Orbital */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 1, ease: customEase }}
            className="lg:col-span-5 relative aspect-square rounded-[var(--ds-radius-card)] glass border border-border/40 p-12 flex flex-col items-center justify-center shadow-[var(--ds-shadow-card)] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/10 via-transparent to-brand-orange/5" />
            <div className="relative w-full h-full border border-border/20 rounded-full flex items-center justify-center">
              <div className="absolute w-full h-full border border-dashed border-border/30 rounded-full animate-[spin_120s_linear_infinite]" />
              <div className="w-3/4 h-3/4 border border-border/30 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 bg-brand-orange/20 blur-[64px] rounded-full animate-pulse opacity-40" />
                <Atom
                  size={96}
                  weight="thin"
                  className="text-brand-orange/40 animate-[spin_30s_linear_infinite]"
                />
              </div>
            </div>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════════════════
            FEATURED PRODUCT: Inbox FM
        ═══════════════════════════════════════════════════ */}
        <section className="space-y-12">
          <div className="flex justify-between items-end border-b border-border/30 pb-6">
            <div className="space-y-1">
              <p className="text-3xl md:text-4xl font-black tracking-tighter">
                Inbox FM
              </p>
              <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">
                Our flagship audio catch-up utility
              </p>
            </div>
            <Link
              href=""
              className="text-xs font-mono text-muted-foreground hover:text-brand-orange transition-colors flex items-center gap-2 uppercase tracking-widest active:scale-[0.98]"
            >
              Launch App <ArrowRight />
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: customEase }}
            className="relative rounded-[var(--ds-radius-card)] p-px bg-gradient-to-br from-brand-orange/20 to-transparent border border-border/40 overflow-hidden shadow-[var(--ds-shadow-hover)]"
          >
            <div className="relative z-10 glass rounded-[calc(var(--ds-radius-card)-1px)] p-8 md:p-16 flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
              <div className="flex-1 space-y-8 text-left">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-brand-orange/10 rounded-[var(--ds-radius-inner)] border border-brand-orange/20 flex items-center justify-center text-brand-orange shadow-inner">
                    <Headphones size={36} weight="fill" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black tracking-tighter">
                      Audio Intelligence
                    </h3>
                    <p className="text-brand-orange font-mono uppercase tracking-[0.2em] text-[10px] mt-1">
                      Gmail Briefing Engine
                    </p>
                  </div>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                  Transform your cluttered newsletters and async updates into a curated morning briefing. Rest your eyes and capture key updates on your commute with natural voice output.
                </p>

                {/* Feature Pills */}
                <div className="flex flex-wrap gap-3 pt-2">
                  {[
                    { icon: <Calendar size={14} weight="bold" />, label: "Scheduled Delivery" },
                    { icon: <Waves size={14} weight="bold" />, label: "Natural Audio" },
                    { icon: <ShieldCheck size={14} weight="bold" />, label: "OAuth 2.0" },
                    { icon: <Lightning size={14} weight="bold" />, label: "Context Engine" },
                  ].map((f) => (
                    <span
                      key={f.label}
                      className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground bg-secondary/50 border border-border/40 px-3 py-1.5 rounded-full"
                    >
                      {f.icon} {f.label}
                    </span>
                  ))}
                </div>

                <div className="pt-4">
                  <Link href="">
                    <Button
                      size="lg"
                      className="rounded-full font-bold px-8 active:scale-[0.97] transition-all group cursor-pointer"
                    >
                      Configure Briefing{" "}
                      <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Visual Preview */}
              <div className="w-full lg:w-[400px] aspect-square relative shrink-0">
                <div className="absolute inset-0 bg-brand-orange/20 rounded-full blur-[96px] animate-pulse opacity-30" />
                <div className="relative h-full glass rounded-[var(--ds-radius-card)] border border-border/40 p-8 overflow-hidden shadow-[var(--ds-shadow-card)] flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-border/30 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-ping" />
                      <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">Synthesizing</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">08:00 AM</span>
                  </div>
                  
                  <div className="py-8 flex flex-col items-center gap-6">
                    <div className="w-28 h-28 bg-brand-orange rounded-full flex items-center justify-center shadow-lg shadow-brand-orange/30 relative">
                      <div className="absolute inset-0 bg-brand-orange/20 rounded-full animate-ping" />
                      <div className="flex items-end gap-1 relative z-10 h-10">
                        {[12, 28, 36, 20, 12].map((height, i) => (
                          <div
                            key={i}
                            className="w-1.5 bg-white dark:bg-zinc-900 rounded-full animate-waveform-bar"
                            style={{
                              height: `${height}px`,
                              animationDelay: `${i * 0.15}s`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-foreground font-bold text-lg">
                        Daily Briefing
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-widest">
                        04:22 / 06:15
                      </p>
                    </div>
                  </div>

                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-brand-orange rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════════════════
            WHAT WE BUILD — Capability Strip
        ═══════════════════════════════════════════════════ */}
        <section className="space-y-12">
          <div className="space-y-4 max-w-xl text-left">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-tight">
              Built for people <br />
              <span className="text-muted-foreground/30 font-normal italic">who value attention.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Waves size={22} weight="fill" />,
                title: "Audio-First",
                description: "Replace screen time with voice briefings. Your commute becomes productive without lifting a finger.",
                accent: "brand-orange",
              },
              {
                icon: <ShieldCheck size={22} weight="fill" />,
                title: "Privacy by Design",
                description: "Read-only OAuth access. No passwords stored. No email content retained. Disconnect anytime.",
                accent: "emerald-500",
              },
              {
                icon: <Lightning size={22} weight="fill" />,
                title: "Context Engine",
                description: "Our AI synthesizes related threads into a single narrative. Not a summary list — a coherent story.",
                accent: "brand-orange",
              },
            ].map((card) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, ease: customEase }}
                className="glass border border-border/40 p-8 rounded-[var(--ds-radius-card)] flex flex-col justify-between gap-6 hover:border-brand-orange/20 transition-all duration-300 relative overflow-hidden group"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 bg-${card.accent}/5 rounded-full blur-[40px] pointer-events-none`} />
                <div className="space-y-4 text-left">
                  <div className={`w-10 h-10 rounded-[var(--ds-radius-inner)] bg-${card.accent}/10 border border-${card.accent}/20 flex items-center justify-center text-${card.accent} shrink-0`}>
                    {card.icon}
                  </div>
                  <h3 className="text-xl font-black tracking-tight">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    {card.description}
                  </p>
                </div>
                <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/40 text-left">
                  VedLabs Engineering
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            MISSION SECTION
        ═══════════════════════════════════════════════════ */}
        <section id="mission" className="py-12 border-t border-border/30 text-left">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center">
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-4">
                <p className="text-[11px] font-mono text-brand-orange uppercase tracking-[0.25em]">
                  The Philosophy
                </p>
                <p className="text-4xl md:text-6xl font-black tracking-tighter leading-tight">
                  Redefining digital <br />
                  <span className="italic text-muted-foreground/30 font-normal">
                    equilibrium.
                  </span>
                </p>
              </div>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium max-w-[50ch]">
                VedLabs is dedicated to building high-utility, low-friction software that respects your attention. We reject addictive feeds in favor of focused, beautifully typeset digital systems.
              </p>

              <div className="pt-4 grid grid-cols-3 gap-8 border-t border-border/30 max-w-md">
                <div className="space-y-1">
                  <div className="text-foreground font-black text-2xl">2025</div>
                  <div className="text-[9px] text-muted-foreground uppercase font-mono tracking-widest">
                    Established
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-foreground font-black text-2xl">01</div>
                  <div className="text-[9px] text-muted-foreground uppercase font-mono tracking-widest">
                    Product
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-foreground font-black text-2xl">∞</div>
                  <div className="text-[9px] text-muted-foreground uppercase font-mono tracking-widest">
                    Focus
                  </div>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: customEase }}
              className="lg:col-span-5 relative aspect-square glass rounded-[var(--ds-radius-card)] border border-border/40 flex items-center justify-center p-12 overflow-hidden shadow-[var(--ds-shadow-card)]"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-orange/5 to-transparent" />
              <div className="relative w-full h-full border border-border/30 rounded-full flex items-center justify-center">
                <div className="absolute w-full h-full border border-dashed border-border/30 rounded-full animate-[spin_60s_linear_infinite]" />
                <div className="w-3/4 h-3/4 border border-border/30 rounded-full flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-brand-orange/10 blur-[80px] rounded-full animate-pulse" />
                  <Atom
                    size={48}
                    weight="fill"
                    className="text-brand-orange shadow-2xl animate-[spin_10s_linear_infinite]"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            TEAM CTA — Quick access
        ═══════════════════════════════════════════════════ */}
        <section className="border-t border-border/30 pt-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: customEase }}
            className="glass rounded-[var(--ds-radius-card)] border border-border/40 p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-orange/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="space-y-4 text-left max-w-lg relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[var(--ds-radius-inner)] bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-brand-orange">
                  <Users size={20} weight="fill" />
                </div>
                <h3 className="text-2xl font-black tracking-tighter">Meet the Team</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                The minds behind InboxFM. Building the future of digital focus and human-centered AI.
              </p>
            </div>
            <div className="flex gap-4 shrink-0 relative z-10">
              <Link href="/team">
                <Button className="rounded-full font-bold px-6 active:scale-[0.97] transition-all group cursor-pointer">
                  View Team <ArrowUpRight weight="bold" className="ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
              <Link href="/releases">
                <Button variant="secondary" className="rounded-full font-bold px-6 active:scale-[0.97] transition-all border border-border cursor-pointer">
                  Changelog
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════════════════
            FOOTER
        ═══════════════════════════════════════════════════ */}
        <footer className="pt-24 border-t border-border/30 pb-12 flex flex-col md:flex-row justify-between items-center gap-12 text-left">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Logo company="vedlabs" />
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-[0.2em]">
              © {new Date().getFullYear()} VEDLABS. ALL RIGHTS RESERVED.
            </p>
          </div>

          <div className="flex items-center gap-8">
            <Link
              href="https://twitter.com/vedlabs"
              className="text-muted-foreground hover:text-brand-orange transition-colors active:scale-[0.95]"
            >
              <TwitterLogo size={20} weight="bold" />
            </Link>
            <Link
              href="https://github.com/vedlabs"
              className="text-muted-foreground hover:text-brand-orange transition-colors active:scale-[0.95]"
            >
              <GithubLogo size={20} weight="bold" />
            </Link>
          </div>

          <div className="flex items-center gap-8 text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <span className="flex items-center gap-1.5 text-muted-foreground/50">
              <Globe weight="bold" /> REGION: GLOBAL
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}
