"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { EnvelopeSimple, InstagramLogo, LinkedinLogo, Sparkle } from "@phosphor-icons/react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

export default function TeamPage() {
  const springTransition = { type: "spring" as const, stiffness: 120, damping: 20 };
  const customEase = [0.23, 1, 0.32, 1] as [number, number, number, number];

  return (
    <main className="min-h-screen bg-background spotlight-bg grain-bg selection:bg-brand-orange/30 selection:text-white overflow-hidden text-foreground">
      {/* Global Sticky Capsule Navbar */}
      <Navbar />

      <div className="relative max-w-6xl mx-auto px-6 pt-32 pb-24 space-y-24 z-10">
        
        {/* Header Masthead */}
        <section className="relative z-10 text-center max-w-3xl mx-auto space-y-6 pt-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springTransition}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/50 border border-black/10 dark:border-zinc-800 backdrop-blur-xl text-[10px] font-mono font-bold text-foreground shadow-sm tracking-[0.18em]"
          >
            <Sparkle weight="fill" className="animate-pulse text-brand-orange" />
            <span className="uppercase text-muted-foreground">The Minds Behind the Machine</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: customEase }}
            className="text-5xl md:text-7xl font-black leading-[0.9] tracking-tighter text-foreground"
          >
            Meet the <span className="italic font-normal text-brand-orange">Team.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8, ease: customEase }}
            className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium pt-4"
          >
            We are a collective of designers, engineers, and strategists obsessed with building high-performance digital tools that respect human attention.
          </motion.p>
        </section>

        {/* Team Grid */}
        <section className="relative z-10 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Mihir Rabari */}
          <Link href="/team/mihir-rabari" className="block group">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative bg-[#FAF6F0] dark:bg-[#161519] rounded-[var(--ds-radius-card)] p-10 overflow-hidden border-2 border-black dark:border-zinc-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.06)] hover:-translate-y-0.5 transition-all duration-300 h-full flex flex-col justify-between"
            >
              <div className="relative z-10 space-y-8 text-left">
                <div className="w-20 h-20 bg-[#FAF6F0] dark:bg-[#0B0B0B] border-2 border-black dark:border-zinc-800 rounded-[var(--ds-radius-inner)] flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_var(--ds-border-brutalist)]">
                  <span className="text-2xl font-black text-brand-orange">MR</span>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-foreground tracking-tight">Mihir Rabari</h3>
                  <p className="text-brand-orange font-mono uppercase tracking-[0.2em] text-[10px] font-bold">Founder & CEO</p>
                </div>

                <p className="text-muted-foreground font-medium leading-relaxed line-clamp-3">
                  Architecting the vision and engineering the core systems. Focused on high-fidelity performance and seamless user experiences.
                </p>

                <div className="pt-6 border-t-2 border-black/10 dark:border-zinc-800/60 flex justify-between items-center">
                  <div className="flex gap-4 text-muted-foreground">
                    <span className="hover:text-brand-orange transition-colors"><EnvelopeSimple size={18} weight="bold" /></span>
                    <span className="hover:text-brand-orange transition-colors"><InstagramLogo size={18} weight="bold" /></span>
                    <span className="hover:text-brand-orange transition-colors"><LinkedinLogo size={18} weight="bold" /></span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-brand-orange transition-colors p-0 h-auto hover:bg-transparent"
                  >
                    View Profile →
                  </Button>
                </div>
              </div>
            </motion.div>
          </Link>

          {/* Khushi Trivedi */}
          <Link href="/team/khushi-trivedi" className="block group">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="relative bg-[#FAF6F0] dark:bg-[#161519] rounded-[var(--ds-radius-card)] p-10 overflow-hidden border-2 border-black dark:border-zinc-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.06)] hover:-translate-y-0.5 transition-all duration-300 h-full flex flex-col justify-between"
            >
              <div className="relative z-10 space-y-8 text-left">
                <div className="w-20 h-20 bg-[#FAF6F0] dark:bg-[#0B0B0B] border-2 border-black dark:border-zinc-800 rounded-[var(--ds-radius-inner)] flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_var(--ds-border-brutalist)]">
                  <span className="text-2xl font-black text-blue-500">KT</span>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-foreground tracking-tight">Khushi Trivedi</h3>
                  <p className="text-blue-500 font-mono uppercase tracking-[0.2em] text-[10px] font-bold dark:text-blue-400">Co-Founder & CMO</p>
                </div>

                <p className="text-muted-foreground font-medium leading-relaxed line-clamp-3">
                  Driving growth, strategy, and narrative. Transforming complex technical capabilities into compelling, human-centric marketing.
                </p>

                <div className="pt-6 border-t-2 border-black/10 dark:border-zinc-800/60 flex justify-between items-center">
                  <div className="flex gap-4 text-muted-foreground">
                    <span className="hover:text-blue-500 transition-colors"><EnvelopeSimple size={18} weight="bold" /></span>
                    <span className="hover:text-blue-500 transition-colors"><InstagramLogo size={18} weight="bold" /></span>
                    <span className="hover:text-blue-500 transition-colors"><LinkedinLogo size={18} weight="bold" /></span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-blue-500 transition-colors p-0 h-auto hover:bg-transparent"
                  >
                    View Profile →
                  </Button>
                </div>
              </div>
            </motion.div>
          </Link>
        </section>
      </div>

      {/* Shared Footer */}
      <Footer />
    </main>
  );
}
