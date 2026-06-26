"use client";

import { motion } from "framer-motion";
import {
  EnvelopeOpen,
  MagicWand,
  Headphones,
  ArrowCircleRight,
} from "@phosphor-icons/react";

const steps = [
  {
    number: "01",
    title: "Secure Gmail Connection",
    scenario: "Instant Secure Connection",
    description:
      "Securely link your inbox using standard API protocols. We identify primary newsletters, notifications, and threads without storing passwords.",
    icon: <EnvelopeOpen size={28} weight="duotone" className="text-primary" />,
    bg: "bg-primary/[0.03] border-primary/10",
  },
  {
    number: "02",
    title: "AI Synthesis Engine",
    scenario: "Context Synthesis Engine",
    description:
      "Our backend parses updates, prioritizes key items, and writes a narrative-driven audio script that highlights what demands attention.",
    icon: <MagicWand size={28} weight="duotone" className="text-primary" />,
    bg: "bg-primary/[0.03] border-primary/10",
  },
  {
    number: "03",
    title: "Daily Narrative Broadcast",
    scenario: "Listen & Reclaim",
    description:
      "Receive a structured daily podcast brief delivered to your personalized player. Catch up while making coffee or during your commute.",
    icon: <Headphones size={28} weight="duotone" className="text-primary" />,
    bg: "bg-primary/[0.03] border-primary/10",
  },
];

export const HowItWorks = () => {
  const customEase = [0.23, 1, 0.32, 1] as [number, number, number, number];

  return (
    <section className="py-36 relative overflow-hidden bg-background text-foreground border-t border-border/40">
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
          
          {/* Left Column: Focused Narrative Statement */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-32 text-left">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-tight">
              Three steps to <br />
              <span className="text-primary italic font-normal">clarity.</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed font-medium">
              We engineered the Inbox FM briefing workflow around a single objective: complete cognitive rest. No cluttered threads, no screen fatigue. Just key facts delivered in a professional voice broadcast.
            </p>
          </div>

          {/* Right Column: Stylized Asymmetric Steps */}
          <div className="lg:col-span-7 space-y-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: index * 0.12, ease: customEase }}
                className={`group p-8 md:p-10 rounded-[2.5rem] border ${step.bg} shadow-sm hover:shadow-xl hover:shadow-primary/[0.02] active:scale-[0.99] transition-all duration-300 relative overflow-hidden`}
                style={{
                  transform: `translateY(${index * 12}px)`,
                }}
              >
                {/* Visual Step Marker */}
                <div className="absolute -top-4 right-10 w-12 h-12 bg-foreground text-background dark:bg-foreground dark:text-background rounded-2xl flex items-center justify-center text-sm font-mono font-black shadow-lg shadow-black/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  {step.number}
                </div>

                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-border shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                    {step.icon}
                  </div>

                  <div className="space-y-3 text-left">
                    <p className="text-[10px] font-mono text-primary uppercase tracking-[0.25em]">
                      {step.scenario}
                    </p>
                    <h3 className="text-2xl font-black tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-base leading-relaxed font-medium">
                      {step.description}
                    </p>

                    <div className="pt-2 flex items-center gap-1.5 text-primary font-mono text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-8px] group-hover:translate-x-0">
                      View details <ArrowCircleRight weight="bold" size={14} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};
