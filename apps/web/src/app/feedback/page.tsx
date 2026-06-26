"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  PaperPlaneTilt,
  CheckCircle,
  Heart,
  Confetti,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/PageHeader";

export default function FeedbackPage() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form state
  const [email, setEmail] = useState(user?.email || "");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !rating) {
      toast.error("Please provide your email and a rating");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.feedback.submit({ email, rating, message });
      setIsSubmitted(true);
      toast.success("Thank you for your feedback!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit feedback";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="text-center max-w-md p-8 glass rounded-[var(--ds-radius-card)] border-2 border-black dark:border-zinc-700 shadow-[var(--ds-shadow-card)]"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2, stiffness: 260, damping: 20 }}
            className="w-20 h-20 bg-primary/10 border-2 border-black dark:border-zinc-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[var(--ds-shadow-primary)]"
          >
            <Confetti size={36} weight="fill" className="text-primary" />
          </motion.div>
          <h1 className="text-3xl font-black tracking-tight mb-3">You&apos;re the Best! 🎉</h1>
          <p className="text-sm text-muted-foreground/90 leading-relaxed mb-8">
            Your feedback helps us continuously improve Inbox FM. We sincerely appreciate you taking the time to share your experience!
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setIsSubmitted(false)} variant="secondary" size="brand">
              Submit More
            </Button>
            <Button onClick={() => window.history.back()} size="brand">
              Go Back
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="max-w-xl mx-auto space-y-8 pb-24"
    >
      <PageHeader
        title="How's Your Experience?"
        description="Your feedback shapes the future of Inbox FM. Let us know how we can elevate your briefing portals!"
        className="mb-4 text-center"
      />

      {/* Form Container */}
      <div className="rounded-[var(--ds-radius-card)] glass p-6 md:p-8 space-y-6 shadow-[var(--ds-shadow-card)] relative hover:shadow-[var(--ds-shadow-hover)] transition-all duration-300">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating Selection */}
          <div className="text-center">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 block mb-4">
              Rate Your Experience
            </Label>
            <div className="flex justify-center gap-1 select-none">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  type="button"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1.5 transition-colors focus:outline-none"
                >
                  <Star
                    size={42}
                    weight={(hoveredRating || rating) >= star ? "fill" : "regular"}
                    className={cn(
                      "transition-all duration-200",
                      (hoveredRating || rating) >= star
                        ? "text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.35)]"
                        : "text-muted-foreground/30"
                    )}
                  />
                </motion.button>
              ))}
            </div>
            
            <AnimatePresence mode="wait">
              {rating > 0 && (
                <motion.p
                  key={rating}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 text-xs font-black text-muted-foreground/80 uppercase tracking-wider"
                >
                  {rating === 1 && "We'll do better 😔"}
                  {rating === 2 && "Thanks for letting us know 🤔"}
                  {rating === 3 && "Good, but room to grow 👍"}
                  {rating === 4 && "Great to hear! 🌟"}
                  {rating === 5 && "You're amazing! 🎉"}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <Separator className="opacity-40" />

          {/* Email input */}
          <div className="grid gap-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              Your Email
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

          {/* Message input */}
          <div className="grid gap-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              Tell Us More (Optional)
            </Label>
            <Textarea
              placeholder="What did you love? What could be better? We're all ears..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </div>

          {/* Submit Action */}
          <Button
            type="submit"
            size="brand"
            className="w-full mt-2"
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? (
              "Sending..."
            ) : (
              <>
                <PaperPlaneTilt size={16} weight="bold" />
                Send Feedback
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Tip footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center text-xs text-muted-foreground/60 font-semibold"
      >
        💡 Pro tip: Specific details help us coordinate exact product upgrades.
      </motion.p>
    </motion.div>
  );
}
