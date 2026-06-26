"use client";

import React, { useState, useEffect } from "react";
import { 
  EnvelopeSimple, 
  GithubLogo, 
  Rss, 
  Play, 
  Pause, 
  Waveform,
  Sliders,
  Sparkle
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface MockEmail {
  id: number;
  source: "gmail" | "github" | "rss";
  sender: string;
  subject: string;
  summary: string;
  time: string;
  status: "ready" | "processing" | "synthesized";
  color: string;
}

const MOCK_EMAILS: MockEmail[] = [
  {
    id: 1,
    source: "gmail",
    sender: "Mihirkumar Rabari",
    subject: "Client onboarding proposal revisions",
    summary: "Client feedback requires pricing clarification before approval.",
    time: "9:41 AM",
    status: "synthesized",
    color: "text-red-500 bg-red-500/10"
  },
  {
    id: 2,
    source: "github",
    sender: "GitHub",
    subject: "PR #104 merged: Audio pipeline optimization",
    summary: "Two infrastructure updates shipped successfully.",
    time: "10:15 AM",
    status: "ready",
    color: "text-brand-orange bg-brand-orange/10"
  },
  {
    id: 3,
    source: "rss",
    sender: "RSS",
    subject: "AI Infrastructure Weekly: Multilingual speech synthesis advances",
    summary: "New speech AI developments may improve future narration quality.",
    time: "Yesterday",
    status: "ready",
    color: "text-amber-500 bg-amber-500/10"
  }
];

export function PretextFlowSandbox() {
  const [selectedId, setSelectedId] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // Simple progress animation for the waveform compilation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timer: NodeJS.Timeout;

    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1.5;
        });
      }, 50);
    } else {
      timer = setTimeout(() => {
        setProgress(0);
      }, 0);
    }

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [isPlaying]);

  return (
    <div className="w-full flex justify-center">
      <div className="relative w-full max-w-[440px] bg-white dark:bg-[#161519] rounded-[var(--ds-radius-card)] border-2 border-[var(--ds-border-brutalist)] shadow-[var(--ds-shadow-card)] p-6 overflow-hidden flex flex-col gap-5 select-none text-left">
        
        {/* Dotted grid pattern background */}
        <svg className="absolute inset-0 w-full h-full text-zinc-300/40 dark:text-zinc-800/10 pointer-events-none" aria-hidden="true">
          <defs>
            <pattern id="sandbox-dot-grid" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sandbox-dot-grid)" />
        </svg>

        {/* Header bar */}
        <div className="z-10 flex items-center justify-between border-b-2 border-[var(--ds-border-brutalist)] pb-3">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-brand-orange" weight="bold" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-black">
              Active Connections
            </span>
          </div>
          <span className="text-[9px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Connected
          </span>
        </div>

        {/* Email list selector */}
        <div className="z-10 space-y-2">
          {MOCK_EMAILS.map((email) => {
            const isSelected = email.id === selectedId;
            const SourceIcon = email.source === "gmail" 
              ? EnvelopeSimple 
              : email.source === "github" 
                ? GithubLogo 
                : Rss;

            return (
              <button
                key={email.id}
                onClick={() => {
                  setSelectedId(email.id);
                  setIsPlaying(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-[var(--ds-radius-inner)] border-2 transition-all text-left cursor-pointer",
                  isSelected
                    ? "bg-[#FAF6F0] dark:bg-black/45 border-[var(--ds-border-brutalist)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_var(--ds-border-brutalist)]"
                    : "bg-white/50 dark:bg-black/15 border-transparent hover:border-[var(--ds-border-brutalist)]"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5", email.color)}>
                    <SourceIcon size={16} weight="bold" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-foreground leading-tight truncate">{email.sender}</p>
                    <p className="text-[10px] text-muted-foreground truncate leading-normal mt-0.5">{email.subject}</p>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-muted-foreground/60 shrink-0 ml-2">
                  {email.time}
                </span>
              </button>
            );
          })}
        </div>

        {/* Synthesis Output Console */}
        <div className="z-10 bg-[#FAF6F0] dark:bg-[#0B0B0B] border-2 border-[var(--ds-border-brutalist)] rounded-[var(--ds-radius-inner)] p-4 space-y-3 shadow-[var(--ds-shadow-primary)] relative">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono text-muted-foreground uppercase font-black tracking-wide">
              Compiler Synthesis
            </span>
            <div className="flex items-center gap-1.5">
              <Sparkle size={12} className="text-brand-orange animate-spin" style={{ animationDuration: '4s' }} />
              <span className="text-[9px] font-mono text-brand-orange font-bold uppercase">
                AI Briefing
              </span>
            </div>
          </div>

          <div className="text-xs leading-relaxed text-foreground/90 font-serif bg-white/70 dark:bg-[#161519] p-3 rounded-lg border border-black/5 dark:border-white/5 select-text">
            <span className={cn("transition-all duration-300", selectedId === 1 ? "text-foreground font-bold" : "text-muted-foreground/40")}>
              Client feedback requires pricing clarification before approval.{" "}
            </span>
            <span className={cn("transition-all duration-300", selectedId === 2 ? "text-foreground font-bold" : "text-muted-foreground/40")}>
              Two infrastructure updates shipped successfully.{" "}
            </span>
            <span className={cn("transition-all duration-300", selectedId === 3 ? "text-foreground font-bold" : "text-muted-foreground/40")}>
              New speech AI developments may improve future narration quality.
            </span>
          </div>

          {/* Controls and mini progress */}
          <div className="flex items-center gap-4 pt-1">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={cn(
                "w-9 h-9 rounded-md flex items-center justify-center shrink-0 border-2 border-[var(--ds-border-brutalist)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_var(--ds-border-brutalist)] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_0px_var(--ds-border-brutalist)] cursor-pointer",
                isPlaying 
                  ? "bg-red-500 text-white" 
                  : "bg-brand-orange text-black"
              )}
            >
              {isPlaying ? <Pause size={16} weight="bold" /> : <Play size={16} weight="fill" className="ml-0.5" />}
            </button>
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between text-[8px] font-mono text-muted-foreground/80 uppercase">
                <span>{isPlaying ? "Synthesizing Audio..." : "Ready to compile"}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-orange transition-all duration-100 ease-out" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer info tag */}
        <div className="z-10 flex items-center justify-between border-t-2 border-[var(--ds-border-brutalist)] pt-3 text-[9px] text-muted-foreground/60 uppercase tracking-widest font-bold">
          <span>Daily Briefing Preview</span>
          <span className="text-brand-orange flex items-center gap-1 font-mono">
            <Waveform size={12} className={cn(isPlaying && "animate-pulse")} />
            High Quality Voice
          </span>
        </div>

      </div>
    </div>
  );
}
