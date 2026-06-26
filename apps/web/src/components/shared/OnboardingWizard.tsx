"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding } from "@/hooks/useOnboarding";
import {
  GoogleLogo,
  MicrosoftOutlookLogo,
  CalendarBlank,
  Palette,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  X,
  Confetti,
  Sparkle
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/shared/Spinner";
import { toast } from "sonner";
import api, { BriefingStyle } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function OnboardingWizard() {
  const router = useRouter();
  const {
    user,
    currentStep,
    setCurrentStep,
    completeOnboarding,
    isEmailConnected,
    isCalendarConnected,
    refreshIntegrations,
    isLoading: loadingOnboarding,
  } = useOnboarding();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  // Step 3: Style
  const [styleName, setStyleName] = useState("Professional Summary");
  const [styleDesc, setStyleDesc] = useState("Concise and action-focused summaries");
  const [stylePrompt, setStylePrompt] = useState(
    "Summarize my emails in bullet points, highlighting clear action items and deadlines. Keep it highly professional."
  );
  const [styleCreated, setStyleCreated] = useState<BriefingStyle | null>(null);

  // Step 4: Schedule
  const [scheduleName, setScheduleName] = useState("Morning Briefing");
  const [deliveryTime, setDeliveryTime] = useState("08:00");
  const [voicePersona, setVoicePersona] = useState("NEWSROOM");
  const [createdStyles, setCreatedStyles] = useState<BriefingStyle[]>([]);
  const [selectedStyleId, setSelectedStyleId] = useState<string>("none");

  useEffect(() => {
    if (user && !user.onboardingComplete) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [user]);

  // Poll integrations every 4 seconds while on email/calendar steps so the wizard
  // detects newly-connected accounts without a full page reload.
  useEffect(() => {
    if (!isOpen) return;
    if (currentStep > 1) return; // only needed for email + calendar steps
    const interval = setInterval(() => {
      void refreshIntegrations();
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen, currentStep, refreshIntegrations]);

  // Load created styles when arriving at step 4
  useEffect(() => {
    if (currentStep === 3 && isOpen) {
      const loadStyles = async () => {
        try {
          const styles = await api.styles.getAll();
          setCreatedStyles(styles);
          if (styles.length > 0) {
            // Find default style or use first
            const def = styles.find((s) => s.isDefault) || styles[0];
            setSelectedStyleId(def.id);
          }
        } catch (err) {
          console.error("Failed to load styles in onboarding step 4", err);
        }
      };
      void loadStyles();
    }
  }, [currentStep, isOpen]);

  if (!isOpen || loadingOnboarding) return null;

  const handleNext = async () => {
    if (currentStep < 3) {
      await setCurrentStep(currentStep + 1);
    } else {
      await handleFinish();
    }
  };

  const handleBack = async () => {
    if (currentStep > 0) {
      await setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipAll = async () => {
    setLoading(true);
    try {
      await completeOnboarding();
      setIsOpen(false);
      toast.success("Welcome to InboxFM! Onboarding skipped.");
    } catch {
      toast.error("Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await completeOnboarding();
      setIsOpen(false);
      toast.success("Onboarding complete! Enjoy your briefings.");
      router.refresh();
    } catch {
      toast.error("Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectEmail = async (provider: "GMAIL" | "OUTLOOK") => {
    setLoading(true);
    try {
      if (provider === "GMAIL") {
        // Legacy flow redirects to Google OAuth
        const { ticket } = await api.auth.generateGoogleAuthTicket();
        // Save step index to return to step 1 (calendar) or stay at step 0 (email) after auth
        await api.users.updatePreferences({ onboardingStep: 0 });
        window.location.href = api.auth.googleAuthUrl(ticket);
      } else {
        const { ticket } = await api.integrations.initOAuth("outlook");
        await api.users.updatePreferences({ onboardingStep: 0 });
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        window.location.href = `${apiBase}/integrations/outlook/connect?ticket=${encodeURIComponent(ticket)}`;
      }
    } catch (err) {
      toast.error("Failed to start email connection");
      setLoading(false);
    }
  };

  const handleConnectCalendar = async () => {
    setLoading(true);
    try {
      // Connect Google Calendar uses google auth redirect
      const { ticket } = await api.auth.generateGoogleAuthTicket();
      await api.users.updatePreferences({ onboardingStep: 1 });
      window.location.href = api.auth.googleAuthUrl(ticket);
    } catch (err) {
      toast.error("Failed to start Google Calendar connection");
      setLoading(false);
    }
  };

  const handleCreateStyle = async () => {
    if (!styleName.trim() || !stylePrompt.trim()) {
      toast.error("Style Name and Voice Prompt are required");
      return;
    }
    setLoading(true);
    try {
      const style = await api.styles.create({
        name: styleName,
        description: styleDesc,
        prompt: stylePrompt,
        isDefault: true,
      });
      setStyleCreated(style);
      toast.success(`Briefing style "${styleName}" created!`);
      // Auto advance to schedule step
      await setCurrentStep(3);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create style";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    setLoading(true);
    try {
      await api.schedules.create({
        name: scheduleName,
        deliveryTime,
        voicePersona,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        emailsFrom: "last_delivery",
        styleId: selectedStyleId !== "none" ? selectedStyleId : null,
      });
      toast.success("First briefing schedule automated!");
      await handleFinish();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to automate briefing";
      toast.error(msg);
      setLoading(false);
    }
  };

  const steps = [
    { title: "Connect Email", desc: "Required to fetch emails" },
    { title: "Connect Calendar", desc: "Sync meeting action items" },
    { title: "Create Style", desc: "Customize summary instructions" },
    { title: "Automate Brief", desc: "Schedule delivery details" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
        className="relative w-full max-w-lg bg-[#FAF6F0] dark:bg-zinc-900 border-4 border-black dark:border-zinc-700 rounded-[var(--ds-radius-card)] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(39,39,42,1)] p-6 md:p-8 flex flex-col gap-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black/10 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border-2 border-black dark:border-zinc-700 flex items-center justify-center text-primary">
              <Sparkle className="w-4 h-4" weight="fill" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-black dark:text-white">Welcome to InboxFM</h2>
              <p className="text-xs text-zinc-500 font-medium">Let&apos;s set up your premium AI briefing engine</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleSkipAll}
            className="text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl"
            disabled={loading}
          >
            Skip All
          </Button>
        </div>

        {/* Steps Stepper */}
        <div className="flex items-center justify-between gap-1 text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isActive = idx === currentStep;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-full h-1.5 rounded-full border border-black/10 dark:border-white/5 transition-all duration-300",
                    isCompleted && "bg-emerald-500",
                    isActive && "bg-primary border-black dark:border-zinc-600",
                    !isCompleted && !isActive && "bg-zinc-200 dark:bg-zinc-800"
                  )}
                />
                <span
                  className={cn(
                    "text-[8px] md:text-[9px] line-clamp-1 mt-1",
                    isActive && "text-primary font-black",
                    isCompleted && "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="min-h-[260px] py-2">
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div
                key="step-email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
                    Step 1: Connect your Inbox
                  </h3>
                  <p className="text-xs text-zinc-500">
                    We read emails securely to synthesize your spoken summaries. Gmail or Outlook is supported.
                  </p>
                </div>

                {isEmailConnected ? (
                  <div className="p-5 border-2 border-emerald-500 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400 rounded-[var(--ds-radius-inner)] flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-500" weight="fill" />
                    <div>
                      <h4 className="text-xs font-black">Inbox Connected Successfully!</h4>
                      <p className="text-[10px] opacity-80">You are ready to receive digests from this email address.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => handleConnectEmail("GMAIL")}
                      className="h-12 border-2 border-black dark:border-zinc-600 bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 gap-3 text-black dark:text-white justify-start pl-5 rounded-[var(--ds-radius-inner)] font-black text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(39,39,42,1)]"
                      disabled={loading}
                    >
                      <GoogleLogo className="w-5 h-5 text-red-500" weight="fill" />
                      <span>Connect Gmail Account</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleConnectEmail("OUTLOOK")}
                      className="h-12 border-2 border-black dark:border-zinc-600 bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 gap-3 text-black dark:text-white justify-start pl-5 rounded-[var(--ds-radius-inner)] font-black text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(39,39,42,1)]"
                      disabled={loading}
                    >
                      <MicrosoftOutlookLogo className="w-5 h-5 text-blue-600" weight="fill" />
                      <span>Connect Outlook / Office 365</span>
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div
                key="step-calendar"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
                    Step 2: Connect Google Calendar (Optional)
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Sync extracted meetings and schedule standups directly from your daily audio briefs.
                  </p>
                </div>

                {isCalendarConnected ? (
                  <div className="p-5 border-2 border-emerald-500 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400 rounded-[var(--ds-radius-inner)] flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-500" weight="fill" />
                    <div>
                      <h4 className="text-xs font-black">Google Calendar Synced!</h4>
                      <p className="text-[10px] opacity-80">Meetings detected in emails can now be synced to your calendar.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={handleConnectCalendar}
                      className="h-12 w-full border-2 border-black dark:border-zinc-600 bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 gap-3 text-black dark:text-white justify-start pl-5 rounded-[var(--ds-radius-inner)] font-black text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(39,39,42,1)]"
                      disabled={loading}
                    >
                      <CalendarBlank className="w-5 h-5 text-blue-500" weight="fill" />
                      <span>Connect Google Calendar</span>
                    </Button>
                    <p className="text-[10px] text-zinc-500 text-center italic">
                      You can skip this step and connect it anytime under Settings.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step-style"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
                    Step 3: Define Summary Style (Optional)
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Describe how the AI should summarize your emails. This acts as instructions for the audio synthesis.
                  </p>
                </div>

                {styleCreated ? (
                  <div className="p-5 border-2 border-emerald-500 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400 rounded-[var(--ds-radius-inner)] flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-500" weight="fill" />
                    <div>
                      <h4 className="text-xs font-black">Style Profile Created: {styleCreated.name}</h4>
                      <p className="text-[10px] opacity-80">This style will be applied to your auto briefings.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pt-1">
                    <div className="grid gap-1.5">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                        Style Name
                      </Label>
                      <Input
                        value={styleName}
                        onChange={(e) => setStyleName(e.target.value)}
                        placeholder="e.g., Founder Digest"
                        className="font-bold h-10"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                        Voice prompt instructions
                      </Label>
                      <Textarea
                        value={stylePrompt}
                        onChange={(e) => setStylePrompt(e.target.value)}
                        placeholder="Explain exactly how the AI should structure summaries..."
                        className="min-h-[80px] text-xs font-medium resize-none leading-relaxed"
                      />
                    </div>
                    <Button
                      onClick={handleCreateStyle}
                      className="w-full border-2 border-black dark:border-zinc-700 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(39,39,42,1)]"
                      disabled={loading}
                    >
                      {loading ? <Spinner size={14} /> : "Create & Save Style"}
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step-schedule"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
                    Step 4: Automate your briefings (Optional)
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Set a time when you want to receive your audio daily briefing. It will be generated automatically.
                  </p>
                </div>

                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                        Delivery Time
                      </Label>
                      <Input
                        type="time"
                        value={deliveryTime}
                        onChange={(e) => setDeliveryTime(e.target.value)}
                        className="font-bold h-10"
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                        Voice Persona
                      </Label>
                      <Select value={voicePersona} onValueChange={setVoicePersona}>
                        <SelectTrigger className="font-bold h-10">
                          <SelectValue placeholder="Voice..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NEWSROOM">Newsroom (Anchor)</SelectItem>
                          <SelectItem value="FRIEND">Casual (Friendly)</SelectItem>
                          <SelectItem value="SPEEDSTER">Speedster (Concise)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-1.5">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                      Briefing Style
                    </Label>
                    <Select value={selectedStyleId} onValueChange={setSelectedStyleId}>
                      <SelectTrigger className="font-bold h-10">
                        <SelectValue placeholder="Default Style..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Default Voice Instructions</SelectItem>
                        {createdStyles.map((style) => (
                          <SelectItem key={style.id} value={style.id}>
                            {style.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleCreateSchedule}
                    className="w-full border-2 border-black dark:border-zinc-700 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(39,39,42,1)]"
                    disabled={loading}
                  >
                    {loading ? <Spinner size={14} /> : "Schedule Briefing automation"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t-2 border-black/10 dark:border-white/10 pt-4 mt-2">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || loading}
            className="gap-1 border-2 border-black dark:border-zinc-700 h-10 font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>

          {/* Skip or Next actions */}
          <div className="flex items-center gap-2">
            {/* Skip step button — hidden on step 0 (email required) and on completed steps */}
            {currentStep > 0 &&
            ((currentStep === 1 && !isCalendarConnected) ||
              (currentStep === 2 && !styleCreated) ||
              currentStep === 3) ? (
              <Button
                variant="ghost"
                onClick={handleNext}
                disabled={loading}
                className="font-bold h-10 text-zinc-500 hover:text-black dark:hover:text-white"
              >
                {currentStep === 3 ? "Skip & Finish" : "Skip Step"}
              </Button>
            ) : null}

            {/* Next button — shown when step is completed or on calendar/style steps after completion */}
            {(currentStep > 0 || isEmailConnected) &&
            !(currentStep === 3) ? (
              <Button
                onClick={handleNext}
                disabled={loading}
                className="gap-1.5 border-2 border-black dark:border-zinc-700 font-bold h-10"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
