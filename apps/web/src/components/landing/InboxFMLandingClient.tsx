"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Headphones,
  CheckCircle,
  CaretDown,
  Sparkle,
  GithubLogo,
  Waves,
  ShieldCheck,
  EnvelopeSimple,
  Check,
  Play,
  Pause,
  Sliders,
  Calendar,
  GoogleLogo,
  Rss
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PretextFlowSandbox } from "@/components/landing/PretextFlowSandbox";

import dynamic from "next/dynamic";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

const PretextCurvedMarquee = dynamic(
  () => import("@/components/landing/PretextCurvedMarquee").then((mod) => mod.PretextCurvedMarquee),
  { ssr: false }
);


export function InboxFMLandingClient() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  // Interactive Showcase Tab state
  const [activeTab, setActiveTab] = React.useState<"brief" | "synthesis" | "rules" | "voice">("brief");

  // Integration Sync states
  const [gmailSync, setGmailSync] = React.useState(true);
  const [outlookSync, setOutlookSync] = React.useState(true);
  const [rssSync, setRssSync] = React.useState(true);
  const [githubSync, setGithubSync] = React.useState(true);

  const toggleGmail = () => {
    setGmailSync(!gmailSync);
  };
  const toggleOutlook = () => {
    setOutlookSync(!outlookSync);
  };
  const toggleRss = () => {
    setRssSync(!rssSync);
  };
  const toggleGithub = () => {
    setGithubSync(!githubSync);
  };

  // Audio playback controller
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [audioUrl, setAudioUrl] = React.useState("");
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(246);
  const [currentVoiceName, setCurrentVoiceName] = React.useState("Daily Brief #104");

  React.useEffect(() => {
    if (typeof window === "undefined" || !audioUrl) return;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    const handleDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);

    if (isPlaying) {
      audio.play().catch((err) => {
        console.error("Audio play failed:", err);
        setIsPlaying(false);
      });
    }

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  // Toggle play/pause
  const togglePlay = () => {
    if (!audioUrl || !audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => {
        console.error("Audio play failed:", err);
      });
      setIsPlaying(true);
    }
  };

  // Play voice sample
  const playVoiceSample = (voiceUrl: string, voiceName: string) => {
    if (!voiceUrl) return;
    if (audioUrl === voiceUrl) {
      togglePlay();
    } else {
      setAudioUrl(voiceUrl);
      setCurrentVoiceName(voiceName);
      setIsPlaying(true);
    }
  };

  // Helper to format time (e.g. 124 -> "02:04")
  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const faqs = [
    {
      question: "Does InboxFM read and store all my emails?",
      answer: "InboxFM processes incoming email content solely to generate your narrative briefings. We use secure read-only API access via Google and Microsoft OAuth, never require your password, and do not store your raw emails or inbox threads on our servers.",
    },
    {
      question: "Which email and calendar providers are supported?",
      answer: "InboxFM currently supports reading emails from Gmail and Outlook. We also sync meetings with Google Calendar and Outlook Calendar, including auto conflict checks before scheduling.",
    },
    {
      question: "Can I reply to emails directly from the briefing dashboard?",
      answer: "Yes, you can draft email replies on-demand using our AI assistant, review or edit the content, and send them directly. For security and approval reasons, sending is currently enabled exclusively for connected Outlook accounts.",
    },
    {
      question: "Can I choose my voice persona?",
      answer: "Yes! We offer several distinct styles—Executive, Commuter, and Tech Lead—and support creating custom prompt rules to customize your briefing narration style.",
    },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-background spotlight-bg grain-bg text-foreground selection:bg-brand-orange/20 selection:text-brand-orange relative overflow-x-hidden">
      
      {/* Global Sticky Capsule Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-44 md:pt-48 pb-20 flex flex-col justify-center overflow-hidden">
        
        {/* Background text paths matching the design screenshot */}
        {/* 1. Left spiral text pathway (slowly spinning) */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 120, ease: "linear" }}
          className="absolute -left-12 sm:-left-16 top-[6%] sm:top-[8%] w-[180px] sm:w-[340px] h-[180px] sm:h-[340px] pointer-events-none select-none block opacity-[0.22] sm:opacity-[0.14] dark:opacity-[0.12] dark:sm:opacity-[0.08]"
        >
          <svg viewBox="0 0 340 340" className="w-full h-full" aria-hidden="true">
            {/* Outer circle path */}
            <path
              id="heroCircle1"
              d="M 170,170 m -130,0 a 130,130 0 1,1 260,0 a 130,130 0 1,1 -260,0"
              fill="none"
            />
            {/* Inner circle path */}
            <path
              id="heroCircle2"
              d="M 170,170 m -95,0 a 95,95 0 1,1 190,0 a 95,95 0 1,1 -190,0"
              fill="none"
            />
            <text className="fill-foreground dark:fill-white" style={{ fontSize: '9px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
              <textPath href="#heroCircle1">
                inbox fm AI audio briefing engine  ●  synthesize your morning newsletters, client threads, calendar updates, and task lists  ●
              </textPath>
            </text>
            <text className="fill-foreground dark:fill-white" style={{ fontSize: '8px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>
              <textPath href="#heroCircle2">
                reclaim your focus and start your morning commute with custom voice delivery  ●  
              </textPath>
            </text>
          </svg>
        </motion.div>

        {/* 2. Full-width curved marquee ribbon powered by Pretext & Framer Motion */}
        <div className="absolute bottom-0 md:-bottom-6 left-0 right-0 pointer-events-none select-none block overflow-visible z-20" aria-hidden="true">
          <PretextCurvedMarquee />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 w-full flex flex-col items-center">
          
          <div className="w-full text-center space-y-6 max-w-3xl mx-auto">

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif tracking-tight leading-[1.08] text-foreground text-center">
              Your workday,<br />
              <span className="italic font-light">summarized before it starts.</span>
            </h1>
            
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed text-center font-medium">
              InboxFM transforms emails, calendars, GitHub activity, newsletters, and news feeds into a personalized AI audio briefing so you can start your day with context instead of chaos.
            </p>

            {/* CTA Waitlist Button */}
            <div className="w-full max-w-md mx-auto pt-4 pb-2 space-y-4 flex flex-col items-center">
              <Link href="/apply" className="w-full sm:w-auto">
                <Button
                  size="brand"
                  className="w-full sm:w-auto h-12 px-8 rounded-xl border-2 border-black dark:border-zinc-800 bg-brand-orange text-black font-black uppercase text-sm tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_var(--ds-border-brutalist)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Apply for Early Access
                  <ArrowRight size={16} weight="bold" />
                </Button>
              </Link>

              {/* Secondary microcopy & Trust text */}
              <div className="text-center space-y-2 select-none pt-2 max-w-xs md:max-w-md mx-auto">
                <p className="text-[11px] font-mono uppercase tracking-wider text-brand-orange font-bold">
                  ★ First 500 users receive Lifetime Pro.
                </p>
                <p className="text-[10px] font-sans font-medium text-muted-foreground/60 leading-relaxed">
                  Currently onboarding a limited number of beta users due to OAuth testing restrictions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Logos integration strip */}
      <section className="py-8 border-y border-border/40 bg-muted/15 dark:bg-black/20 select-none">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[9px] font-mono font-bold tracking-[0.2em] text-muted-foreground/60 uppercase text-center mb-6">
            Synthesizes updates from the tools you already use
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-45 grayscale contrast-125 dark:opacity-35">
            <div className="flex items-center gap-2 text-sm font-bold"><GoogleLogo size={20} weight="fill" /> Gmail</div>
            <div className="flex items-center gap-2 text-sm font-bold"><Calendar size={20} weight="fill" /> Google Calendar</div>
            <div className="flex items-center gap-2 text-sm font-bold"><EnvelopeSimple size={20} weight="fill" /> Outlook Mail</div>
            <div className="flex items-center gap-2 text-sm font-bold"><Calendar size={20} weight="fill" /> Outlook Calendar</div>
            <div className="flex items-center gap-2 text-sm font-bold"><GithubLogo size={20} weight="fill" /> GitHub</div>
            <div className="flex items-center gap-2 text-sm font-bold"><Rss size={20} weight="fill" /> RSS Feeds</div>
          </div>
        </div>
      </section>

      {/* Section: One briefing instead of 20 tabs */}
      <section className="py-24 border-b border-border/40 bg-background relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Side: Outcome Messaging */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-brand-orange uppercase tracking-widest font-black">
                CONTEXT CONSOLIDATION
              </span>
              <h2 className="text-3xl md:text-5xl font-serif tracking-tight leading-tight">
                One briefing instead of 20 tabs.
              </h2>
            </div>
            
            <div className="space-y-4">
              <p className="text-base text-foreground font-semibold">
                Most professionals spend the first hour of their day rebuilding context.
              </p>
              
              <ul className="space-y-3 font-medium text-sm text-muted-foreground">
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-orange shrink-0" />
                  Checking inboxes.
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-orange shrink-0" />
                  Opening calendars.
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-orange shrink-0" />
                  Reviewing project updates.
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-orange shrink-0" />
                  Reading newsletters.
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-orange shrink-0" />
                  Scanning notifications.
                </li>
              </ul>
              
              <p className="text-sm text-foreground/90 font-medium border-t border-black/5 dark:border-white/5 pt-4">
                InboxFM automatically turns scattered information into a single narrative.
              </p>
            </div>
          </div>

          {/* Right Side: Visual Flow Pipeline */}
          <div className="lg:col-span-7 w-full">
            <div className="p-6 md:p-8 rounded-[var(--ds-radius-card)] border-2 border-black dark:border-zinc-800 bg-white dark:bg-[#161519] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.06)] relative overflow-hidden">
              
              <div className="absolute top-0 right-0 p-3 text-[9px] font-mono text-muted-foreground uppercase font-bold">
                System Data Pipeline
              </div>
              
              <div className="flex flex-col items-center gap-6">
                
                {/* 1. Sources */}
                <div className="w-full">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest font-black block mb-3 text-center">
                    Scattered Inputs
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {[
                      { name: "Gmail", icon: GoogleLogo, color: "text-red-500 bg-red-500/5 border-red-500/20" },
                      { name: "Outlook", icon: EnvelopeSimple, color: "text-blue-500 bg-blue-500/5 border-blue-500/20" },
                      { name: "Calendar", icon: Calendar, color: "text-emerald-500 bg-emerald-500/5 border-emerald-500/20" },
                      { name: "GitHub", icon: GithubLogo, color: "text-purple-500 bg-purple-500/5 border-purple-500/20" },
                      { name: "RSS Feeds", icon: Rss, color: "text-amber-500 bg-amber-500/5 border-amber-500/20" },
                    ].map((src) => {
                      const Icon = src.icon;
                      return (
                        <div
                          key={src.name}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-black dark:border-zinc-800 bg-[#FAF6F0] dark:bg-[#0B0B0B] text-xs font-black uppercase tracking-wider ${src.color} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_var(--ds-border-brutalist)]`}
                        >
                          <Icon size={14} weight="fill" />
                          <span>{src.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Arrow Down */}
                <div className="flex flex-col items-center justify-center text-brand-orange">
                  <div className="w-0.5 h-6 bg-brand-orange/40" />
                  <span className="text-xs font-mono font-bold">↓</span>
                </div>

                {/* 2. Intelligence Engine */}
                <div className="w-full max-w-sm">
                  <div className="p-4 rounded-[var(--ds-radius-inner)] border-2 border-black dark:border-zinc-800 bg-[#FAF6F0] dark:bg-[#0B0B0B] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.06)] relative overflow-hidden flex flex-col items-center text-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-orange/5 to-transparent pointer-events-none" />
                    <Sparkle size={20} weight="fill" className="text-brand-orange mb-1 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-foreground">
                      InboxFM Intelligence Engine
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono mt-1">
                      De-noising, Deduplication, and Synthesis
                    </span>
                  </div>
                </div>

                {/* Arrow Down */}
                <div className="flex flex-col items-center justify-center text-brand-orange">
                  <div className="w-0.5 h-6 bg-brand-orange/40" />
                  <span className="text-xs font-mono font-bold">↓</span>
                </div>

                {/* 3. Output Delivery (Two Blocks) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  {/* AI Briefing */}
                  <div className="p-4 rounded-[var(--ds-radius-inner)] border-2 border-black dark:border-zinc-800 bg-[#FAF6F0] dark:bg-[#0B0B0B] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.06)] text-left flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-orange/10 border border-brand-orange/20 text-brand-orange flex items-center justify-center shrink-0 mt-0.5">
                      <Headphones size={16} weight="fill" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                        5-Minute AI Briefing
                      </h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        High-fidelity audio digest tailored to your schedule.
                      </p>
                    </div>
                  </div>

                  {/* Actions & Follow-ups */}
                  <div className="p-4 rounded-[var(--ds-radius-inner)] border-2 border-black dark:border-zinc-800 bg-[#FAF6F0] dark:bg-[#0B0B0B] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.06)] text-left flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle size={16} weight="fill" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                        Action Items + Follow-Ups
                      </h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Extracted deadlines and commitments, ready for action.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Interactive Platform Showcase ("The AI Audio Platform Built for Focus") */}
      <section id="showcase" className="pt-24 pb-12 border-b border-border/45 bg-muted/5">
        <div className="max-w-5xl mx-auto px-6">
          
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-serif tracking-tight">The audio stream you build on.</h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed font-medium">
              Calmly digest updates without endless scrolls. Review details, switch custom voice engines, or prioritize key project boards.
            </p>
          </div>

          {/* Interactive Platform Showcase (Stacked Deck of Folder Cards) */}
          <div className="relative w-full min-h-[770px] sm:min-h-[660px] md:min-h-[460px] mt-12 pb-4 overflow-visible flex flex-col items-center">
            {/* The Stacked Cards Deck */}
            <div className="relative w-full max-w-4xl h-[750px] sm:h-[640px] md:h-[420px] overflow-visible">
              {[
                {
                  id: "brief",
                  label: "Daily Brief",
                  icon: Waves,
                  title: "Clean Spoken Narrative",
                  category: "Daily Podcast Broadcast",
                  desc: "No alerts, no stress. Just your custom spoken summary covering priority follow-ups, team progress, and key updates.",
                  tabLeft: "4%",
                  tabLeftMobile: "4%",
                  content: (
                    <div className="w-full">
                      <div className="space-y-4">
                        <div className="p-4 bg-white dark:bg-[#0B0B0B] border-2 border-[var(--ds-border-brutalist)] rounded-[var(--ds-radius-inner)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_var(--ds-border-brutalist)] space-y-3">
                          <div className="flex items-center justify-between border-b-2 border-[var(--ds-border-brutalist)] pb-2">
                            <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">Spoken brief transcript</span>
                            <span className="text-[9px] font-mono text-brand-orange uppercase font-bold">Commuter Feed</span>
                          </div>
                          <p className="text-xs italic leading-relaxed text-foreground/80 font-serif">
                            &ldquo;Good morning. Here is your briefing for Friday. Overnight, your team merged the database migration PR after testing passed. Also, your client sent feedback requesting layout cleanups for the deck by 9:00 AM...&rdquo;
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                },
                {
                  id: "synthesis",
                  label: "Summary Engine",
                  icon: Sparkle,
                  title: "Clear Summaries",
                  category: "Summary Pipeline",
                  desc: "We process messy emails, newsletter threads, and notifications, formatting them into clear, read-ready segments.",
                  tabLeft: "26%",
                  tabLeftMobile: "28%",
                  content: (
                    <div className="w-full">
                      <div className="border-2 border-[var(--ds-border-brutalist)] rounded-[var(--ds-radius-inner)] bg-white dark:bg-[#0B0B0B] overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_var(--ds-border-brutalist)]">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b-2 border-[var(--ds-border-brutalist)] bg-[#FAF6F0] dark:bg-[#121214]">
                              <th className="py-1.5 px-2 md:p-3 text-[9px] font-mono font-black uppercase tracking-wider text-muted-foreground">Source</th>
                              <th className="py-1.5 px-2 md:p-3 text-[9px] font-mono font-black uppercase tracking-wider text-muted-foreground text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y-2 divide-[var(--ds-border-brutalist)] font-medium">
                            <tr className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                              <td className="py-1.5 px-2 md:p-3 text-[11px] text-foreground font-semibold">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <EnvelopeSimple size={13} className="text-blue-500 shrink-0" weight="bold" />
                                  <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider shrink-0">Outlook:</span>
                                  <span className="truncate">Client feedback received</span>
                                </div>
                              </td>
                              <td className="py-1.5 px-2 md:p-3 text-right align-middle whitespace-nowrap">
                                <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Ready</span>
                              </td>
                            </tr>
                            <tr className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                              <td className="py-1.5 px-2 md:p-3 text-[11px] text-foreground font-semibold">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <GithubLogo size={13} className="text-foreground shrink-0" weight="bold" />
                                  <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider shrink-0">GitHub:</span>
                                  <span className="truncate">PR #104 merged</span>
                                </div>
                              </td>
                              <td className="py-1.5 px-2 md:p-3 text-right align-middle whitespace-nowrap">
                                <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-brand-orange/10 text-brand-orange border border-brand-orange/20">Ready</span>
                              </td>
                            </tr>
                            <tr className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                              <td className="py-1.5 px-2 md:p-3 text-[11px] text-foreground font-semibold">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Rss size={13} className="text-amber-500 shrink-0" weight="bold" />
                                  <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider shrink-0">RSS:</span>
                                  <span className="truncate">AI Infrastructure Weekly</span>
                                </div>
                              </td>
                              <td className="py-1.5 px-2 md:p-3 text-right align-middle whitespace-nowrap">
                                <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20">Related</span>
                              </td>
                            </tr>
                            <tr className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                              <td className="py-1.5 px-2 md:p-3 text-[11px] text-foreground font-semibold">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Calendar size={13} className="text-blue-400 shrink-0" weight="bold" />
                                  <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider shrink-0">Google Calendar:</span>
                                  <span className="truncate">Product Review @ 10:30</span>
                                </div>
                              </td>
                              <td className="py-1.5 px-2 md:p-3 text-right align-middle whitespace-nowrap">
                                <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">Scheduled</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                },
                {
                  id: "rules",
                  label: "Ingestion Rules",
                  icon: Sliders,
                  title: "Custom Sender Priorities",
                  category: "Smart Filters",
                  desc: "Build rules to prioritize important team leaders or instantly ignore sales drip campaigns. Restrict summary content to verified projects.",
                  tabLeft: "48%",
                  tabLeftMobile: "52%",
                  content: (
                    <div className="w-full">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                        <div className="p-3 border-2 border-[var(--ds-border-brutalist)] rounded-[var(--ds-radius-inner)] bg-white dark:bg-[#0B0B0B] flex flex-col justify-between h-20 sm:h-24 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_var(--ds-border-brutalist)] relative">
                          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-1">
                            <span className="text-[8px] font-mono text-muted-foreground uppercase font-bold">VIP Senders</span>
                            <span className="text-[8px] font-mono text-brand-orange font-bold uppercase">Active</span>
                          </div>
                          <span className="text-xs font-black text-foreground mt-2">Include Full Script</span>
                        </div>
                        <div className="p-3 border-2 border-[var(--ds-border-brutalist)] rounded-[var(--ds-radius-inner)] bg-white dark:bg-[#0B0B0B] flex flex-col justify-between h-20 sm:h-24 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_var(--ds-border-brutalist)] relative">
                          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-1">
                            <span className="text-[8px] font-mono text-muted-foreground uppercase font-bold">Calendar Deadlines</span>
                            <span className="text-[8px] font-mono text-brand-orange font-bold uppercase">Priority</span>
                          </div>
                          <span className="text-xs font-black text-foreground mt-2">Highlight First</span>
                        </div>
                        <div className="p-3 border-2 border-[var(--ds-border-brutalist)] rounded-[var(--ds-radius-inner)] bg-white dark:bg-[#0B0B0B] flex flex-col justify-between h-20 sm:h-24 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_var(--ds-border-brutalist)]">
                          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-1">
                            <span className="text-[8px] font-mono text-muted-foreground uppercase font-bold">Promotional Mail</span>
                            <span className="text-[8px] font-mono text-muted-foreground/60 font-bold uppercase">Muted</span>
                          </div>
                          <span className="text-xs font-black text-muted-foreground mt-2">Ignore completely</span>
                        </div>
                      </div>
                    </div>
                  )
                },
                {
                  id: "voice",
                  label: "Briefing Styles",
                  icon: Headphones,
                  title: "Briefing Personas",
                  category: "Narration Options",
                  desc: "Select a custom narrative persona tailored for your workflow. Adjust depth, tone, and style to match your daily routine.",
                  tabLeft: "70%",
                  tabLeftMobile: "76%",
                  content: (
                    <div className="w-full">
                      <div className="space-y-2">
                        {[
                          { name: "The Executive", label: "Concise • High-level Summaries", type: "Executive Brief #104", url: "" },
                          { name: "The Commuter", label: "Conversational • Narrative Flow", type: "Commute Podcast #104", url: "" },
                          { name: "The Tech Lead", label: "Detailed • Technical Digest", type: "Dev Brief #104", url: "" }
                        ].map((v) => {
                          const isThisVoicePlaying = isPlaying && audioUrl === v.url;
                          return (
                            <button
                              key={v.name}
                              onClick={() => v.url && playVoiceSample(v.url, v.type)}
                              className={`w-full flex items-center justify-between p-3 rounded-[var(--ds-radius-inner)] border-2 transition-all text-left group shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_var(--ds-border-brutalist)] ${
                                !v.url
                                  ? "border-[var(--ds-border-brutalist)] bg-white dark:bg-[#0B0B0B] cursor-default"
                                  : isThisVoicePlaying
                                  ? "border-brand-orange bg-brand-orange/5 cursor-pointer"
                                  : "border-[var(--ds-border-brutalist)] bg-white dark:bg-[#0B0B0B] hover:border-brand-orange cursor-pointer"
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-black text-foreground">
                                  {v.name}
                                </span>
                                <span className="text-[9px] font-mono text-muted-foreground uppercase font-semibold">
                                  • {v.label}
                                </span>
                              </div>
                              {v.url && (
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] text-muted-foreground group-hover:text-foreground font-black uppercase">
                                    {isThisVoicePlaying ? "Playing" : "Preview"}
                                  </span>
                                  <div className="w-6 h-6 rounded-md border-2 border-[var(--ds-border-brutalist)] bg-brand-orange text-black flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1px_1px_0px_0px_var(--ds-border-brutalist)] shrink-0">
                                    {isThisVoicePlaying ? <Pause size={10} weight="bold" /> : <Play size={10} weight="fill" />}
                                  </div>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )
                }
              ].map((card, idx) => {
                const isActive = activeTab === card.id;
                const stackPos = (idx - ["brief", "synthesis", "rules", "voice"].indexOf(activeTab) + 4) % 4;
                
                // Spring position math for vertical stack perspective
                const yOffset = -stackPos * 16;
                const scale = 1 - stackPos * 0.03;
                const zIndex = 30 - stackPos * 10;
                
                const Icon = card.icon;

                return (
                  <motion.div
                    key={card.id}
                    animate={{
                      y: yOffset,
                      scale: scale,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 120,
                      damping: 18
                    }}
                    className={`absolute inset-0 w-full h-full rounded-[1.25rem] border-2 border-black dark:border-zinc-800 bg-[#FAF6F0] dark:bg-[#161519] flex flex-col overflow-visible shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.06)] ${
                      isActive ? "pointer-events-auto" : "pointer-events-none"
                    }`}
                    style={{
                      zIndex: zIndex,
                    }}
                  >
                    {/* Folder Tab sticking out from the top edge */}
                    <button
                      onClick={() => {
                        setActiveTab(card.id as "brief" | "synthesis" | "rules" | "voice");
                      }}
                      className={`absolute top-[-36px] h-[37px] px-3 sm:px-5 flex items-center gap-1.5 sm:gap-2 rounded-t-xl text-[10px] md:text-xs font-mono font-black uppercase tracking-wider border-t-2 border-x-2 transition-all cursor-pointer pointer-events-auto select-none left-[var(--tab-left-mobile)] sm:left-[var(--tab-left-desktop)] ${
                        isActive
                          ? "bg-[#FAF6F0] dark:bg-[#161519] border-black dark:border-zinc-800 text-brand-orange z-30"
                          : "bg-[#EFEBE4] dark:bg-[#201F24] border-black/85 dark:border-zinc-800/85 text-muted-foreground/80 hover:text-foreground hover:bg-[#FAF6F0]/50 z-10"
                      }`}
                      style={{
                        "--tab-left-desktop": card.tabLeft,
                        "--tab-left-mobile": card.tabLeftMobile,
                        borderBottom: isActive ? "none" : "2px solid rgba(0,0,0,1)"
                      } as React.CSSProperties}
                    >
                      <Icon size={14} weight={isActive ? "fill" : "bold"} className="shrink-0" />
                      <span className="hidden sm:inline">{card.label}</span>
                      {isActive && (
                        <div className="absolute bottom-[-2px] left-0 right-0 h-[3px] bg-[#FAF6F0] dark:bg-[#161519]" />
                      )}
                    </button>

                    {/* Recessed Shading Overlay for Inactive Stack Cards */}
                    {stackPos > 0 && (
                      <div className="absolute inset-0 rounded-[1.25rem] bg-black/[0.04] dark:bg-white/[0.02] pointer-events-none z-20" />
                    )}

                     {/* Card Content Interior: Minimalist Modern Hybrid */}
                    <div className="flex-1 p-5 md:p-8 flex flex-col md:flex-row gap-4 md:gap-8 items-stretch justify-between text-left overflow-hidden z-10">
                      
                      {/* Left Side: Specific Tab Context Info */}
                      <div className="flex-1 flex flex-col justify-start gap-4 md:gap-6 min-w-0">
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono text-brand-orange uppercase tracking-widest font-black">
                              {card.category}
                            </span>
                            <h3 className="text-xl md:text-2xl font-serif font-black tracking-tight leading-snug text-foreground">
                              {card.title}
                            </h3>
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-medium">
                            {card.desc}
                          </p>
                        </div>
                        <div className="mt-2.5 md:mt-6">
                          {card.content}
                        </div>
                      </div>

                      {/* Right Side: Player Simulator & Dynamic Waveform (Sleek modern hybrid) */}
                      <div className="w-full md:w-72 shrink-0 bg-white dark:bg-[#0B0B0B] border-2 border-[var(--ds-border-brutalist)] rounded-[var(--ds-radius-inner)] p-4 md:p-5 flex flex-col justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_var(--ds-border-brutalist)] relative overflow-hidden">
                        
                        {/* Interactive Player Header */}
                        <div className="flex items-center justify-between border-b-2 border-[var(--ds-border-brutalist)] pb-1.5 mb-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full bg-brand-orange ${isPlaying ? "animate-pulse" : ""}`} />
                            <span className="text-[8px] font-mono uppercase tracking-widest text-foreground font-black">Audio player</span>
                          </div>
                          <span className="text-[8px] font-mono text-muted-foreground uppercase font-bold">
                            {isPlaying ? "Streaming" : "Ready"}
                          </span>
                        </div>

                        {/* Player Center Display */}
                        <div className="flex flex-col items-center py-1 md:py-2 gap-1.5 md:gap-3">
                          {/* Pulsing Glowing Ring Waveform */}
                          <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-[var(--ds-radius-btn)] flex items-center justify-center bg-[#FAF6F0] dark:bg-[#161519] border-2 border-[var(--ds-border-brutalist)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_var(--ds-border-brutalist)]">
                            {isPlaying && (
                              <motion.div
                                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
                                transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut" }}
                                className="absolute inset-0 rounded-[var(--ds-radius-btn)] border-2 border-brand-orange"
                              />
                            )}
                            <Headphones size={24} className="text-brand-orange" weight="fill" />
                          </div>
                          
                          <div className="text-center space-y-0.5">
                            <p className="text-xs font-black tracking-tight text-foreground">{currentVoiceName}</p>
                            <p className="text-[8px] text-muted-foreground uppercase font-mono tracking-widest">
                              {activeTab === "brief" && "Spoken Feed"}
                              {activeTab === "synthesis" && "Synthesis Processing"}
                              {activeTab === "rules" && "Rule Evaluator"}
                              {activeTab === "voice" && "Voice Engine"}
                            </p>
                          </div>
                        </div>

                        {/* Animated Waveform Graphic with play controls */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            {/* Mini square play/pause button */}
                            <button
                              onClick={togglePlay}
                              className="w-8 h-8 rounded-md bg-brand-orange text-black border-2 border-[var(--ds-border-brutalist)] flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1px_1px_0px_0px_var(--ds-border-brutalist)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_var(--ds-border-brutalist)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer shrink-0"
                            >
                              {isPlaying ? <Pause size={12} weight="bold" /> : <Play size={12} weight="fill" className="ml-0.5" />}
                            </button>
                            
                            {/* Custom animated timeline waveform */}
                            <div className="flex-1 flex items-end justify-between gap-0.5 h-6 overflow-hidden">
                              {[12, 18, 6, 22, 14, 10, 24, 18, 8, 14, 6, 20].map((h, i) => (
                                <motion.div
                                  key={i}
                                  animate={{
                                    height: isPlaying ? [h * 0.35, h * 1.15, h * 0.35] : 6
                                  }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 1.1,
                                    ease: "easeInOut",
                                    delay: i * 0.07
                                  }}
                                  className="w-1 bg-brand-orange rounded-full shrink-0"
                                  style={{ height: 6 }}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Timeline duration labels */}
                          <div className="flex justify-between text-[8px] font-mono text-muted-foreground/60 px-1">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* Bento Grid Integrations Section */}
      <section id="api" className="pt-12 pb-24 border-b border-border/40 relative bg-muted/5">
        <div className="max-w-5xl mx-auto px-6">
          
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-serif tracking-tight">Integrate with your workspace.</h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed font-medium">
              Inbox FM connects directly with your existing work ecosystem to synthesize custom audio streams in real-time.
            </p>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Column: Interactive Workspace Sync Canvas (Big Box) */}
            <div className="lg:col-span-6 flex flex-col rounded-[var(--ds-radius-card)] border-2 border-black dark:border-zinc-800 bg-[#FAF6F0] dark:bg-[#161519] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.06)] overflow-hidden p-6 md:p-8">
              <div className="text-left space-y-1.5 mb-2">
                <span className="text-[9px] font-mono text-brand-orange uppercase tracking-widest font-black">Interactive Sync Flow</span>
                <h3 className="text-lg md:text-xl font-serif font-black text-foreground">Workspace Data Flow</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Toggle connection nodes below to activate or deactivate data sync directly into your daily briefing.
                </p>
              </div>

              {/* Centered Canvas Container */}
              <div className="flex-1 flex items-center justify-center w-full min-h-[240px] md:min-h-[270px] mt-4">
                {/* The 4:3 Flow Graphic Canvas */}
                <div className="relative w-full aspect-[4/3] max-w-[290px] mx-auto overflow-hidden select-none">
                  {/* SVG Connecting Paths */}
                  <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full text-zinc-300/50 dark:text-zinc-800/20 pointer-events-none" aria-hidden="true">
                    <defs>
                      <pattern id="dot-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1" fill="currentColor" />
                      </pattern>
                      <marker
                        id="arrow-head"
                        viewBox="0 0 10 10"
                        refX="6"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="currentColor" />
                      </marker>
                    </defs>

                    {/* Dot Grid Background */}
                    <rect width="100%" height="100%" fill="url(#dot-grid)" />

                    {/* 1. Gmail Path (Top-Left -> Center) */}
                    <path d="M 95 60 L 200 60 L 200 120" fill="none" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrow-head)" />
                    {gmailSync && (
                      <motion.path
                        d="M 95 60 L 200 60 L 200 112"
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="2"
                        strokeDasharray="4 12"
                        animate={{ strokeDashoffset: [-32, 0] }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                      />
                    )}

                    {/* 2. Outlook Path (Top-Right -> Center) */}
                    <path d="M 340 85 L 340 150 L 240 150" fill="none" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrow-head)" />
                    {outlookSync && (
                      <motion.path
                        d="M 340 85 L 340 150 L 248 150"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="2"
                        strokeDasharray="4 12"
                        animate={{ strokeDashoffset: [-32, 0] }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                      />
                    )}

                    {/* 3. GitHub Path (Bottom-Left -> Center) */}
                    <path d="M 60 215 L 60 150 L 160 150" fill="none" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrow-head)" />
                    {githubSync && (
                      <motion.path
                        d="M 60 215 L 60 150 L 152 150"
                        fill="none"
                        stroke="#FF7A00"
                        strokeWidth="2"
                        strokeDasharray="4 12"
                        animate={{ strokeDashoffset: [32, 0] }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                      />
                    )}

                    {/* 4. RSS Path (Bottom-Right -> Center) */}
                    <path d="M 305 240 L 200 240 L 200 180" fill="none" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrow-head)" />
                    {rssSync && (
                      <motion.path
                        d="M 305 240 L 200 240 L 200 188"
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="2"
                        strokeDasharray="4 12"
                        animate={{ strokeDashoffset: [32, 0] }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                      />
                    )}
                  </svg>

                  {/* 1. Gmail Node (Top-Left) */}
                  <button
                    onClick={toggleGmail}
                    className={`absolute left-[15%] top-[20%] -translate-x-1/2 -translate-y-1/2 w-[72px] h-[52px] md:w-[80px] md:h-[58px] flex flex-col items-center justify-center rounded-xl border-2 bg-[#FAF6F0] dark:bg-[#161519] select-none cursor-pointer transition-all duration-200 active:scale-95 ${
                      gmailSync
                        ? "border-red-500 text-red-500 shadow-[2px_2px_0px_0px_rgba(239,68,68,1)] dark:shadow-[2px_2px_0px_0px_rgba(239,68,68,0.25)] font-black"
                        : "border-zinc-300 dark:border-zinc-800 text-muted-foreground/50 opacity-65 grayscale"
                    }`}
                  >
                    <GoogleLogo size={18} weight={gmailSync ? "fill" : "bold"} />
                    <span className="text-[8px] font-mono uppercase tracking-wider mt-0.5">Gmail</span>
                  </button>

                  {/* 2. Outlook Node (Top-Right) */}
                  <button
                    onClick={toggleOutlook}
                    className={`absolute left-[85%] top-[20%] -translate-x-1/2 -translate-y-1/2 w-[72px] h-[52px] md:w-[80px] md:h-[58px] flex flex-col items-center justify-center rounded-xl border-2 bg-[#FAF6F0] dark:bg-[#161519] select-none cursor-pointer transition-all duration-200 active:scale-95 ${
                      outlookSync
                        ? "border-blue-500 text-blue-500 shadow-[2px_2px_0px_0px_rgba(59,130,246,1)] dark:shadow-[2px_2px_0px_0px_rgba(59,130,246,0.25)] font-black"
                        : "border-zinc-300 dark:border-zinc-800 text-muted-foreground/50 opacity-65 grayscale"
                    }`}
                  >
                    <EnvelopeSimple size={18} weight={outlookSync ? "fill" : "bold"} />
                    <span className="text-[8px] font-mono uppercase tracking-wider mt-0.5">Outlook</span>
                  </button>

                  {/* 3. GitHub Node (Bottom-Left) */}
                  <button
                    onClick={toggleGithub}
                    className={`absolute left-[15%] top-[80%] -translate-x-1/2 -translate-y-1/2 w-[72px] h-[52px] md:w-[80px] md:h-[58px] flex flex-col items-center justify-center rounded-xl border-2 bg-[#FAF6F0] dark:bg-[#161519] select-none cursor-pointer transition-all duration-200 active:scale-95 ${
                      githubSync
                        ? "border-brand-orange text-brand-orange shadow-[2px_2px_0px_0px_rgba(255,122,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,122,0,0.25)] font-black"
                        : "border-zinc-300 dark:border-zinc-855 text-muted-foreground/50 opacity-65 grayscale"
                    }`}
                  >
                    <GithubLogo size={18} weight={githubSync ? "fill" : "bold"} />
                    <span className="text-[8px] font-mono uppercase tracking-wider mt-0.5">GitHub</span>
                  </button>

                  {/* 4. RSS Node (Bottom-Right) */}
                  <button
                    onClick={toggleRss}
                    className={`absolute left-[85%] top-[80%] -translate-x-1/2 -translate-y-1/2 w-[72px] h-[52px] md:w-[80px] md:h-[58px] flex flex-col items-center justify-center rounded-xl border-2 bg-[#FAF6F0] dark:bg-[#161519] select-none cursor-pointer transition-all duration-200 active:scale-95 ${
                      rssSync
                        ? "border-amber-500 text-amber-500 shadow-[2px_2px_0px_0px_rgba(245,158,11,1)] dark:shadow-[2px_2px_0px_0px_rgba(245,158,11,0.25)] font-black"
                        : "border-zinc-300 dark:border-zinc-855 text-muted-foreground/50 opacity-65 grayscale"
                    }`}
                  >
                    <Rss size={18} weight={rssSync ? "fill" : "bold"} />
                    <span className="text-[8px] font-mono uppercase tracking-wider mt-0.5">RSS Feeds</span>
                  </button>

                  {/* 5. Center Node (Inbox FM Synthesis Engine) */}
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92px] h-[68px] md:w-[100px] md:h-[74px] flex flex-col items-center justify-center rounded-2xl border-2 border-black dark:border-zinc-800 bg-[#FAF6F0] dark:bg-[#161519] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.06)]"
                  >
                    <div className="relative flex items-center justify-center">
                      {(gmailSync || outlookSync || rssSync || githubSync) && (
                        <motion.span
                          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                          className="absolute w-8 h-8 rounded-full bg-brand-orange/15"
                        />
                      )}
                      <span className="text-[10px] md:text-xs font-archivo-black tracking-tighter text-foreground font-black">
                        INBOXFM
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: 2x2 Feature Grid Card */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 border-2 border-black dark:border-zinc-800 rounded-[var(--ds-radius-card)] bg-[#FAF6F0] dark:bg-[#161519] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.06)] overflow-hidden">
              
              {/* Context AI */}
              <div className="p-6 md:p-8 flex flex-col justify-center text-left border-b-2 sm:border-r-2 border-black dark:border-zinc-800 bg-[#FAF6F0] dark:bg-[#161519]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-orange/10 text-brand-orange flex items-center justify-center border border-brand-orange/20 shrink-0">
                    <Sparkle size={16} weight="fill" />
                  </div>
                  <h4 className="text-xs font-mono font-black uppercase tracking-widest text-foreground">Context AI</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-4 font-medium">
                  Connect emails (Gmail, Outlook), calendar events, repository activity, and feed updates into a unified daily briefing.
                </p>
              </div>

              {/* TTS Synthesizer */}
              <div className="p-6 md:p-8 flex flex-col justify-center text-left border-b-2 border-black dark:border-zinc-800 bg-[#FAF6F0] dark:bg-[#161519]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-orange/10 text-brand-orange flex items-center justify-center border border-brand-orange/20 shrink-0">
                    <Waves size={16} weight="fill" />
                  </div>
                  <h4 className="text-xs font-mono font-black uppercase tracking-widest text-foreground">TTS Narrator</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-4 font-medium">
                  Generate briefings using narrator styles (Executive, Commuter, Tech Lead) or custom voice styles.
                </p>
              </div>

              {/* Secure OAuth */}
              <div className="p-6 md:p-8 flex flex-col justify-center text-left border-b-2 sm:border-b-0 sm:border-r-2 border-black dark:border-zinc-800 bg-[#FAF6F0] dark:bg-[#161519]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shrink-0">
                    <ShieldCheck size={16} weight="fill" />
                  </div>
                  <h4 className="text-xs font-mono font-black uppercase tracking-widest text-foreground">Sovereign safety</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-4 font-medium">
                  Secure read-only OAuth sync, on-demand AI replies, and Outlook-only reply sending.
                </p>
              </div>

              {/* Schedules */}
              <div className="p-6 md:p-8 flex flex-col justify-center text-left bg-[#FAF6F0] dark:bg-[#161519]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-orange/10 text-brand-orange flex items-center justify-center border border-brand-orange/20 shrink-0">
                    <Calendar size={16} weight="fill" />
                  </div>
                  <h4 className="text-xs font-mono font-black uppercase tracking-widest text-foreground">Schedules</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-4 font-medium">
                  Deliver briefings automatically at customized morning or evening commute intervals.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Section: Listen instead of triaging */}
      <section id="listen" className="py-32 relative overflow-hidden bg-muted/15 dark:bg-black/10 border-b-2 border-black dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          
          <div className="md:col-span-7 space-y-6 text-left order-2 md:order-1">
            <span className="text-[10px] font-mono text-brand-orange uppercase tracking-widest font-black">
              AUDIO-FIRST INTELLIGENCE
            </span>
            <h2 className="text-3xl md:text-5xl font-serif tracking-tight leading-tight">
              Listen instead of triaging.
            </h2>
            <p className="text-base text-muted-foreground/90 leading-relaxed font-semibold">
              While others summarize emails, InboxFM generates a complete spoken briefing covering priorities, deadlines, meetings, updates, and follow-ups.
            </p>
            <p className="text-sm text-muted-foreground/80 leading-relaxed font-medium">
              Start your day with a focused, hands-free audio briefing rather than scanning notifications. Start acting on priorities immediately.
            </p>
            <div className="pt-2">
              <Link href="/apply">
                <Button 
                  size="brand" 
                  className="font-mono font-black text-xs uppercase tracking-widest rounded-xl border-2 border-[var(--ds-border-brutalist)] bg-brand-orange text-black hover:bg-brand-orange/90 shadow-[var(--ds-shadow-primary)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[var(--ds-shadow-hover)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                >
                  Apply for Early Access
                </Button>
              </Link>
            </div>
          </div>

          {/* Right side: Audio first card with premium radial gradient */}
          <div className="md:col-span-5 w-full order-1 md:order-2">
            <div className="relative rounded-2xl border-2 border-black dark:border-zinc-800 overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.06)] aspect-video md:aspect-[4/3] flex flex-col items-center justify-center bg-[#0D0C15] select-none p-6">
              
              {/* Radial gradient background representation mirroring the screenshot */}
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-orange/40 via-transparent to-indigo-950/40 pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-brand-orange/30 blur-[64px] pointer-events-none" />
              <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />
              
              {/* Grain / Noise Overlay */}
              <div 
                className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-repeat pointer-events-none" 
                style={{ 
                  backgroundImage: `url('data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noise)"/%3E%3C/svg%3E')`
                }}
              />

              {/* Pulsing Audio Waveform Visual */}
              <div className="relative z-10 flex items-center justify-center gap-1.5 h-20 w-full px-6">
                {[16, 32, 24, 48, 12, 36, 40, 20, 28, 56, 36, 16, 24, 48, 20].map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: [h * 0.4, h, h * 0.4],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5 + (i % 3) * 0.2,
                      ease: "easeInOut",
                      delay: i * 0.05,
                    }}
                    className="w-1.5 bg-[#E5D8C9] rounded-full text-glow"
                    style={{ height: h }}
                  />
                ))}
              </div>

              {/* Text "Audio First" */}
              <span className="relative z-10 font-serif font-light text-2xl text-[#E5D8C9] tracking-wide mt-6 text-glow">
                Audio First
              </span>

            </div>
          </div>

        </div>
      </section>

      {/* Section: Metrics & Testimonials */}
      <section className="py-24 border-b border-border/40 bg-background relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-[10px] font-mono text-brand-orange uppercase tracking-widest font-black">
              EARLY ADOPTERS
            </span>
            <h2 className="text-2xl md:text-4xl font-serif tracking-tight leading-tight">
              Validated by builders and knowledge workers.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left: Usage Metrics Card */}
            <div className="lg:col-span-5 flex flex-col justify-between p-6 md:p-8 rounded-[var(--ds-radius-card)] border-2 border-black dark:border-zinc-800 bg-[#FAF6F0] dark:bg-[#161519] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.06)] overflow-hidden">
              <div className="space-y-1 text-left">
                <span className="text-[9px] font-mono text-brand-orange uppercase tracking-widest font-black">Beta Milestones</span>
                <h3 className="text-lg font-serif font-black text-foreground">Usage Metrics</h3>
              </div>

              <div className="space-y-6 my-8 text-left">
                <div>
                  <div className="text-4xl md:text-5xl font-serif font-black text-brand-orange">
                    1,280+
                  </div>
                  <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider font-mono mt-1">
                    Listening Hours
                  </div>
                </div>

                <div>
                  <div className="text-4xl md:text-5xl font-serif font-black text-foreground">
                    15,400+
                  </div>
                  <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider font-mono mt-1">
                    Briefings Generated
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground/60 font-mono text-left uppercase">
                Updated weekly from active developer and founder beta pools.
              </p>
            </div>

            {/* Right: Testimonials / Early Feedback Grid */}
            <div className="lg:col-span-7 grid grid-cols-1 gap-6">
              
              {/* Testimonial 1 */}
              <div className="p-6 rounded-[var(--ds-radius-card)] border-2 border-black dark:border-zinc-800 bg-white dark:bg-[#161519] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.06)] text-left flex flex-col justify-between">
                <p className="text-sm italic leading-relaxed text-foreground font-medium">
                  &ldquo;InboxFM replaced my morning email dread. I listen to my briefing on my 10-minute walk, and I know exactly what needs my attention before I open my laptop.&rdquo;
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-3">
                  <span className="text-xs font-black text-foreground">Founder & Operator</span>
                  <span className="text-[9px] font-mono text-muted-foreground/60 uppercase">Beta Member</span>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="p-6 rounded-[var(--ds-radius-card)] border-2 border-black dark:border-zinc-800 bg-white dark:bg-[#161519] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.06)] text-left flex flex-col justify-between">
                <p className="text-sm italic leading-relaxed text-foreground font-medium">
                  &ldquo;As a developer, I love that it parses GitHub updates and calendar conflicts alongside my emails. The context it builds is surprisingly deep.&rdquo;
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-3">
                  <span className="text-xs font-black text-foreground">Software Engineer</span>
                  <span className="text-[9px] font-mono text-muted-foreground/60 uppercase">Beta Member</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* "Powering Your Focus-First Future" Section */}
      <section className="py-24 border-b border-border/40 relative bg-background">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          
          {/* Left panel: Feature list */}
          <div className="md:col-span-6 space-y-10 text-left">
            <div className="space-y-2">
              <h3 className="text-2xl md:text-4xl font-serif tracking-tight leading-tight">
                Refining how you catch up.
              </h3>
            </div>
 
            <div className="space-y-8">
              <div className="flex gap-4 items-start">
                <div className="w-6 h-6 rounded-md border-2 border-black dark:border-zinc-800 bg-brand-orange text-black flex items-center justify-center shrink-0 mt-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.06)]">
                  <Check size={12} weight="bold" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-wider text-foreground">Context That Remembers</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    InboxFM connects emails, meetings, GitHub activity, and feed updates across time, creating briefings that understand ongoing conversations rather than isolated messages.
                  </p>
                  <p className="text-[10px] text-brand-orange font-mono font-bold uppercase tracking-wider pt-0.5">
                    Why it matters: A client reply today can automatically reference decisions made two weeks ago.
                  </p>
                </div>
              </div>
 
              <div className="flex gap-4 items-start">
                <div className="w-6 h-6 rounded-md border-2 border-black dark:border-zinc-800 bg-brand-orange text-black flex items-center justify-center shrink-0 mt-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.06)]">
                  <Check size={12} weight="bold" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-wider text-foreground">Briefings That Connect Everything</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    Gmail, Outlook, calendars, repositories, and RSS feeds are transformed into a single coherent narrative instead of scattered notifications.
                  </p>
                  <p className="text-[10px] text-brand-orange font-mono font-bold uppercase tracking-wider pt-0.5">
                    Why it matters: One briefing replaces dozens of tabs and inbox checks.
                  </p>
                </div>
              </div>
 
              <div className="flex gap-4 items-start">
                <div className="w-6 h-6 rounded-md border-2 border-black dark:border-zinc-800 bg-brand-orange text-black flex items-center justify-center shrink-0 mt-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.06)]">
                  <Check size={12} weight="bold" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-wider text-foreground">Actions That Move Work Forward</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    InboxFM automatically identifies commitments, deadlines, and follow-ups. Review drafts, sync meetings with conflict checking, and manage priorities from a unified workspace feed.
                  </p>
                  <p className="text-[10px] text-brand-orange font-mono font-bold uppercase tracking-wider pt-0.5">
                    Why it matters: Draft email replies on-demand and sync calendar meetings hands-free.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Pretext Ingestion Synthesis Compiler */}
          <div className="md:col-span-6 w-full">
            <PretextFlowSandbox />
          </div>

        </div>
      </section>

      {/* Resource Hub Interlink Banner for SEO */}
      <section className="border-t-2 border-[var(--ds-border-brutalist)] bg-[#FAF6F0] dark:bg-[#161519] py-12 text-left relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Explore Our Resources</h3>
            <p className="text-xs text-muted-foreground font-medium max-w-xl">
              Stay updated with our latest development milestones, read insights on productivity frameworks on our journal, or get in touch with our team.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link 
              href="/blog" 
              className="px-4 py-2 border-2 border-black dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.06)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)] transition-all"
            >
              Read Blog
            </Link>
            <Link 
              href="/team" 
              className="px-4 py-2 border-2 border-black dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.06)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)] transition-all"
            >
              Meet the Team
            </Link>
            <Link 
              href="/releases" 
              className="px-4 py-2 border-2 border-black dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.06)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)] transition-all"
            >
              Product Changelog
            </Link>
          </div>
        </div>
      </section>



      <section id="faqs" className="py-24 border-t-2 border-[var(--ds-border-brutalist)] relative bg-muted/5">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          <div className="lg:col-span-5 text-left space-y-4 lg:sticky lg:top-32">
            <h2 className="text-3xl md:text-5xl font-serif font-black tracking-tight leading-tight">Frequently Answered.</h2>
            <p className="text-xs md:text-sm text-muted-foreground/80 leading-relaxed font-semibold">
              Technical details regarding processing scopes, OAuth scopes, and pipeline scheduling.
            </p>
          </div>

          <div className="lg:col-span-7 space-y-5 w-full">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="bg-white dark:bg-[#161519] border-2 border-[var(--ds-border-brutalist)] rounded-[var(--ds-radius-inner)] overflow-hidden transition-all duration-200 shadow-[var(--ds-shadow-primary)] hover:shadow-[var(--ds-shadow-hover)] hover:-translate-x-[1px] hover:-translate-y-[1px]"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full py-5 px-6 flex items-center justify-between text-left font-black text-xs md:text-sm uppercase tracking-wider text-foreground focus:outline-none select-none cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ type: "spring", stiffness: 250, damping: 22 }}
                      className="w-7 h-7 rounded-md border-2 border-[var(--ds-border-brutalist)] bg-[#FAF6F0] dark:bg-[#201F24] flex items-center justify-center text-foreground shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1px_1px_0px_0px_var(--ds-border-brutalist)]"
                    >
                      <CaretDown size={12} weight="bold" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="pb-5 px-6 text-xs md:text-sm text-muted-foreground/80 leading-relaxed border-t-2 border-[var(--ds-border-brutalist)] pt-4 font-semibold text-left">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA Block */}
      <section className="relative py-28 border-t-2 border-[var(--ds-border-brutalist)] bg-background overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="bg-white dark:bg-[#161519] border-2 border-[var(--ds-border-brutalist)] p-10 md:p-16 rounded-[var(--ds-radius-card)] shadow-[var(--ds-shadow-card)] relative overflow-hidden">
            
            {/* Absolute positioning corner badge for Sparkle */}
            <div className="absolute top-0 left-0 w-10 h-10 border-b-2 border-r-2 border-[var(--ds-border-brutalist)] bg-brand-orange text-black flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1px_1px_0px_0px_var(--ds-border-brutalist)]">
              <Sparkle size={18} weight="fill" />
            </div>

            <div className="text-center space-y-8 max-w-xl mx-auto flex flex-col items-center">
              <div className="space-y-3">
                <h2 className="text-3xl md:text-5xl font-serif font-black tracking-tight leading-tight text-foreground">
                  Stop managing information. Start acting on it.
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-semibold">
                  Turn inboxes, calendars, repositories, and feeds into a personalized daily audio briefing.
                </p>
              </div>

              <div className="pt-2 w-full flex flex-col items-center gap-4">
                <Link href="/apply" className="w-full sm:w-auto">
                  <Button
                    size="brand"
                    className="w-full sm:w-auto h-12 px-8 rounded-xl border-2 border-black dark:border-zinc-800 bg-brand-orange text-black font-black uppercase text-sm tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_var(--ds-border-brutalist)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Apply for Early Access
                    <ArrowRight size={16} weight="bold" />
                  </Button>
                </Link>

                {/* Badge underneath */}
                <div className="inline-block px-3 py-1 rounded-[var(--ds-radius-pill)] border-2 border-black dark:border-zinc-800 bg-brand-orange/10 text-brand-orange text-[10px] font-mono font-bold uppercase tracking-wider">
                  ★ First 500 users receive Lifetime Pro
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

    </div>
  );
}
