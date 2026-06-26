"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/shared/Spinner";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Separator } from "@/components/ui/separator";
import {
  Trash,
  Plus,
  FunnelSimple,
  CalendarBlank,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import api, { SenderPreference, SenderPriority } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const priorityOptions: SenderPriority[] = [
  "CRITICAL",
  "HIGH",
  "NORMAL",
  "LOW",
  "IGNORE",
];

export default function SettingsPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<SenderPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);

  const [senderEmail, setSenderEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [priority, setPriority] = useState<SenderPriority>("NORMAL");
  const [alwaysInclude, setAlwaysInclude] = useState(false);
  const [neverInclude, setNeverInclude] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.users.getSenderPreferences();
        setItems(data);
      } catch {
        toast.error("Failed to load sender preferences");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      void load();
    }
  }, [isAuthenticated]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.alwaysInclude !== b.alwaysInclude) return a.alwaysInclude ? -1 : 1;
      if (a.neverInclude !== b.neverInclude) return a.neverInclude ? -1 : 1;
      return a.senderEmail.localeCompare(b.senderEmail);
    });
  }, [items]);

  const resetForm = () => {
    setSenderEmail("");
    setSenderName("");
    setPriority("NORMAL");
    setAlwaysInclude(false);
    setNeverInclude(false);
  };

  const handleUpsert = async () => {
    if (!senderEmail.trim()) {
      toast.error("Sender email is required");
      return;
    }

    if (alwaysInclude && neverInclude) {
      toast.error("A sender cannot be both always include and never include");
      return;
    }

    setSaving(true);
    try {
      const saved = await api.users.upsertSenderPreference({
        senderEmail: senderEmail.trim(),
        senderName: senderName.trim() || undefined,
        priority,
        alwaysInclude,
        neverInclude,
      });

      setItems((prev) => {
        const idx = prev.findIndex((x) => x.senderEmail === saved.senderEmail);
        if (idx === -1) return [saved, ...prev];
        const next = [...prev];
        next[idx] = saved;
        return next;
      });

      toast.success("Sender preference saved");
      resetForm();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save preference",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (email: string) => {
    setRemovingEmail(email);
    try {
      await api.users.deleteSenderPreference(email);
      setItems((prev) => prev.filter((x) => x.senderEmail !== email));
      toast.success("Sender preference removed");
    } catch {
      toast.error("Failed to remove sender preference");
    } finally {
      setRemovingEmail(null);
    }
  };

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="max-w-4xl mx-auto space-y-8 pb-24"
    >
      <PageHeader
        title="Sender Settings"
        description="Control sender-level rules used during brief generation."
      />

      <SectionCard
        icon={<CalendarBlank size={22} weight="fill" />}
        title="Schedule Settings"
        description="Manage delivery times, voice personas, and active summaries directly from your briefing center."
        action={
          <Button
            variant="secondary"
            onClick={() => router.push("/summaries")}
          >
            Open Summaries
          </Button>
        }
        hoverable
      >
        <div />
      </SectionCard>

      <SectionCard
        icon={<FunnelSimple size={22} weight="fill" />}
        title="Add sender rule"
        description="Configure sorting metrics and filters for target emails."
        hoverable
      >

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="senderEmail"
              className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1"
            >
              Sender Email
            </Label>
            <Input
              id="senderEmail"
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="e.g. founder@company.com"
              className="font-bold px-4 transition-all"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="senderName"
              className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1"
            >
              Sender Name (Optional)
            </Label>
            <Input
              id="senderName"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="e.g. Product Team"
              className="font-bold"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
              Priority Boost
            </Label>
            <Select
              value={priority}
              onValueChange={(value) => setPriority(value as SenderPriority)}
            >
              <SelectTrigger className="font-bold">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((opt) => (
                  <SelectItem key={opt} value={opt} className="font-bold">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 rounded-[var(--ds-radius-inner)] border-2 border-black dark:border-zinc-700 bg-muted/20 dark:bg-muted/10 p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-black uppercase tracking-wider text-foreground">
                  Always include sender
                </Label>
                <p className="text-[10px] text-muted-foreground/75 leading-normal">
                  Generate briefings for this sender regardless of standard timing locks.
                </p>
              </div>
              <Switch
                checked={alwaysInclude}
                onCheckedChange={(v) => {
                  setAlwaysInclude(v);
                  if (v) setNeverInclude(false);
                }}
                className="data-[state=checked]:bg-primary"
              />
            </div>
            <Separator className="opacity-40" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-black uppercase tracking-wider text-foreground">
                  Never include sender
                </Label>
                <p className="text-[10px] text-muted-foreground/75 leading-normal">
                  Exclude this sender&apos;s emails completely from summary streams.
                </p>
              </div>
              <Switch
                checked={neverInclude}
                onCheckedChange={(v) => {
                  setNeverInclude(v);
                  if (v) setAlwaysInclude(false);
                }}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={() => void handleUpsert()}
            disabled={saving}
            size="brand"
          >
            {saving ? <><Spinner size={14} /> Saving...</> : <><Plus size={16} weight="bold" /> Save Rule</>}
          </Button>
          <Button variant="outline" onClick={resetForm}>
            Reset
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        icon={<FunnelSimple size={22} weight="fill" />}
        title="Sender preferences"
        description="Active rules applied during AI digest calculations."
        action={
          sortedItems.length > 0 ? (
            <StatusBadge label={`${sortedItems.length} ${sortedItems.length === 1 ? "Rule" : "Rules"}`} priority="NORMAL" />
          ) : undefined
        }
      >
        {sortedItems.length === 0 ? (
          <EmptyState
            icon={<FunnelSimple size={28} weight="duotone" />}
            title="No sender rules added yet"
            description="Rules allow you to bypass standard sorting and filter specific priorities."
            size="sm"
          />
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {sortedItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.98 }}
                  transition={{
                    duration: 0.35,
                    ease: [0.23, 1, 0.32, 1],
                  }}
                  className="rounded-[var(--ds-radius-inner)] border-2 border-black dark:border-zinc-700 bg-card p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all duration-300 shadow-[var(--ds-shadow-primary)] hover:shadow-[var(--ds-shadow-hover)] hover:-translate-x-[1px] hover:-translate-y-[1px]"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <p className="text-sm font-black text-foreground">
                        {item.senderName || item.senderEmail}
                      </p>
                      {item.senderName && (
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted/65 px-2.5 py-0.5 rounded-md border border-muted-foreground/10">
                          {item.senderEmail}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge priority={item.priority as "CRITICAL" | "HIGH" | "NORMAL" | "LOW" | "IGNORE"} />
                      {item.alwaysInclude && (
                        <StatusBadge
                          label="Always include"
                          scheduleStatus="active"
                        />
                      )}
                      {item.neverInclude && (
                        <StatusBadge
                          label="Never include"
                          status="FAILED"
                        />
                      )}
                    </div>
                  </div>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => void handleDelete(item.senderEmail)}
                    disabled={removingEmail === item.senderEmail}
                    className="shrink-0 self-end md:self-center"
                  >
                    {removingEmail === item.senderEmail ? (
                      <><Spinner size={14} /> Removing...</>
                    ) : (
                      <><Trash size={14} weight="bold" /> Remove</>
                    )}
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </SectionCard>
    </motion.div>
  );
}
