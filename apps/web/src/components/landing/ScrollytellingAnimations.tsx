"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  EnvelopeOpen, 
  MagicWand, 
  Headphones, 
  CheckCircle, 
  LockKey, 
  Globe, 
  Waves, 
  ShieldCheck,
  Sparkle
} from "@phosphor-icons/react";

// --- Step 1: Secure Inbox Connection Animation ---
export const ConnectGmailAnimation = () => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: '100px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const [status, setStatus] = React.useState<"idle" | "connecting" | "success">("idle");
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (!isVisible) {
      setStatus("idle");
      setProgress(0);
      return;
    }

    let timeout: NodeJS.Timeout;
    let interval: NodeJS.Timeout;

    if (status === "idle") {
      timeout = setTimeout(() => {
        setStatus("connecting");
        setProgress(0);
      }, 1500); // stay idle for 1.5s before connecting
    } else if (status === "connecting") {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setStatus("success");
            return 100;
          }
          return prev + 4;
        });
      }, 80);
    } else if (status === "success") {
      timeout = setTimeout(() => {
        setStatus("idle");
        setProgress(0);
      }, 3500); // display success state for 3.5s before looping
    }

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [status, isVisible]);

  return (
    <div ref={ref} className="w-full bg-card/60 backdrop-blur-md rounded-[1.5rem] border border-border/50 p-6 shadow-xl relative overflow-hidden text-left mt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-pulse" />
          <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground uppercase">
            Ingestion Sandbox
          </span>
        </div>
        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.span 
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-[9px] font-mono font-black uppercase tracking-wider bg-secondary text-muted-foreground px-2 py-0.5 rounded-full"
            >
              Ready
            </motion.span>
          )}
          {status === "connecting" && (
            <motion.span 
              key="connecting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-[9px] font-mono font-black uppercase tracking-wider bg-brand-orange/10 text-brand-orange px-2 py-0.5 rounded-full"
            >
              Syncing {progress}%
            </motion.span>
          )}
          {status === "success" && (
            <motion.span 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-[9px] font-mono font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full flex items-center gap-1"
            >
              <ShieldCheck weight="fill" size={10} /> Active
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Sync visualizer map */}
      <div className="h-28 rounded-xl bg-muted/65 dark:bg-black/35 border border-border/40 flex items-center justify-between px-8 relative overflow-hidden mb-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(235,94,40,0.02),transparent_70%)]" />
        
        {/* Left: Google Node */}
        <div className="flex flex-col items-center gap-2 relative z-10">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
            status === "success" ? "bg-emerald-500/5 border-emerald-500/35 text-emerald-500 shadow-lg shadow-emerald-500/5" : "bg-background/80 dark:bg-muted/40 border-border text-muted-foreground"
          }`}>
            <Globe size={24} weight="duotone" />
          </div>
          <span className="text-[9px] font-mono font-bold text-muted-foreground dark:text-zinc-400">GMAIL API</span>
        </div>

        {/* Center Connecting line */}
        <div className="flex-1 px-4 relative flex items-center justify-center">
          <div className="w-full h-px bg-border/40 relative">
            {status === "connecting" && (
              <motion.div 
                initial={{ left: "0%" }}
                animate={{ left: "100%" }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                className="absolute -top-1 w-2.5 h-2.5 rounded-full bg-brand-orange blur-[1px]"
              />
            )}
            {status === "success" && (
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                className="absolute top-0 h-[2px] bg-emerald-500 -translate-y-1/2"
              />
            )}
          </div>
        </div>

        {/* Right: InboxFM Node */}
        <div className="flex flex-col items-center gap-2 relative z-10">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
            status === "success" ? "bg-emerald-500/5 border-emerald-500/35 text-emerald-500 shadow-lg shadow-emerald-500/5" : "bg-background/80 dark:bg-muted/40 border-border text-muted-foreground"
          }`}>
            <EnvelopeOpen size={24} weight="duotone" />
          </div>
          <span className="text-[9px] font-mono font-bold text-muted-foreground dark:text-zinc-400">INBOX FM</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground/75">
          <span className="flex items-center gap-1"><LockKey weight="bold" /> Secure Ingestion</span>
          <span className="flex items-center gap-1"><ShieldCheck weight="bold" /> API Integration</span>
        </div>
        <div className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">
          {status === "idle" && "Standby"}
          {status === "connecting" && "Synchronizing Ingestion..."}
          {status === "success" && "Connection Verified"}
        </div>
      </div>
    </div>
  );
};

// --- Step 2: Context Synthesis Animation ---
export const ContextSynthesisAnimation = () => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: '100px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const [step, setStep] = React.useState<"messy" | "synthesis" | "clean">("messy");

  React.useEffect(() => {
    if (!isVisible) {
      setStep("messy");
      return;
    }

    let timeout: NodeJS.Timeout;

    if (step === "messy") {
      timeout = setTimeout(() => {
        setStep("synthesis");
      }, 3500); // messy for 3.5s
    } else if (step === "synthesis") {
      timeout = setTimeout(() => {
        setStep("clean");
      }, 2800); // synthesis for 2.8s
    } else if (step === "clean") {
      timeout = setTimeout(() => {
        setStep("messy");
      }, 5000); // clean for 5s
    }

    return () => clearTimeout(timeout);
  }, [step, isVisible]);

  return (
    <div ref={ref} className="w-full bg-card/60 backdrop-blur-md rounded-[1.5rem] border border-border/50 p-6 shadow-xl relative overflow-hidden text-left mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MagicWand size={16} className="text-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground uppercase">
            Synthesis Layer
          </span>
        </div>
        <div className="text-[9px] font-mono font-bold bg-secondary text-muted-foreground/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          {step === "messy" && "Ingesting Raw Data"}
          {step === "synthesis" && "AI Analysis Active"}
          {step === "clean" && "Script Output Complete"}
        </div>
      </div>

      <div className="h-[260px] relative flex flex-col justify-center bg-muted/65 dark:bg-black/35 rounded-xl border border-border/40 p-4 overflow-hidden mb-4">
        <AnimatePresence mode="wait">
          {step === "messy" && (
            <motion.div
              key="messy-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2.5 w-full"
            >
              <div className="text-[9px] font-mono font-semibold text-muted-foreground dark:text-zinc-400 uppercase mb-1">
                UNREAD INBOX LOGS (3)
              </div>
              <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-red-500">Client: urgent budget feedback</p>
                  <p className="text-[10px] text-muted-foreground truncate">Re: slide deck structure looks wrong we need this by tomorrow 9am...</p>
                </div>
              </div>
              <div className="p-3 bg-background/80 dark:bg-zinc-800/10 border border-border/60 rounded-xl flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-zinc-500 shrink-0 mt-1.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">TLDR Newsletter</p>
                  <p className="text-[10px] text-muted-foreground truncate">Google launches context model improvements, open source models rise...</p>
                </div>
              </div>
              <div className="p-3 bg-background/80 dark:bg-zinc-800/10 border border-border/60 rounded-xl flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-zinc-500 shrink-0 mt-1.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Github CI Notification</p>
                  <p className="text-[10px] text-muted-foreground truncate">Run #4120 passed in 4 minutes for main branch refactor...</p>
                </div>
              </div>
            </motion.div>
          )}

          {step === "synthesis" && (
            <motion.div
              key="synthesis-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center text-center space-y-4 py-6"
            >
              <div className="relative w-16 h-16 rounded-full flex items-center justify-center bg-emerald-500/10 border border-emerald-500/30">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-t border-emerald-500"
                />
                <Sparkle size={24} className="text-emerald-500 animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-mono text-emerald-500 font-bold uppercase tracking-wider animate-pulse">
                  Synthesizing Audio Brief
                </p>
                <p className="text-[10px] text-muted-foreground max-w-[28ch]">
                  Resolving client replies, filtering newsletters, outlining timeline...
                </p>
              </div>
            </motion.div>
          )}

          {step === "clean" && (
            <motion.div
              key="clean-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3 w-full"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Synthesis Ready
                </span>
                <span className="text-[9px] font-mono text-muted-foreground/60 uppercase">
                  Compressed 88%
                </span>
              </div>

              <div className="p-4 bg-emerald-500/[0.02] border border-emerald-500/20 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span>Segment 01: Client Deck Revisions</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed pl-5 font-medium">
                  &ldquo;Your client requested quick revisions to the deck slide deck layout. They want slides 4 and 8 simplified before their 9:00 AM investor sync. No action required on the TLDR newsletter or Github notifications.&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-4 pl-5 text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest font-black">
                <span>Duration: 22s</span>
                <div className="w-1 h-1 rounded-full bg-zinc-600" />
                <span>Priority: High</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground/70">
          Powered by Context Engine
        </span>
        <span className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-wider animate-pulse">
          Auto-synthesis active
        </span>
      </div>
    </div>
  );
};

// --- Step 3: Podcasts Commute Broadcaster Animation ---
export const CommutePlayerAnimation = () => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: '100px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const [progress, setProgress] = React.useState(25); // Initial percentage progress
  const [isResetting, setIsResetting] = React.useState(false);
  const animationFrameRef = React.useRef<number | null>(null);
  const lastTimeRef = React.useRef<number | null>(null);

  const isPlaying = !isResetting;

  React.useEffect(() => {
    if (!isVisible) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      lastTimeRef.current = null;
      return;
    }

    if (isResetting) {
      const timeout = setTimeout(() => {
        setProgress(0);
        setIsResetting(false);
      }, 3000); // pause at 100% for 3 seconds before wrapping progress back to 0
      return () => clearTimeout(timeout);
    }

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      setProgress((prev) => {
        const increment = (delta / 1000) * 1.8; // ~1.8% increment per second
        if (prev + increment >= 100) {
          setIsResetting(true);
          return 100;
        }
        return prev + increment;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      lastTimeRef.current = null;
    };
  }, [isResetting, isVisible]);

  return (
    <div ref={ref} className="w-full bg-card/60 backdrop-blur-md rounded-[1.5rem] border border-border/50 p-6 shadow-xl relative overflow-hidden text-left mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-pulse" />
          <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground uppercase">
            commute stream
          </span>
        </div>
        <div className="flex items-center gap-1 bg-brand-orange/5 text-brand-orange border border-brand-orange/10 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-widest uppercase">
          <Waves size={10} className="animate-pulse" /> 1.0x Speed
        </div>
      </div>

      <div className="p-4 bg-muted/65 dark:bg-black/35 rounded-xl border border-border/40 space-y-4">
        
        {/* Visual equalizer wave */}
        <div className="w-full flex items-end justify-center gap-1 h-12 px-4 overflow-hidden relative">
          {[16, 32, 12, 44, 24, 36, 16, 28, 48, 20, 32, 12, 40, 24, 16].map((height, i) => (
            <motion.div
              key={i}
              animate={isPlaying ? {
                height: [height * 0.3, height, height * 0.3],
              } : {
                height: 4
              }}
              transition={{
                repeat: Infinity,
                duration: 1.2,
                delay: i * 0.05,
              }}
              className="w-1.5 rounded-full bg-brand-orange shrink-0"
              style={{ height: 4 }}
            />
          ))}
        </div>

        {/* Track Title */}
        <div className="text-center">
          <p className="text-xs font-black tracking-tight text-foreground">
            Daily Audio Briefing #104
          </p>
          <p className="text-[9px] font-mono text-muted-foreground dark:text-zinc-400 uppercase tracking-widest mt-0.5">
            Ingesting 14 updates • commuter stream
          </p>
        </div>

        {/* Track slider */}
        <div className="space-y-1.5">
          <div className="h-1 bg-muted/60 rounded-full overflow-hidden relative cursor-pointer">
            <div 
              className="h-full bg-brand-orange rounded-full relative transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-muted-foreground uppercase">
            <span>{`0${Math.floor((6.2 * progress) / 100)}:${Math.floor(((6.2 * progress) % 100) * 0.6).toString().padStart(2, "0")}`}</span>
            <span>06:12</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-1.5 bg-brand-orange/5 text-brand-orange border border-brand-orange/10 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-widest uppercase">
          <Waves size={10} className="animate-pulse" /> Commuter Ready
        </div>
        <div className="text-[9px] font-mono text-muted-foreground/45 uppercase tracking-wider animate-pulse">
          {isResetting ? "Brief Complete • Rewinding" : "Playing Daily Audio"}
        </div>
      </div>
    </div>
  );
};
