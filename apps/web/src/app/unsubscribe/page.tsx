"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Warning, ArrowLeft, EnvelopeOpen, ShieldWarning, Sparkle, FloppyDisk } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/shared/Spinner";
import { Logo } from "@/components/shared/Logo";
import { toast } from "sonner";
import api from "@/lib/api";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [userType, setUserType] = useState<"waitlist" | "registered" | null>(null);
  const [email, setEmail] = useState("");

  // Registered User preferences
  const [subscribeDailyBrief, setSubscribeDailyBrief] = useState(true);
  const [subscribePromo, setSubscribePromo] = useState(true);
  const [subscribeAlerts, setSubscribeAlerts] = useState(true);

  // Waitlist User opt out
  const [optOutWaitlist, setOptOutWaitlist] = useState(false);

  // Policy agreements
  const [agreePolicy, setAgreePolicy] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("Invalid link. No access token was found.");
        setLoading(false);
        return;
      }

      try {
        const response = await api.auth.verifyUnsubscribeToken(token);
        if (response.success) {
          setUserType(response.type);
          setEmail(response.email);
          if (response.type === "registered" && response.preferences) {
            setSubscribeDailyBrief(response.preferences.subscribeDailyBrief);
            setSubscribePromo(response.preferences.subscribePromo);
            setSubscribeAlerts(response.preferences.subscribeAlerts);
          }
        } else {
          setError("Invalid or expired unsubscribe link.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load preferences.");
      } finally {
        setLoading(false);
      }
    };

    void verifyToken();
  }, [token]);

  const handleSavePreferences = async () => {
    if (!token) return;

    if (!agreePolicy) {
      toast.error("You must agree to our email and waitlist/privacy policies to update preferences.");
      return;
    }

    setSaving(true);
    try {
      if (userType === "waitlist") {
        if (!optOutWaitlist) {
          toast.error("Please confirm waitlist opt-out check to continue.");
          setSaving(false);
          return;
        }
        const response = await api.auth.updateEmailPreferences(token, {
          optOutWaitlist: true,
        });
        if (response.success) {
          setSuccess(true);
          setSuccessMessage(response.message || "Successfully opted out from the waitlist.");
          toast.success("Opted out successfully!");
        }
      } else {
        const response = await api.auth.updateEmailPreferences(token, {
          subscribeDailyBrief,
          subscribePromo,
          subscribeAlerts,
        });
        if (response.success) {
          setSuccess(true);
          setSuccessMessage("Your email subscription preferences have been updated.");
          toast.success("Preferences updated!");
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  const handleHardUnsubscribe = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const response = await api.auth.unsubscribe(token);
      if (response.success) {
        setSuccess(true);
        setSuccessMessage("You have been completely unsubscribed from all communication signals.");
        toast.success("Successfully unsubscribed!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unsubscription failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto border-2 border-black dark:border-zinc-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <Spinner size={32} className="text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-black tracking-tight text-foreground uppercase">Verifying Session</h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">Reading secure authentication token...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        key="error"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="py-6 space-y-6 w-full text-center"
      >
        <div className="w-16 h-16 rounded-full bg-destructive/10 border-2 border-destructive flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <Warning size={36} weight="fill" className="text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black tracking-tight text-foreground uppercase">Link Invalid</h2>
          <p className="text-sm text-destructive px-4 leading-relaxed font-medium">{error}</p>
        </div>

        <div className="pt-4 border-t-2 border-black dark:border-zinc-800 w-full">
          <Button variant="outline" className="w-full rounded-[var(--ds-radius-btn)] border-2 border-black font-bold shadow-[2px_2px_0px_0px_#000000] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_#000000]" onClick={() => router.push("/")}>
            <ArrowLeft size={16} weight="bold" className="mr-2" /> Back to Safety
          </Button>
        </div>
      </motion.div>
    );
  }

  if (success) {
    return (
      <motion.div
        key="success"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="py-6 space-y-6 w-full text-center"
      >
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <CheckCircle size={36} weight="fill" className="text-emerald-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black tracking-tight text-foreground uppercase">Console Updated</h2>
          <p className="text-sm text-muted-foreground leading-relaxed px-4">{successMessage}</p>
        </div>

        <div className="pt-4 border-t-2 border-black dark:border-zinc-800 w-full space-y-3">
          <Button size="brand" className="w-full" onClick={() => router.push("/")}>
            Return Home
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full space-y-6 text-left">
      <div className="space-y-2">
        <h2 className="text-2xl font-black tracking-tight text-foreground uppercase">
          {userType === "waitlist" ? "Waitlist Opt-Out" : "Preferences Console"}
        </h2>
        <p className="text-xs font-bold text-muted-foreground tracking-wide font-mono bg-muted/60 p-2 rounded-lg border border-black/10 dark:border-zinc-800/80 truncate">
          Target: {email}
        </p>
      </div>

      {userType === "waitlist" ? (
        // Waitlist User Settings View
        <div className="space-y-6">
          <div className="p-4 bg-amber-500/10 border-2 border-amber-500 rounded-[var(--ds-radius-inner)] space-y-2">
            <h4 className="font-bold text-sm text-amber-500 uppercase flex items-center gap-2">
              <ShieldWarning size={18} weight="fill" /> Spot Cancellation Warning
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Opting out will delete your wave position. You will not receive your access codes, invitations, or beta launch emails.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-muted/40 rounded-xl border border-black/5 dark:border-zinc-800">
              <Checkbox
                id="optOut"
                checked={optOutWaitlist}
                onCheckedChange={(checked) => setOptOutWaitlist(checked === true)}
                className="mt-1"
              />
              <div className="grid gap-1.5 leading-none">
                <label htmlFor="optOut" className="text-sm font-bold text-foreground cursor-pointer">
                  Cancel Waitlist Registration
                </label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Remove my email from the waitlist queue and stop sending updates.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3">
              <Checkbox
                id="policy"
                checked={agreePolicy}
                onCheckedChange={(checked) => setAgreePolicy(checked === true)}
                className="mt-0.5"
              />
              <div className="grid gap-1.5 leading-none">
                <label htmlFor="policy" className="text-xs font-bold text-muted-foreground cursor-pointer">
                  I agree to the <Link href="/waitlist-policy" target="_blank" className="text-primary hover:underline font-extrabold">Waitlist Policy</Link> and <Link href="/email-policy" target="_blank" className="text-primary hover:underline font-extrabold">Email Policy</Link>.
                </label>
              </div>
            </div>
          </div>

          <Button
            size="brand"
            className="w-full"
            disabled={saving || !optOutWaitlist || !agreePolicy}
            onClick={handleSavePreferences}
          >
            {saving ? "Processing..." : "Confirm Waitlist Opt-Out"}
          </Button>
        </div>
      ) : (
        // Registered User Preferences View
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Inbox FM is built by **VedLabs**. Customize the notifications signals you want delivered to your mailbox:
          </p>

          <div className="space-y-3">
            {/* 1. Daily Spoken Digests */}
            <div className="flex items-start space-x-3 p-4 bg-muted/30 border border-black/5 dark:border-zinc-800 rounded-xl">
              <Checkbox
                id="briefs"
                checked={subscribeDailyBrief}
                onCheckedChange={(checked) => setSubscribeDailyBrief(checked === true)}
                className="mt-1"
              />
              <div className="grid gap-1.5 leading-none">
                <label htmlFor="briefs" className="text-sm font-black text-foreground cursor-pointer flex items-center gap-1.5">
                  <EnvelopeOpen size={16} className="text-primary" /> Daily Spoken Digests
                </label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Morning and Evening summaries of your inbox. Turning this off stops your daily schedules.
                </p>
              </div>
            </div>

            {/* 2. Outreach & Announcements */}
            <div className="flex items-start space-x-3 p-4 bg-muted/30 border border-black/5 dark:border-zinc-800 rounded-xl">
              <Checkbox
                id="promo"
                checked={subscribePromo}
                onCheckedChange={(checked) => setSubscribePromo(checked === true)}
                className="mt-1"
              />
              <div className="grid gap-1.5 leading-none">
                <label htmlFor="promo" className="text-sm font-black text-foreground cursor-pointer flex items-center gap-1.5">
                  <Sparkle size={16} className="text-primary" /> Product Updates & Outreach
                </label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Announcements, new feature release changelogs, and team news broadcasts.
                </p>
              </div>
            </div>

            {/* 3. System & Security Alerts */}
            <div className="flex items-start space-x-3 p-4 bg-muted/30 border border-black/5 dark:border-zinc-800 rounded-xl">
              <Checkbox
                id="alerts"
                checked={subscribeAlerts}
                onCheckedChange={(checked) => setSubscribeAlerts(checked === true)}
                className="mt-1"
              />
              <div className="grid gap-1.5 leading-none">
                <label htmlFor="alerts" className="text-sm font-black text-foreground cursor-pointer flex items-center gap-1.5">
                  <ShieldWarning size={16} className="text-primary" /> Security & System Alerts
                </label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Device logins, password resets, Google sync warnings, and key status updates.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-2">
            <Checkbox
              id="policyReg"
              checked={agreePolicy}
              onCheckedChange={(checked) => setAgreePolicy(checked === true)}
              className="mt-0.5"
            />
            <div className="grid gap-1.5 leading-none">
              <label htmlFor="policyReg" className="text-xs font-bold text-muted-foreground cursor-pointer">
                I agree to the <Link href="/email-policy" target="_blank" className="text-primary hover:underline font-extrabold">Email Policy</Link> and <Link href="/privacy" target="_blank" className="text-primary hover:underline font-extrabold">Privacy Policy</Link>.
              </label>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              size="brand"
              className="w-full flex items-center justify-center gap-2"
              disabled={saving || !agreePolicy}
              onClick={handleSavePreferences}
            >
              <FloppyDisk size={18} weight="bold" />
              {saving ? "Saving Changes..." : "Save Preferences"}
            </Button>

            <Button
              variant="outline"
              className="w-full border-2 border-black font-bold dark:border-zinc-800 text-xs uppercase tracking-wider h-11"
              disabled={saving}
              onClick={handleHardUnsubscribe}
            >
              Deactivate All Mails (Hard Unsubscribe)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <main className="min-h-dvh flex items-center justify-center bg-background spotlight-bg grain-bg selection:bg-brand-orange/30 selection:text-white p-6">
      <div className="w-full max-w-md mx-auto z-10 space-y-8">
        {/* Brand Header */}
        <div className="flex justify-center">
          <Link href="/" className="group transition-transform duration-300 hover:scale-105 active:scale-95">
            <Logo size="default" />
          </Link>
        </div>

        <Card className="border-2 border-black dark:border-zinc-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.06)] bg-[#FAF6F0] dark:bg-[#161519] rounded-[var(--ds-radius-card)] overflow-hidden">
          <CardContent className="p-8">
            <Suspense fallback={
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <Spinner size={36} className="text-primary" />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Loading Console</p>
              </div>
            }>
              <UnsubscribeContent />
            </Suspense>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
            Inbox FM is built by <a href="https://vedlabs.tech" target="_blank" className="hover:underline font-bold text-muted-foreground/60">VedLabs</a>. Anand, Gujarat, India.
          </p>
        </div>
      </div>
    </main>
  );
}
