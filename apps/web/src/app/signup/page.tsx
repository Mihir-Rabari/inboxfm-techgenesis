"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  EnvelopeSimple,
  Key,
  LockKey,
  Headphones,
  Waves,
  Sparkle,
} from "@phosphor-icons/react";
import { Spinner } from "@/components/shared/Spinner";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import api from "@/lib/api";

type Step = 1 | 2 | 3;

const STEPS = [
  {
    id: 1 as Step,
    Icon: EnvelopeSimple,
    title: "Let's get started",
    subtitle: "Tell us a bit about yourself.",
  },
  {
    id: 2 as Step,
    Icon: Key,
    title: "Enter your access code",
    subtitle: "Check your invitation email.",
  },
  {
    id: 3 as Step,
    Icon: LockKey,
    title: "Secure your account",
    subtitle: "Choose a strong password.",
  },
];

const slide = {
  enter: (d: number) => ({ x: d > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -48 : 48, opacity: 0 }),
};

// Decorative feature pills shown on the left panel
const FEATURES = [
  { icon: Waves, label: "Daily spoken briefings" },
  { icon: Headphones, label: "Custom voice engines" },
  { icon: Sparkle, label: "AI-powered synthesis" },
];

export default function SignupPage() {
  const [step, setStep] = useState<Step>(1);
  const [dir, setDir] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [checkStatus, setCheckStatus] = useState<
    "REGISTERED" | "APPROVED" | "WAITLISTED" | "NEW_WAITLISTED" | null
  >(null);
  const [checkMessage, setCheckMessage] = useState("");

  const { isAuthenticated, isLoading: authLoading, signup } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && isAuthenticated) router.push("/dashboard");
  }, [authLoading, isAuthenticated, router]);

  const next = () => {
    setDir(1);
    setStep((s) => Math.min(s + 1, 3) as Step);
  };
  const back = () => {
    setDir(-1);
    setStep((s) => Math.max(s - 1, 1) as Step);
  };

  const onStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    if (!agreed) {
      toast.error("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setIsChecking(true);
    try {
      const res = await api.waitlist.signupCheck({
        email,
        name: name || undefined,
      });
      setCheckStatus(res.status);
      setCheckMessage(res.message);

      if (res.status === "REGISTERED") {
        toast.error("Account already exists", { description: res.message });
      } else {
        next();
      }
    } catch (err) {
      toast.error("Something went wrong", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const onStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode) next();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast.error("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }
    setIsLoading(true);
    try {
      await signup({ email, password, name: name || undefined, accessCode });
      toast.success("Welcome to Inbox FM!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Please try again.";
      if (msg.toLowerCase().includes("access code")) {
        setDir(-1);
        setStep(2);
        setAccessCode("");
        toast.error("Invalid access code", { description: msg });
      } else {
        toast.error("Signup failed", { description: msg });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size={40} className="text-primary" />
      </div>
    );
  }

  const current = STEPS[step - 1];

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Left: Dark branding panel ── */}
      <div className="hidden lg:flex w-[420px] shrink-0 flex-col justify-between p-12 bg-[#0A0A0A] border-r-2 border-[#FF6A00] relative overflow-hidden">

        {/* Subtle radial glow */}
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-brand-orange/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-brand-orange/5 blur-[80px] pointer-events-none" />

        {/* Decorative corner bracket top-right */}
        <div className="absolute top-0 right-0 w-8 h-8 border-b-2 border-l-2 border-brand-orange/40" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-t-2 border-r-2 border-brand-orange/40" />

        {/* Logo */}
        <Link href="/" className="relative z-10 hover:opacity-80 transition-opacity">
          <Logo variant="onDark" />
        </Link>

        {/* Step rail */}
        <div className="relative z-10 space-y-6">
          {STEPS.map(({ id, Icon, title, subtitle }) => {
            const done = step > id;
            const active = step === id;
            return (
              <div key={id} className="flex items-start gap-4">
                {/* Step indicator */}
                <motion.div
                  animate={{
                    backgroundColor: done
                      ? "#FF6A00"
                      : active
                        ? "rgba(255,106,0,0.12)"
                        : "rgba(255,255,255,0.04)",
                    borderColor: active
                      ? "#FF6A00"
                      : done
                        ? "#FF6A00"
                        : "rgba(255,255,255,0.1)",
                  }}
                  transition={{ duration: 0.3 }}
                  className="mt-0.5 w-10 h-10 rounded-[var(--ds-radius-inner)] shrink-0 flex items-center justify-center border-2 shadow-[2px_2px_0px_0px_rgba(255,106,0,0.15)]"
                >
                  {done ? (
                    <Check size={14} weight="bold" className="text-white" />
                  ) : (
                    <Icon
                      size={16}
                      weight={active ? "fill" : "regular"}
                      className={active ? "text-brand-orange" : "text-zinc-600"}
                    />
                  )}
                </motion.div>

                {/* Step text */}
                <div className="pt-1.5 space-y-0.5">
                  <p className={`text-sm font-black tracking-tight transition-colors duration-300 ${
                    active ? "text-zinc-50" : done ? "text-zinc-500" : "text-zinc-700"
                  }`}>
                    {title}
                  </p>
                  <p className={`text-xs font-medium transition-colors duration-300 ${
                    active ? "text-zinc-400" : "text-zinc-700"
                  }`}>
                    {subtitle}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Connector lines between steps */}
          <div className="absolute left-[1.25rem] top-[2.75rem] flex flex-col gap-0 -z-10" style={{ height: "calc(100% - 2.5rem)" }}>
            {[0, 1].map((i) => (
              <motion.div
                key={i}
                animate={{ backgroundColor: step > i + 1 ? "#FF6A00" : "rgba(255,255,255,0.06)" }}
                transition={{ duration: 0.4 }}
                className="w-0.5 h-[3.5rem] ml-[0.9375rem]"
              />
            ))}
          </div>
        </div>

        {/* Feature pills */}
        <div className="relative z-10 space-y-3">
          <p className="text-[9px] font-mono font-bold tracking-[0.2em] text-zinc-700 uppercase mb-4">
            What you&apos;re getting
          </p>
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--ds-radius-inner)] border border-zinc-800 bg-zinc-900/60">
              <div className="w-6 h-6 rounded-md bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center shrink-0">
                <Icon size={12} weight="fill" className="text-brand-orange" />
              </div>
              <span className="text-xs font-semibold text-zinc-400">{label}</span>
            </div>
          ))}
          <p className="text-[10px] text-zinc-800 font-medium pt-4">
            © {new Date().getFullYear()} VedLabs. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right: Form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-[#FAF6F0] dark:bg-background relative overflow-hidden">

        {/* Subtle dot grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#00000008_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff06_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

        {/* Orange glow accent */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-brand-orange/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Mobile logo */}
        <div className="lg:hidden mb-10 self-start relative z-10">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        <div className="w-full max-w-sm relative z-10">

          {/* Step progress bar */}
          <div className="flex items-center gap-2 mb-10">
            {([1, 2, 3] as Step[]).map((s) => (
              <motion.div
                key={s}
                animate={{
                  width: s === step ? 36 : 8,
                  backgroundColor:
                    s <= step
                      ? "#FF6A00"
                      : "#00000015",
                  opacity: s < step ? 0.5 : 1,
                }}
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                className="h-1.5 rounded-full"
              />
            ))}
            <span className="ml-1 text-[10px] font-mono font-bold text-foreground/30 tabular-nums uppercase tracking-widest">
              {step} / 3
            </span>
          </div>

          {/* Animated heading */}
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={`h${step}`}
              custom={dir}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="mb-8"
            >
              {/* Step icon badge */}
              <div className="w-12 h-12 rounded-[var(--ds-radius-inner)] bg-white dark:bg-zinc-900 border-2 border-[var(--ds-border-brutalist)] flex items-center justify-center mb-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,106,0,0.2)]">
                <current.Icon
                  size={22}
                  weight="fill"
                  className="text-brand-orange"
                />
              </div>
              <h1 className="text-[28px] font-black text-foreground leading-tight mb-1 tracking-tight">
                {current.title}
              </h1>
              <p className="text-sm text-muted-foreground font-medium">{current.subtitle}</p>
            </motion.div>
          </AnimatePresence>

          {/* Forms */}
          <AnimatePresence mode="wait" custom={dir}>

            {/* ─ Step 1 ─ */}
            {step === 1 && (
              <motion.form
                key="f1"
                custom={dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                onSubmit={onStep1}
                className="space-y-4"
              >
                {/* Name field */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/50">
                    Name <span className="font-medium normal-case tracking-normal text-foreground/30">(optional)</span>
                  </Label>
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                    className="font-semibold"
                  />
                </div>

                {/* Email field */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/50">
                    Email address
                  </Label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="font-semibold"
                  />
                </div>

                {/* Terms checkbox */}
                <div className="flex items-start gap-3 bg-white dark:bg-zinc-900/60 border-2 border-[var(--ds-border-brutalist)] rounded-[var(--ds-radius-inner)] p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.06)]">
                  <Checkbox
                    id="terms"
                    checked={agreed}
                    onCheckedChange={(c) => setAgreed(c === true)}
                    className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label
                    htmlFor="terms"
                    className="text-[12px] text-muted-foreground leading-relaxed cursor-pointer select-none text-left font-medium"
                  >
                    I agree to the{" "}
                    <Link href="/terms" className="text-brand-orange hover:underline font-bold">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-brand-orange hover:underline font-bold">
                      Privacy Policy
                    </Link>
                    .
                  </label>
                </div>

                {/* CTA */}
                <Button
                  type="submit"
                  disabled={!email || isChecking}
                  size="brand"
                  className="w-full mt-2 gap-2"
                >
                  {isChecking ? (
                    <><Spinner size={17} /> Verifying...</>
                  ) : (
                    <>Continue <ArrowRight size={17} weight="bold" /></>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground/50 pt-1 font-medium">
                  Already have an account?{" "}
                  <Link href="/login" className="text-brand-orange font-bold hover:underline">
                    Sign in
                  </Link>
                </p>
              </motion.form>
            )}

            {/* ─ Step 2 — Waitlisted / Not yet approved ─ */}
            {step === 2 &&
              (checkStatus === "WAITLISTED" || checkStatus === "NEW_WAITLISTED") && (
                <motion.div
                  key="f2-blocked"
                  custom={dir}
                  variants={slide}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                  className="space-y-5 text-center"
                >
                  {/* Email recap */}
                  <div className="flex items-center gap-2.5 bg-white dark:bg-zinc-900/60 border-2 border-[var(--ds-border-brutalist)] rounded-[var(--ds-radius-inner)] px-4 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.06)]">
                    <EnvelopeSimple size={14} className="text-muted-foreground/60 shrink-0" />
                    <span className="text-sm text-foreground truncate font-semibold">{email}</span>
                  </div>

                  {/* Waitlist status card */}
                  <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-zinc-900/60 border-2 border-[var(--ds-border-brutalist)] rounded-[var(--ds-radius-card)] gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.06)]">
                    <div className="w-14 h-14 rounded-[var(--ds-radius-inner)] bg-brand-orange/10 border-2 border-brand-orange/30 flex items-center justify-center">
                      <EnvelopeSimple size={28} weight="fill" className="text-brand-orange" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-foreground">
                        {checkStatus === "WAITLISTED"
                          ? "You're still on the waitlist"
                          : "You're on the waitlist!"}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs font-medium">
                        {checkMessage || "We are rolling out access in batches. You are on the list."}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <Link href="/">
                      <Button variant="outline" className="w-full font-bold">
                        Back to Home
                      </Button>
                    </Link>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={back}
                      className="w-full font-bold text-muted-foreground hover:text-foreground"
                    >
                      Change Email / Re-verify
                    </Button>
                  </div>
                </motion.div>
              )}

            {/* ─ Step 2 — Approved: enter access code ─ */}
            {step === 2 && checkStatus === "APPROVED" && (
              <motion.form
                key="f2-approved"
                custom={dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                onSubmit={onStep2}
                className="space-y-4"
              >
                {/* Email recap */}
                <div className="flex items-center gap-2.5 bg-white dark:bg-zinc-900/60 border-2 border-[var(--ds-border-brutalist)] rounded-[var(--ds-radius-inner)] px-4 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.06)]">
                  <EnvelopeSimple size={14} className="text-muted-foreground/60 shrink-0" />
                  <span className="text-sm text-foreground truncate font-semibold">{email}</span>
                </div>

                {/* Access code input */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/50">
                    Access code
                  </Label>
                  <input
                    type="text"
                    placeholder="IFM-XXXXXXXX"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    required
                    autoFocus
                    className="w-full h-14 bg-white dark:bg-zinc-900 border-2 border-[var(--ds-border-brutalist)] rounded-[var(--ds-radius-inner)] px-4 text-foreground placeholder:text-foreground/20 font-mono tracking-[0.3em] text-xl font-black text-center focus:outline-none focus:border-brand-orange shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.06)] transition-all duration-200 focus:shadow-[3px_3px_0px_0px_#FF6A00] focus:-translate-x-[1px] focus:-translate-y-[1px]"
                  />
                  <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wide">
                    Check your inbox for an invitation email.{" "}
                    <Link href="/waitlist" className="text-brand-orange hover:underline font-bold">
                      No code?
                    </Link>
                  </p>
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={back}
                    className="w-12 h-12 shrink-0 rounded-[var(--ds-radius-inner)] border-2 border-[var(--ds-border-brutalist)] bg-white dark:bg-zinc-900 flex items-center justify-center text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.06)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-150 cursor-pointer"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <Button
                    type="submit"
                    disabled={!accessCode}
                    size="brand"
                    className="flex-1 h-12 gap-2"
                  >
                    Continue <ArrowRight size={17} weight="bold" />
                  </Button>
                </div>
              </motion.form>
            )}

            {/* ─ Step 3 — Password ─ */}
            {step === 3 && (
              <motion.form
                key="f3"
                custom={dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                onSubmit={onSubmit}
                className="space-y-4"
              >
                {/* Email + access code recap */}
                <div className="flex items-center gap-2.5 bg-white dark:bg-zinc-900/60 border-2 border-[var(--ds-border-brutalist)] rounded-[var(--ds-radius-inner)] px-4 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.06)]">
                  <EnvelopeSimple size={14} className="text-muted-foreground/60 shrink-0" />
                  <span className="text-sm text-foreground truncate flex-1 min-w-0 font-semibold">
                    {email}
                  </span>
                  <span className="text-[9px] font-mono text-brand-orange bg-brand-orange/10 border border-brand-orange/20 px-2 py-0.5 rounded-[var(--ds-radius-pill)] shrink-0 font-black uppercase tracking-wider">
                    {accessCode}
                  </span>
                </div>

                {/* Password input */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/50">
                    Password
                  </Label>
                  <Input
                    type="password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoFocus
                    className="font-bold"
                  />
                  {/* Password strength meter */}
                  {password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-1 pt-1"
                    >
                      {[1, 2, 3, 4].map((lvl) => (
                        <div
                          key={lvl}
                          className="h-1 flex-1 rounded-full transition-colors duration-300"
                          style={{
                            backgroundColor:
                              password.length >= lvl * 2
                                ? lvl <= 1
                                  ? "#EF4444"
                                  : lvl <= 2
                                    ? "#F59E0B"
                                    : lvl <= 3
                                      ? "#84CC16"
                                      : "#22C55E"
                                : "#00000010",
                          }}
                        />
                      ))}
                    </motion.div>
                  )}
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={back}
                    className="w-12 h-12 shrink-0 rounded-[var(--ds-radius-inner)] border-2 border-[var(--ds-border-brutalist)] bg-white dark:bg-zinc-900 flex items-center justify-center text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.06)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-150 cursor-pointer"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <Button
                    type="submit"
                    disabled={isLoading || password.length < 8}
                    size="brand"
                    className="flex-1 h-12 gap-2"
                  >
                    {isLoading ? (
                      <><Spinner size={16} /> Creating...</>
                    ) : (
                      <>Create Account <ArrowRight size={17} weight="bold" /></>
                    )}
                  </Button>
                </div>
              </motion.form>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
