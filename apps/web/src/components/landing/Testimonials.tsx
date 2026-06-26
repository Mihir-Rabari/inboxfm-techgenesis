"use client";

import { motion } from "framer-motion";
import { Star } from "@phosphor-icons/react";

const testimonials = [
  {
    author: "Elena Rostova",
    role: "Senior Director of Operations",
    quote: "“Inbox FM gives me the exact operational signal I need from 200+ threads every single morning. I listen on my short commute and arrive at my desk completely clear.”",
  },
  {
    author: "Marc Werner",
    role: "Founding Engineer",
    quote: "“The voice synthesis sounds incredibly human, like an actual morning briefing. It aggregates complex technical alerts into actionable 5-minute segments.”",
  },
  {
    author: "Sarah Jenkins",
    role: "Product Lead",
    quote: "“As someone with significant inbox overload, this tool completely changed my morning ritual. It filters the noise and lets me focus on building first.”",
  },
];

export const Testimonials = () => {
  const customEase = [0.23, 1, 0.32, 1] as [number, number, number, number];

  return (
    <section className="py-36 relative overflow-hidden bg-background text-foreground border-t border-border/40">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: customEase }}
            className="text-4xl md:text-5xl font-black tracking-tight"
          >
            What early users <br />
            <span className="text-primary italic font-normal">are saying.</span>
          </motion.h2>
          <p className="text-lg text-muted-foreground leading-relaxed font-medium">
            Rollout observations and verified reviews from beta users across high-growth workspaces.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.8, ease: customEase }}
              className="glass p-10 rounded-[2.5rem] relative flex flex-col justify-between hover:shadow-xl active:scale-[0.99] transition-all duration-300 border border-border/50 hover:border-primary/20 text-left"
            >
              <div className="space-y-6">
                {/* Five star indicator */}
                <div className="flex gap-1 text-primary">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={16} weight="fill" />
                  ))}
                </div>

                <p className="text-base text-muted-foreground leading-relaxed font-medium">
                  {item.quote}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-border/40 flex flex-col gap-1">
                <span className="font-black text-sm text-foreground">{item.author}</span>
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{item.role}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
