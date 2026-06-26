"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Sparkle,
  Check,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/shared/Spinner";
import { Logo } from "@/components/shared/Logo";
import { toast } from "sonner";
import api from "@/lib/api";



export default function ApplyPage() {
  const [step, setStep] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  // Form Fields
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState("");
  const [emailVolume, setEmailVolume] = React.useState("");
  const [biggestPain, setBiggestPain] = React.useState("");
  const [whyInboxfm, setWhyInboxfm] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const handleNext = () => {
    if (step === 1) {
      if (!name || !email) {
        toast.error("Please enter your name and email address before continuing.");
        return;
      }
      // Simple email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error("Please enter a valid email address.");
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    try {
      await api.waitlist.join({
        email,
        name,
        role,
        emailVolume,
        biggestPain,
        whyInboxfm,
        notes: notes || undefined,
      });
      setIsSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Please try again.";
      toast.error("Could not submit application", { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dark min-h-screen bg-[#050505] text-[#B8B8B8] flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* Decorative background grid and spotlight */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-orange/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-8 flex items-center justify-between">
        <Link href="/" className="hover:opacity-85 transition-all">
          <Logo className="text-xl text-[#E5D8C9] font-black text-glow" />
        </Link>
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-xs font-black uppercase tracking-widest text-[#B8B8B8] hover:text-[#E5D8C9]">
            ← Cancel
          </Button>
        </Link>
      </header>

      {/* Main content grid */}
      <main className="relative z-10 max-w-5xl mx-auto w-full px-6 py-6 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          
          {/* Left Column: Context, Stats & Benefits */}
          <div className="lg:col-span-5 space-y-8 text-left">
            <div className="space-y-4">
              <div className="inline-block px-3 py-1 rounded-[var(--ds-radius-pill)] border border-brand-orange/20 bg-brand-orange/5 text-brand-orange text-[10px] font-mono font-bold uppercase tracking-wider">
                🎁 First 500 approved users receive Lifetime Pro
              </div>
              
              <h1 className="text-4xl md:text-5xl font-serif text-[#E5D8C9] tracking-tight leading-tight">
                Apply for Early Access
              </h1>
              
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                InboxFM is currently onboarding users in batches while Gmail and Outlook integrations remain in testing approval. Early applicants receive priority access and product updates.
              </p>
            </div>



            {/* Benefits Checklist */}
            <div className="space-y-3 font-semibold text-xs border-t border-zinc-900 pt-6">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground/50 block mb-2">
                Approved Applicant Benefits
              </span>
              {[
                "Lifetime Pro access for first 500 approved users",
                "Direct communication with the founders",
                "Influence roadmap decisions",
                "Priority onboarding",
                "Early access to new integrations",
                "Help shape the future of InboxFM"
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-2.5 text-[#B8B8B8]">
                  <Check size={14} weight="bold" className="text-brand-orange shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Multi-step interactive form card */}
          <div className="lg:col-span-7 flex items-center justify-center">
            <div className="w-full max-w-md bg-[#161519] border-2 border-zinc-800 rounded-[var(--ds-radius-card)] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] overflow-hidden">
              
              {/* Card Header progress tracker */}
              <div className="px-6 py-5 border-b-2 border-zinc-800 bg-[#0B0B0B] text-left">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] font-mono text-brand-orange uppercase font-black">
                    {isSubmitted ? "Application Complete" : `Step ${step} of 3`}
                  </span>
                  {!isSubmitted && (
                    <span className="text-[9px] font-mono text-muted-foreground/60 uppercase font-semibold">
                      {step === 1 && "Profile Details"}
                      {step === 2 && "Workflow Scope"}
                      {step === 3 && "Interest Details"}
                    </span>
                  )}
                </div>
                
                {/* Horizontal Progress bar */}
                <div className="flex gap-2">
                  {[1, 2, 3].map((s) => (
                    <div 
                      key={s} 
                      className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                        isSubmitted || step >= s ? "bg-brand-orange" : "bg-zinc-800"
                      }`} 
                    />
                  ))}
                </div>
              </div>

              {/* Form Content body with framer-motion */}
              <div className="p-6 md:p-8 min-h-[340px] flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  {isSubmitted ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                      className="space-y-6 text-center py-6"
                    >
                      <div className="w-14 h-14 rounded-[var(--ds-radius-inner)] bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center text-emerald-500 mx-auto shadow-[3px_3px_0px_0px_rgba(16,185,129,0.1)]">
                        <CheckCircle size={28} weight="fill" />
                      </div>
                      
                      <div className="space-y-2 max-w-sm mx-auto">
                        <h2 className="text-2xl font-serif text-[#E5D8C9] tracking-tight">
                          Application Received
                        </h2>
                        <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                          We review applications daily and onboard users in batches. Most applicants receive a response within 24-72 hours.
                        </p>
                      </div>

                      <div className="inline-block px-3 py-1 rounded-[var(--ds-radius-pill)] border border-brand-orange/20 bg-brand-orange/5 text-brand-orange text-[10px] font-mono font-bold uppercase tracking-wider">
                        ★ First 500 approved users receive Lifetime Pro
                      </div>

                      <div className="pt-2">
                        <Link href="/">
                          <Button size="brand" className="w-full">
                            Return Home
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  ) : (
                    <form 
                      onSubmit={(e) => e.preventDefault()}
                      className="space-y-6 flex-1 flex flex-col justify-between"
                    >
                      {/* Step 1 Content */}
                      {step === 1 && (
                        <motion.div
                          key="step1"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                          className="space-y-4 text-left"
                        >
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono font-black uppercase tracking-widest text-muted-foreground/60 ml-0.5">
                              Full Name
                            </label>
                            <Input
                              type="text"
                              placeholder="Your full name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="font-bold border border-zinc-800 bg-[#0B0B0B] text-[#E5D8C9]"
                              required
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono font-black uppercase tracking-widest text-muted-foreground/60 ml-0.5">
                              Email Address
                            </label>
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="font-bold border border-zinc-800 bg-[#0B0B0B] text-[#E5D8C9]"
                              required
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono font-black uppercase tracking-widest text-muted-foreground/60 ml-0.5">
                              Your Primary Role <span className="font-semibold normal-case text-[8px] text-muted-foreground/40">(optional)</span>
                            </label>
                            <Select value={role} onValueChange={(val) => setRole(val)}>
                              <SelectTrigger className="font-bold border border-zinc-800 bg-[#0B0B0B] text-[#E5D8C9]">
                                <SelectValue placeholder="Select your role..." />
                              </SelectTrigger>
                              <SelectContent className="border border-zinc-800 bg-[#0B0B0B] text-[#E5D8C9]">
                                <SelectItem value="Founder">Founder</SelectItem>
                                <SelectItem value="Developer">Developer</SelectItem>
                                <SelectItem value="Consultant">Consultant</SelectItem>
                                <SelectItem value="Operator">Operator</SelectItem>
                                <SelectItem value="Executive">Executive</SelectItem>
                                <SelectItem value="Student">Student</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </motion.div>
                      )}

                      {/* Step 2 Content */}
                      {step === 2 && (
                        <motion.div
                          key="step2"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                          className="space-y-5 text-left"
                        >
                          <div className="space-y-2.5">
                            <label className="text-[9px] font-mono font-black uppercase tracking-widest text-muted-foreground/60 ml-0.5">
                              How many emails do you receive daily? <span className="font-semibold normal-case text-[8px] text-muted-foreground/40">(optional)</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {["Less than 25", "25-50", "50-100", "100+"].map((option) => (
                                <button
                                  type="button"
                                  key={option}
                                  onClick={() => setEmailVolume(option)}
                                  className={`p-3 rounded-[var(--ds-radius-inner)] border-2 text-[10px] font-mono font-bold uppercase tracking-wider text-center transition-all ${
                                    emailVolume === option
                                      ? "border-brand-orange bg-[#FF6A00]/5 text-brand-orange"
                                      : "border-zinc-800 bg-[#0B0B0B] text-muted-foreground hover:border-zinc-700 hover:text-foreground"
                                  }`}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            <label className="text-[9px] font-mono font-black uppercase tracking-widest text-muted-foreground/60 ml-0.5">
                              What consumes most of your attention? <span className="font-semibold normal-case text-[8px] text-muted-foreground/40">(optional)</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                "Email",
                                "Meetings",
                                "Notifications",
                                "Project Updates",
                                "Newsletters",
                                "Everything"
                              ].map((option) => (
                                <button
                                  type="button"
                                  key={option}
                                  onClick={() => setBiggestPain(option)}
                                  className={`p-3 rounded-[var(--ds-radius-inner)] border-2 text-[10px] font-mono font-bold uppercase tracking-wider text-center transition-all ${
                                    biggestPain === option
                                      ? "border-brand-orange bg-[#FF6A00]/5 text-brand-orange"
                                      : "border-zinc-800 bg-[#0B0B0B] text-muted-foreground hover:border-zinc-700 hover:text-foreground"
                                  }`}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Step 3 Content */}
                      {step === 3 && (
                        <motion.div
                          key="step3"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                          className="space-y-4 text-left"
                        >
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono font-black uppercase tracking-widest text-muted-foreground/60 ml-0.5">
                              What made you interested in InboxFM? <span className="font-semibold normal-case text-[8px] text-muted-foreground/40">(optional)</span>
                            </label>
                            <Textarea
                              placeholder="Briefly describe what caught your eye..."
                              value={whyInboxfm}
                              onChange={(e) => setWhyInboxfm(e.target.value)}
                              className="min-h-[90px] resize-none border border-zinc-800 bg-[#0B0B0B] text-[#E5D8C9] font-semibold"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono font-black uppercase tracking-widest text-muted-foreground/60 ml-0.5">
                              Anything you&apos;d like us to know?{" "}
                              <span className="font-semibold normal-case text-[8px] text-muted-foreground/40">(optional)</span>
                            </label>
                            <Textarea
                              placeholder="Any context or questions for the founders..."
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              className="min-h-[80px] resize-none border border-zinc-800 bg-[#0B0B0B] text-[#E5D8C9] font-semibold"
                            />
                          </div>
                        </motion.div>
                      )}

                      {/* Card actions: Back & Next/Submit */}
                      <div className="flex gap-3 pt-6 border-t border-zinc-900 mt-6">
                        {step > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleBack}
                            disabled={isLoading}
                            className="px-4 border-2 border-zinc-800 text-muted-foreground hover:text-foreground"
                          >
                            <ArrowLeft size={16} weight="bold" />
                          </Button>
                        )}
                        {step < 3 ? (
                          <Button
                            type="button"
                            onClick={handleNext}
                            className="flex-1 flex items-center justify-center gap-2"
                          >
                            Continue
                            <ArrowRight size={15} weight="bold" />
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-2"
                          >
                            {isLoading ? (
                              <><Spinner size={16} /> Submitting...</>
                            ) : (
                              <>Submit Application <Sparkle size={15} weight="fill" className="text-black" /></>
                            )}
                          </Button>
                        )}
                      </div>
                    </form>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-8 border-t border-zinc-950 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40 text-center md:text-left">
        <div>
          © {new Date().getFullYear()} InboxFM. All rights reserved.
        </div>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-muted-foreground/70 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-muted-foreground/70 transition-colors">Terms</Link>
        </div>
      </footer>

    </div>
  );
}
