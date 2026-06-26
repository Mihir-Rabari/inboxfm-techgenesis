"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ScheduleCard } from "@/components/summaries/ScheduleCard";
import { Button } from "@/components/ui/button";
import {
  Plus,
  MagicWand,
  SpeakerHigh,
  X,
  Checks,
} from "@phosphor-icons/react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { Spinner } from "@/components/shared/Spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import api, { Schedule, BriefingStyle } from "@/lib/api";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useConfigWarnings } from "@/hooks/useConfigWarnings";
import { ConfigWarningBanner } from "@/components/shared/ConfigWarningBanner";

export default function SummariesPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { warnings } = useConfigWarnings();
  const noStyleWarning = warnings.find((w) => w.id === "no-style");

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [showProTip, setShowProTip] = useState(false);
  const [deletingScheduleId, setDeletingScheduleId] = useState<string | null>(null);

  // Form state
  const [scheduleName, setScheduleName] = useState("Morning Summary");
  const [scheduledTime, setScheduledTime] = useState("08:00");
  const [voicePersona, setVoicePersona] = useState("NEWSROOM");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [emailsFrom, setEmailsFrom] = useState("last_delivery");
  const [briefingStyles, setBriefingStyles] = useState<BriefingStyle[]>([]);
  const [styleId, setStyleId] = useState<string>("none");
  const [includeGmail, setIncludeGmail] = useState(true);
  const [includeOutlook, setIncludeOutlook] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schedulesData, stylesData] = await Promise.all([
          api.schedules.getAll(),
          api.styles.getAll(),
        ]);
        setSchedules(schedulesData);
        setBriefingStyles(stylesData);

        // Show Pro Tip only if user has 0 or 1 schedule AND hasn't dismissed it
        const dismissed = localStorage.getItem("dismiss_pro_tip") === "true";
        if (schedulesData.length <= 1 && !dismissed) {
          setShowProTip(true);
        }
      } catch {
        toast.error("Failed to load schedules data");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleCreateSchedule = async () => {
    setIsCreating(true);
    try {
      await api.schedules.create({
        name: scheduleName,
        deliveryTime: scheduledTime,
        voicePersona,
        timezone,
        emailsFrom,
        styleId: styleId && styleId !== "none" ? styleId : null,
        includeGmail,
        includeOutlook,
      });
      // Fetch schedules again to get populated style relations
      const updatedSchedules = await api.schedules.getAll();
      setSchedules(updatedSchedules);
      toast.success("Schedule created!");
      setIsDialogOpen(false);
      resetForm();

      // Hide pro tip if they now have 2+ schedules
      if (updatedSchedules.length >= 2) {
        setShowProTip(false);
      }
    } catch (err) {
      console.error("Create schedule error:", err);
      const msg = err instanceof Error ? err.message : "Failed to create schedule";
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateSchedule = async () => {
    if (!editingSchedule) return;
    setIsCreating(true);
    try {
      await api.schedules.update(editingSchedule.id, {
        name: scheduleName,
        deliveryTime: scheduledTime,
        voicePersona,
        timezone,
        emailsFrom,
        styleId: styleId && styleId !== "none" ? styleId : null,
        includeGmail,
        includeOutlook,
      });
      // Fetch schedules again to get populated style relations
      const updatedSchedules = await api.schedules.getAll();
      setSchedules(updatedSchedules);
      toast.success("Schedule updated!");
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      console.error("Update schedule error:", err);
      const msg = err instanceof Error ? err.message : "Failed to update schedule";
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setScheduleName(schedule.name);
    setScheduledTime(schedule.deliveryTime);
    setVoicePersona(schedule.voicePersona);
    setTimezone(schedule.timezone);
    setEmailsFrom(schedule.emailsFrom);
    setStyleId(schedule.styleId || "none");
    setIncludeGmail(schedule.includeGmail !== false);
    setIncludeOutlook(schedule.includeOutlook !== false);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setScheduleName("Morning Summary");
    setScheduledTime("08:00");
    setVoicePersona("NEWSROOM");
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    setEmailsFrom("last_delivery");
    setStyleId("none");
    setIncludeGmail(true);
    setIncludeOutlook(true);
    setEditingSchedule(null);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const updated = await api.schedules.toggle(id);
      setSchedules((prev) => prev.map((s) => (s.id === id ? updated : s)));
      toast.success(
        updated.isActive ? "Schedule activated" : "Schedule paused",
      );
    } catch {
      toast.error("Failed to toggle schedule");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.schedules.delete(id);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      toast.success("Schedule deleted");
    } catch {
      toast.error("Failed to delete schedule");
    }
  };

  const dismissProTip = () => {
    setShowProTip(false);
    localStorage.setItem("dismiss_pro_tip", "true");
  };

  const activeCount = schedules.filter((s) => s.isActive).length;

  if (authLoading || isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="max-w-3xl mx-auto pb-32 space-y-10"
    >
      {/* Header Section */}
      <PageHeader
        title="Summaries"
        description="Your automated audio briefings, delivered daily."
        action={
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button size="brand" className="gap-2 shadow-[var(--ds-shadow-primary)]">
                <Plus size={18} weight="bold" className="group-hover:rotate-90 transition-transform" />
                New Schedule
              </Button>
            </DialogTrigger>
          <DialogContent size="default">
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? "Edit Schedule" : "Create Schedule"}
              </DialogTitle>
              <DialogDescription>
                {editingSchedule
                  ? "Update your briefing preferences."
                  : "When should we prepare your briefing?"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-5 py-4 pr-1">
              {/* Schedule Name */}
              <div className="grid gap-2">
                <Label
                  htmlFor="name"
                  className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/75 ml-1"
                >
                  Schedule Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                  placeholder="e.g., Morning Digest"
                  className="font-bold"
                />
              </div>

              {/* Delivery Time & Timezone Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Delivery Time */}
                <div className="grid gap-2">
                  <Label
                    htmlFor="time"
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/75 ml-1"
                  >
                    Delivery Time
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    placeholder="08:00"
                    className="font-bold"
                  />
                </div>

                {/* Timezone */}
                <div className="grid gap-2">
                  <Label
                    htmlFor="timezone"
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/75 ml-1"
                  >
                    Timezone
                  </Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="font-bold">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem
                        value="Asia/Kolkata"
                      >
                        🇮🇳 India (IST)
                      </SelectItem>
                      <SelectItem
                        value="America/New_York"
                      >
                        🇺🇸 New York (EST)
                      </SelectItem>
                      <SelectItem
                        value="America/Chicago"
                      >
                        🇺🇸 Chicago (CST)
                      </SelectItem>
                      <SelectItem
                        value="America/Denver"
                      >
                        🇺🇸 Denver (MST)
                      </SelectItem>
                      <SelectItem
                        value="America/Los_Angeles"
                      >
                        🇺🇸 Los Angeles (PST)
                      </SelectItem>
                      <SelectItem
                        value="Europe/London"
                      >
                        🇬🇧 London (GMT)
                      </SelectItem>
                      <SelectItem
                        value="Europe/Paris"
                      >
                        🇫🇷 Paris (CET)
                      </SelectItem>
                      <SelectItem value="Asia/Tokyo">
                        🇯🇵 Tokyo (JST)
                      </SelectItem>
                      <SelectItem
                        value="Asia/Singapore"
                      >
                        🇸🇬 Singapore (SGT)
                      </SelectItem>
                      <SelectItem
                        value="Australia/Sydney"
                      >
                        🇦🇺 Sydney (AEDT)
                      </SelectItem>
                      <SelectItem value="UTC">
                        🌍 UTC
                      </SelectItem>
                      {/* Fallback for detected timezone if not in list */}
                      {![
                        "Asia/Kolkata",
                        "America/New_York",
                        "America/Chicago",
                        "America/Denver",
                        "America/Los_Angeles",
                        "Europe/London",
                        "Europe/Paris",
                        "Asia/Tokyo",
                        "Asia/Singapore",
                        "Australia/Sydney",
                        "UTC",
                      ].includes(timezone) && (
                        <SelectItem
                          value={timezone}
                          className="font-bold text-primary"
                        >
                          📍 {timezone} (Detected)
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Voice Persona & Emails From Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Voice Persona */}
                <div className="grid gap-2">
                  <Label
                    htmlFor="voice"
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/75 ml-1"
                  >
                    Voice Persona
                  </Label>
                  <Select value={voicePersona} onValueChange={setVoicePersona}>
                    <SelectTrigger className="font-bold">
                      <SelectValue placeholder="Select voice" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEWSROOM">
                        <span className="flex items-center gap-2 font-bold">
                          <SpeakerHigh
                            size={18}
                            weight="fill"
                            className="text-primary"
                          />{" "}
                          Newsroom (Pro)
                        </span>
                      </SelectItem>
                      <SelectItem value="FRIEND">
                        <span className="flex items-center gap-2 font-bold">
                          <MagicWand
                            size={18}
                            weight="fill"
                            className="text-orange-500"
                          />{" "}
                          Casual (Friendly)
                        </span>
                      </SelectItem>
                      <SelectItem value="SPEEDSTER">
                        <span className="flex items-center gap-2 font-bold">
                          <MagicWand
                            size={18}
                            weight="fill"
                            className="text-blue-500"
                          />{" "}
                          Speedster (Fast)
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Emails From */}
                <div className="grid gap-2">
                  <Label
                    htmlFor="emailsFrom"
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/75 ml-1"
                  >
                    Include Emails From
                  </Label>
                  <Select value={emailsFrom} onValueChange={setEmailsFrom}>
                    <SelectTrigger className="font-bold">
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        value="last_delivery"
                      >
                        Since Last Delivery
                      </SelectItem>
                      <SelectItem value="last_24h">
                        Last 24 Hours
                      </SelectItem>
                      <SelectItem value="last_12h">
                        Last 12 Hours
                      </SelectItem>
                      <SelectItem value="last_6h">
                        Last 6 Hours
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Briefing Style Select */}
              <div className="grid gap-2">
                <Label
                  htmlFor="styleId"
                  className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/75 ml-1"
                >
                  Briefing Style
                </Label>
                {briefingStyles.length > 0 ? (
                  <Select value={styleId} onValueChange={setStyleId}>
                    <SelectTrigger className="font-bold">
                      <SelectValue placeholder="Select a briefing style..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="font-medium text-muted-foreground">Default Voice Instructions</span>
                      </SelectItem>
                      {briefingStyles.map((style) => (
                        <SelectItem key={style.id} value={style.id}>
                          <span className="font-bold">{style.name}</span>
                          {style.isDefault && " (Default)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-xs text-muted-foreground p-3 border border-dashed border-black/10 dark:border-white/10 rounded-lg flex flex-col gap-1.5">
                    <span>No custom briefing styles found.</span>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => {
                        setIsDialogOpen(false);
                        router.push("/styles");
                      }}
                      className="p-0 h-auto font-black text-primary justify-start"
                    >
                      Create your first briefing style →
                    </Button>
                  </div>
                )}
                 <p className="text-xs text-muted-foreground italic ml-1">
                  Choose the briefing style prompt to use for this schedule.
                </p>
              </div>

              {/* Enabled Integrations */}
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/75 ml-1">
                  Enabled Integrations
                </Label>
                <div className="flex flex-col gap-2.5 p-3 bg-muted/30 border border-border/40 rounded-[var(--ds-radius-inner)]">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeGmail}
                      onChange={(e) => setIncludeGmail(e.target.checked)}
                      className="w-4 h-4 rounded border border-border text-primary focus:ring-primary focus:ring-offset-background"
                    />
                    <div className="text-xs font-bold text-foreground">
                      Gmail & Google Calendar
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeOutlook}
                      onChange={(e) => setIncludeOutlook(e.target.checked)}
                      className="w-4 h-4 rounded border border-border text-primary focus:ring-primary focus:ring-offset-background"
                    />
                    <div className="text-xs font-bold text-foreground">
                      Outlook Mail & Calendar
                    </div>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground italic ml-1">
                  Choose which connected accounts contribute emails to this briefing.
                </p>
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button
                onClick={editingSchedule ? handleUpdateSchedule : handleCreateSchedule}
                size="brand"
                className="w-full"
                disabled={isCreating}
              >
                {isCreating ? (
                  <><Spinner size={18} /> {editingSchedule ? "Updating..." : "Creating..."}</>
                ) : (
                  editingSchedule ? "Save Changes" : "Start Automation"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        }
      />

      {/* Warnings */}
      {noStyleWarning && (
        <ConfigWarningBanner
          type={noStyleWarning.type}
          message={noStyleWarning.message}
          action={noStyleWarning.action}
          dismissable={false}
        />
      )}

      {/* Status Strip */}
      {schedules.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 text-xs font-black tracking-widest uppercase text-muted-foreground/60"
        >
          <div className="flex items-center gap-2 bg-muted/20 dark:bg-muted/10 px-3 py-1.5 rounded-[var(--ds-radius-pill)] border-2 border-black dark:border-zinc-700">
            <span
              className={`w-2 h-2 rounded-full ${activeCount > 0 ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-muted-foreground/30"}`}
            />
            {activeCount} Running Today
          </div>
          {activeCount > 0 && (
            <div className="flex items-center gap-2">
              <Checks size={16} className="text-primary" weight="bold" />
              Next brief sync in progress
            </div>
          )}
        </motion.div>
      )}

      {/* Pro Tip - Smart UI */}
      <AnimatePresence>
        {showProTip && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-primary/[0.03] border-2 border-primary/30 px-5 py-4 rounded-[var(--ds-radius-card)] flex items-center justify-between group relative">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-[var(--ds-radius-inner)] flex items-center justify-center text-primary">
                  <MagicWand size={20} weight="fill" />
                </div>
                <div>
                  <p className="text-sm font-black text-primary/80 mb-0.5">
                    Pro Tip: Multi-Briefing
                  </p>
                  <p className="text-xs font-medium text-muted-foreground max-w-md italic">
                    Create multiple schedules for different vibes—Newsroom at
                    8AM for work, and Casual at 6PM for relaxation.
                  </p>
                </div>
              </div>
              <button
                onClick={dismissProTip}
                className="p-2 text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
              >
                <X size={20} weight="bold" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedules Grid */}
      <main>
        {schedules.length > 0 ? (
          <div className="grid gap-4">
            {schedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={{
                  id: schedule.id,
                  name: schedule.name,
                  time: schedule.deliveryTime,
                  days: "Every Day",
                  voice: schedule.voicePersona,
                  active: schedule.isActive,
                  styleName: schedule.style?.name,
                }}
                onToggle={() => handleToggle(schedule.id)}
                onDelete={() => setDeletingScheduleId(schedule.id)}
                onEdit={() => handleEdit(schedule)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            variant="minimal"
            icon={<Plus size={36} weight="bold" />}
            title={
              <h3 className="text-xl md:text-2xl font-black tracking-tight mb-2">
                Silence is golden, <span className="font-serif italic font-light text-brand-orange">but audio is better.</span>
              </h3>
            }
            description="Create your first schedule to start receiving personalized audio summaries."
            action={
              <Button
                size="brand"
                className="shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.06)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                onClick={() => setIsDialogOpen(true)}
              >
                Create First Schedule
              </Button>
            }
          />
        )}
      </main>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deletingScheduleId}
        onOpenChange={(open) => !open && setDeletingScheduleId(null)}
        title="Delete this schedule?"
        description="All delivery history for this schedule will be permanently removed."
        confirmLabel="Yes, delete"
        variant="destructive"
        onConfirm={async () => {
          if (deletingScheduleId) {
            await handleDelete(deletingScheduleId);
          }
        }}
      />
    </motion.div>
  );
}
