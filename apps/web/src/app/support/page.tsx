"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Question,
  PaperPlaneTilt,
  CheckCircle,
  Bug,
  Lightbulb,
  UserCircle,
  CurrencyDollar,
  ChatCircleDots,
  CaretDown,
  Headphones,
  EnvelopeSimple,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/api";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/PageHeader";

const FAQ_ITEMS = [
  {
    q: "How does Inbox FM work?",
    a: "Inbox FM connects securely to your Gmail, processes your incoming emails using advanced AI summaries, and compiles a clean, professional audio briefing delivered precisely when you schedule it.",
  },
  {
    q: "Is my email data secure, and do you store my emails?",
    a: "Absolutely. We employ strict end-to-end security protocols and do not store your raw emails or inbox threads on our servers. Your data is analyzed strictly in memory to generate your briefing, then immediately purged.",
  },
  {
    q: "Can I customize my summary delivery time?",
    a: "Yes. You can manage, add, or configure multiple custom summary delivery schedules with independent times and voice selections from your Summaries console.",
  },
  {
    q: "What voice options are available?",
    a: "We offer three crafted voice profiles: Newsroom (informative/professional), Casual (relaxed/friendly), and Speedster (fast-paced recaps) to perfectly match your morning workflow.",
  },
  {
    q: "How do I disconnect my Gmail?",
    a: "Open Settings > Accounts and select 'Disconnect Gmail'. This will instantly disconnect all integrations and securely revoke Google API authorizations.",
  },
];

export default function SupportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Form state
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("OTHER");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !subject || !message) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.support.createTicket({ email, subject, message, category });
      setIsSubmitted(true);
      toast.success("Ticket submitted successfully!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit ticket";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    BUG: <Bug size={18} weight="fill" className="text-rose-500" />,
    FEATURE: <Lightbulb size={18} weight="fill" className="text-amber-500" />,
    ACCOUNT: <UserCircle size={18} weight="fill" className="text-blue-500" />,
    BILLING: <CurrencyDollar size={18} weight="fill" className="text-emerald-500" />,
    OTHER: <ChatCircleDots size={18} weight="fill" className="text-zinc-500" />,
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="text-center max-w-md p-8 glass rounded-[var(--ds-radius-card)] shadow-[var(--ds-shadow-card)]"
        >
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-black dark:border-zinc-700 shadow-[var(--ds-shadow-primary)]">
            <CheckCircle size={36} weight="fill" className="text-emerald-500 animate-pulse" />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-3">We&apos;re On It! 🎧</h1>
          <p className="text-sm text-muted-foreground/90 leading-relaxed mb-8">
            Your support ticket has been registered. A confirmation with details was sent to your email. Our team will review and reply within 24 hours.
          </p>
          <Button
            onClick={() => setIsSubmitted(false)}
            variant="secondary"
            size="brand"
          >
            Submit New Ticket
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="max-w-5xl mx-auto space-y-8 pb-24"
    >
      <PageHeader
        title="Need Help? We're Here."
        description="Submit details below and we will get back to you faster than your morning briefing."
        className="mb-6"
      />

      <div className="grid lg:grid-cols-5 gap-8 items-start">
        {/* Ticket Form */}
        <div className="lg:col-span-3 rounded-[var(--ds-radius-card)] glass p-6 md:p-8 space-y-6 shadow-[var(--ds-shadow-card)] relative hover:shadow-[var(--ds-shadow-hover)] transition-all duration-300">
          <h2 className="text-xl font-black tracking-tight border-b border-border/40 pb-4">Submit a Ticket</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                Your Email *
              </Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="font-bold"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUG" className="font-bold">
                    <span className="flex items-center gap-2">{categoryIcons.BUG} Bug Report</span>
                  </SelectItem>
                  <SelectItem value="FEATURE" className="font-bold">
                    <span className="flex items-center gap-2">{categoryIcons.FEATURE} Feature Request</span>
                  </SelectItem>
                  <SelectItem value="ACCOUNT" className="font-bold">
                    <span className="flex items-center gap-2">{categoryIcons.ACCOUNT} Account Issue</span>
                  </SelectItem>
                  <SelectItem value="BILLING" className="font-bold">
                    <span className="flex items-center gap-2">{categoryIcons.BILLING} Billing</span>
                  </SelectItem>
                  <SelectItem value="OTHER" className="font-bold">
                    <span className="flex items-center gap-2">{categoryIcons.OTHER} Other</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                Subject *
              </Label>
              <Input
                type="text"
                placeholder="Brief description of your issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="font-bold"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                Message *
              </Label>
              <Textarea
                placeholder="Tell us everything..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[150px] resize-none"
                required
              />
            </div>

            <Button
              type="submit"
              size="brand"
              className="w-full mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <PaperPlaneTilt size={16} weight="bold" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Contact Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Calibrated Direct Email Card - Tamed Excess Orange */}
          <div className="rounded-[var(--ds-radius-card)] glass p-6 md:p-8 shadow-[var(--ds-shadow-card)] relative overflow-hidden border-2 border-primary bg-primary/[0.02] hover:shadow-[var(--ds-shadow-hover)] transition-all duration-300">
            <EnvelopeSimple size={28} weight="fill" className="text-primary mb-4" />
            <h3 className="text-lg font-black tracking-tight mb-1">Direct Email</h3>
            <p className="text-muted-foreground text-xs font-semibold mb-4 leading-relaxed">
              Prefer standard mail? Connect with our development labs directly at:
            </p>
            <a href="mailto:support@inboxfm.me" className="font-black text-base text-primary hover:underline hover:text-primary/95 transition-colors">
              support@inboxfm.me
            </a>
          </div>

          <div className="rounded-[var(--ds-radius-card)] glass p-6 md:p-8 shadow-[var(--ds-shadow-card)] border-2 border-black dark:border-zinc-750 hover:shadow-[var(--ds-shadow-hover)] transition-all duration-300">
            <h3 className="font-black text-lg tracking-tight mb-1.5">Response Time</h3>
            <p className="text-muted-foreground text-xs leading-relaxed font-semibold">
              We monitor requests continuously. You will typically receive support responses within <span className="font-black text-foreground">24 hours</span> during business days.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Accordion Segment */}
      <section className="rounded-[var(--ds-radius-card)] glass p-6 md:p-8 space-y-6 shadow-[var(--ds-shadow-card)] mt-12">
        <div className="text-center border-b-2 border-dashed border-black/10 dark:border-white/10 pb-5 mb-2">
          <h2 className="text-xl font-black tracking-tight mb-0.5">Frequently Asked Questions</h2>
          <p className="text-xs text-muted-foreground">Quick answers to help you navigate Gmail briefings</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <div
              key={i}
              className="rounded-[var(--ds-radius-inner)] border-2 border-black dark:border-zinc-700 bg-card overflow-hidden transition-all duration-300 shadow-[var(--ds-shadow-primary)] hover:shadow-[var(--ds-shadow-hover)] hover:-translate-x-[1px] hover:-translate-y-[1px]"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/15 transition-all duration-300 focus:outline-none"
              >
                <span className="font-bold text-sm flex items-center gap-3 text-foreground select-none">
                  <Question size={18} weight="fill" className="text-primary shrink-0" />
                  {item.q}
                </span>
                <CaretDown
                  size={16}
                  weight="bold"
                  className={`transition-transform duration-300 text-muted-foreground ${openFaq === i ? "rotate-180 text-foreground" : ""}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  >
                    <div className="px-5 pb-5 pt-1 text-xs leading-relaxed text-muted-foreground font-semibold border-t border-border/20 bg-muted/5">
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
