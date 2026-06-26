"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle,
  EnvelopeSimple,
  Clock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
} from "@phosphor-icons/react";
import { Spinner } from "@/components/shared/Spinner";
import { toast } from "sonner";
import api from "@/lib/api";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await api.waitlist.join({ email, name: name || undefined });
      setIsSubmitted(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Please try again.";
      toast.error("Could not join waitlist", { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] dark:bg-background flex flex-col items-center justify-center relative overflow-hidden px-6 py-16">

      {/* Dot grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#00000008_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff05_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-brand-orange/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Logo */}
      <div className="relative z-10 mb-10">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <Logo />
        </Link>
      </div>
      <AnimatePresence mode="wait">


          {/* ── Success State ── */}
          {isSubmitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-sm relative z-10"
            >
              {/* Success card */}
              <div className="bg-white dark:bg-[#161519] border-2 border-[var(--ds-border-brutalist)] rounded-[var(--ds-radius-card)] p-8 shadow-[var(--ds-shadow-card)] text-center space-y-6">

                {/* Animated check */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 16 }}
                  className="w-16 h-16 rounded-[var(--ds-radius-inner)] bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-500 mx-auto shadow-[2px_2px_0px_0px_rgba(34,197,94,0.2)]"
                >
                  <CheckCircle size={32} weight="fill" />
                </motion.div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-black tracking-tight text-foreground">
                    You&apos;re on the list!
                  </h2>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    We&apos;ve reserved a spot for{" "}
                    <span className="font-black text-foreground">{email}</span>.
                    You&apos;ll get an invite code as soon as your batch opens.
                  </p>
                </div>

                {/* Queue badge */}
                <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FAF6F0] dark:bg-[#0B0B0B] border-2 border-[var(--ds-border-brutalist)] rounded-[var(--ds-radius-inner)] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1px_1px_0px_0px_var(--ds-border-brutalist)]">
                  <Clock size={13} className="text-brand-orange shrink-0" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-foreground/60">
                    Queue review every 48 hours
                  </span>
                </div>

                <Link href="/" className="block w-full">
                  <button className="w-full h-11 rounded-[var(--ds-radius-inner)] border-2 border-[var(--ds-border-brutalist)] bg-white dark:bg-zinc-900 text-foreground text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_var(--ds-border-brutalist)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-150 cursor-pointer">
                    <ArrowLeft size={14} weight="bold" />
                    Back to Home
                  </button>
                </Link>
              </div>

              {/* Follow-up note */}
              <p className="text-center text-[11px] text-muted-foreground/50 mt-5 font-medium">
                Already have an access code?{" "}
                <Link href="/signup" className="text-brand-orange font-bold hover:underline">
                  Sign up here
                </Link>
              </p>
            </motion.div>

          ) : (

            /* ── Form State ── */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-sm relative z-10"
            >
              {/* Form card */}
              <div className="bg-white dark:bg-[#161519] border-2 border-[var(--ds-border-brutalist)] rounded-[var(--ds-radius-card)] shadow-[var(--ds-shadow-card)] overflow-hidden">

                {/* Card header strip */}
                <div className="px-8 pt-8 pb-6 border-b-2 border-[var(--ds-border-brutalist)] bg-[#FAF6F0] dark:bg-[#0B0B0B]">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-[var(--ds-radius-inner)] bg-white dark:bg-[#161519] border-2 border-[var(--ds-border-brutalist)] flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_var(--ds-border-brutalist)]">
                      <EnvelopeSimple size={22} weight="fill" className="text-brand-orange" />
                    </div>
                    <div className="space-y-0.5 pt-0.5">
                      <h2 className="text-xl font-black tracking-tight text-foreground">
                        Request Invite
                      </h2>
                      <p className="text-xs text-muted-foreground font-medium">
                        Beta access drops in batches. Secure your spot.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form body */}
                <form onSubmit={handleSubmit} className="p-8 space-y-4">

                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/50">
                      Name{" "}
                      <span className="font-medium normal-case tracking-normal text-foreground/30">(optional)</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="font-semibold"
                      autoFocus
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/50">
                      Email address
                    </label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="font-semibold"
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={isLoading || !email}
                    size="brand"
                    className="w-full mt-2 gap-2"
                  >
                    {isLoading ? (
                      <><Spinner size={16} /> Reserving spot...</>
                    ) : (
                      <>Join the Waitlist <ArrowRight size={15} weight="bold" /></>
                    )}
                  </Button>
                </form>

                {/* Card footer */}
                <div className="px-8 py-4 border-t-2 border-[var(--ds-border-brutalist)] bg-[#FAF6F0] dark:bg-[#0B0B0B] flex flex-wrap items-center justify-center gap-1 text-[11px] text-muted-foreground font-medium">
                  Already have a code?{" "}
                  <Link href="/signup" className="font-black text-brand-orange hover:underline">
                    Sign up here
                  </Link>
                </div>
              </div>

              {/* Trust note below card */}
              <div className="flex items-center justify-center gap-2 mt-5 text-[10px] font-mono text-muted-foreground/40 uppercase tracking-widest">
                <ShieldCheck size={11} className="text-emerald-500/60" />
                No spam. No password. Cancel anytime.
              </div>
            </motion.div>
          )}

        </AnimatePresence>
    </div>
  );
}
