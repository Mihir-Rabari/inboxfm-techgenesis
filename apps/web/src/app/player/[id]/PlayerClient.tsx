"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ArrowLeft,
  CalendarPlus,
  Bell,
  VideoCamera,
  Clock,
  Sparkle,
  ListChecks,
  CheckCircle,
} from "@phosphor-icons/react";
import { Spinner } from "@/components/shared/Spinner";
import { Markdown } from "@/components/shared/Markdown";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import api, { BriefActionHistoryEntry } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BriefActionState {
  id: string;
  sourceId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
}

interface Brief {
  id: string;
  date: string;
  textSummary: string;
  audioUrl: string | null;
  audioDuration: number | null;
  emailsProcessed: number;
  status: string;
  actions?: BriefActionState[];
  summarySchedule?: {
    name: string;
    deliveryTime: string;
    timezone: string;
    voicePersona: string;
    customPrompt?: string | null;
  } | null;
}

type ActionType = "event" | "reminder" | "meeting" | "task";

interface ActionItem {
  id: string;
  type: ActionType;
  title: string;
  details: string;
  dateLabel?: string;
  calendarUrl?: string;
  secondaryUrl?: string;
  startsAt?: string;
  endsAt?: string | null;
  allDay?: boolean;
  participants?: string[];
}

interface StructuredCalendarEvent {
  title?: string;
  details?: string;
  sender?: string;
  startsAt?: string;
  endsAt?: string | null;
  allDay?: boolean;
  kind?: "meeting" | "deadline" | "event";
}

interface StructuredSummary {
  calendarEvents?: StructuredCalendarEvent[];
}

function formatGoogleDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function buildCalendarUrl({
  title,
  details,
  start,
  end,
  location,
}: {
  title: string;
  details: string;
  start: Date;
  end: Date;
  location?: string;
}) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details,
    dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`,
  });

  if (location) params.set("location", location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function extractStructuredSummary(
  textSummary: string,
): StructuredSummary | null {
  const marker = "__INBOXFM_STRUCTURED_JSON__";
  if (!textSummary?.startsWith(marker)) return null;
  const newlineIdx = textSummary.indexOf("\n");
  const jsonText =
    newlineIdx === -1
      ? textSummary.slice(marker.length)
      : textSummary.slice(marker.length, newlineIdx);
  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

function stripStructuredMarker(textSummary: string): string {
  const marker = "__INBOXFM_STRUCTURED_JSON__";
  if (!textSummary?.startsWith(marker)) return textSummary;
  const newlineIdx = textSummary.indexOf("\n");
  return newlineIdx === -1 ? "" : textSummary.slice(newlineIdx + 1);
}

function parseActionItems(
  textSummary: string,
  briefDate: string,
): ActionItem[] {
  if (!textSummary?.trim()) return [];

  const structured = extractStructuredSummary(textSummary);
  if (!structured || !Array.isArray(structured.calendarEvents)) {
    // Strict mode: only trust backend structured calendar events.
    return [];
  }

  return structured.calendarEvents
    .map((ev: StructuredCalendarEvent, idx: number) => {
      const start = ev?.startsAt
        ? new Date(ev.startsAt)
        : new Date(briefDate || Date.now());
      if (Number.isNaN(start.getTime())) return null;

      const end = ev?.endsAt
        ? new Date(ev.endsAt)
        : new Date(start.getTime() + 30 * 60 * 1000);

      const type: ActionType =
        ev?.kind === "meeting"
          ? "meeting"
          : ev?.kind === "event"
            ? "event"
            : "reminder";

      const title =
        ev?.title ||
        (type === "meeting"
          ? "Meeting"
          : type === "event"
            ? "Calendar event"
            : "Deadline reminder");

      return {
        id: `ev-${idx + 1}`,
        type,
        title,
        details: ev?.details || "",
        dateLabel: start.toLocaleString(),
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        allDay: !!ev?.allDay,
        participants: [],
        calendarUrl: buildCalendarUrl({
          title: `${title} from InboxFM`,
          details: ev?.details || "",
          start,
          end,
          location: type === "meeting" ? "Google Meet" : undefined,
        }),
        secondaryUrl:
          type === "meeting" ? "https://meet.google.com/new" : undefined,
      } as ActionItem;
    })
    .filter((x): x is ActionItem => x !== null);
}

export default function PlayerClient({ id }: { id: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [completedActionIds, setCompletedActionIds] = useState<string[]>([]);
  const [processingActionIds, setProcessingActionIds] = useState<string[]>([]);
  const [actionHistoryBySourceId, setActionHistoryBySourceId] = useState<
    Record<string, BriefActionHistoryEntry>
  >({});
  const [isLoadingActionHistory, setIsLoadingActionHistory] = useState(false);

  const fetchBrief = useCallback(async () => {
    try {
      setError(null);
      const data = await api.briefs.getById(id);
      setBrief(data);
    } catch (err) {
      console.error("Failed to fetch brief:", err);
      setError(err instanceof Error ? err.message : "Failed to load brief");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchBrief();
  }, [id, fetchBrief]);

  const loadActionHistory = useCallback(async (briefId: string) => {
    setIsLoadingActionHistory(true);
    try {
      const response = await api.briefs.getActionHistory(briefId);
      const map = response.history.reduce(
        (acc, row) => {
          acc[row.sourceId] = row;
          return acc;
        },
        {} as Record<string, BriefActionHistoryEntry>,
      );
      setActionHistoryBySourceId(map);
    } catch {
      setActionHistoryBySourceId({});
    } finally {
      setIsLoadingActionHistory(false);
    }
  }, []);

  useEffect(() => {
    if (!brief?.id) {
      setActionHistoryBySourceId({});
      setIsLoadingActionHistory(false);
      return;
    }

    void loadActionHistory(brief.id);
  }, [brief?.id, loadActionHistory]);

  const actionItems = useMemo(() => {
    if (!brief) return [];
    return parseActionItems(brief.textSummary, brief.date);
  }, [brief]);

  const auditSummaryText = useMemo(() => {
    if (!brief) return "";
    return (
      stripStructuredMarker(brief.textSummary) ||
      "No summary available for this brief."
    );
  }, [brief]);

  useEffect(() => {
    const completedFromBrief = (brief?.actions || [])
      .filter((action) => action.status === "COMPLETED")
      .map((action) => action.sourceId);

    const completedFromHistory = Object.values(actionHistoryBySourceId)
      .filter((action) => action.status === "COMPLETED")
      .map((action) => action.sourceId);

    const merged = Array.from(
      new Set([...completedFromBrief, ...completedFromHistory]),
    );

    setCompletedActionIds(merged);
  }, [brief?.actions, actionHistoryBySourceId]);

  const orderedActionItems = useMemo(() => {
    const pending = actionItems.filter(
      (item) => !completedActionIds.includes(item.id),
    );
    const completed = actionItems.filter((item) =>
      completedActionIds.includes(item.id),
    );
    return [...pending, ...completed];
  }, [actionItems, completedActionIds]);

  const canCollapseSummary = auditSummaryText.length > 420;

  const handleApproveAction = async (item: ActionItem) => {
    if (!brief || !item.startsAt) return;

    setProcessingActionIds((prev) => [...prev, item.id]);

    try {
      await api.briefs.createCalendarEvent(brief.id, {
        sourceId: item.id,
        type: item.type,
        title: item.title,
        details: item.details,
        startsAt: item.startsAt,
        endsAt: item.endsAt || null,
        allDay: item.allDay,
        participants: item.participants || [],
        includeMeet: item.type === "meeting",
      });

      setCompletedActionIds((prev) =>
        prev.includes(item.id) ? prev : [...prev, item.id],
      );
      toast.success("Added to calendar");
      await loadActionHistory(brief.id);
    } catch (error: unknown) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Could not create calendar event. Reconnect Google account and try again.";
      toast.error(message);
      await loadActionHistory(brief.id);
    } finally {
      setProcessingActionIds((prev) => prev.filter((id) => id !== item.id));
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTimestamp = (value?: string | null) => {
    if (!value) return null;
    return new Date(value).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size={48} className="text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your brief...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">Failed to Load Brief</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link
            href="/summaries"
            className="text-primary hover:underline"
          >
            ← Back to Summaries
          </Link>
        </div>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">📭</div>
          <h1 className="text-2xl font-bold mb-2">Brief Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This brief does not exist or you do not have access to it.
          </p>
          <Link
            href="/summaries"
            className="text-primary hover:underline"
          >
            ← Back to Summaries
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="w-full max-w-[1200px] mx-auto">
        <Link
          href="/summaries"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Summaries
        </Link>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
          <section className="bg-card rounded-[2rem] border shadow-xl p-5 md:p-6 lg:col-span-5 lg:sticky lg:top-6">
            <div className="h-44 bg-primary/10 rounded-2xl mb-5 flex items-center justify-center border border-primary/20">
              <div className="text-center text-primary">
                <div className="text-5xl mb-3">🎧</div>
                <p className="text-sm font-bold opacity-90">
                  {new Date(brief.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="text-center mb-5">
              <h1 className="text-3xl lg:text-[38px] leading-tight font-black tracking-tight mb-1">
                {brief.summarySchedule?.name || "Daily Summary"}
              </h1>
              <p className="text-muted-foreground font-medium mt-1">
                {brief.emailsProcessed} {brief.emailsProcessed === 1 ? "email" : "emails"} summarized
              </p>
            </div>

            {brief.audioUrl ? (
              <>
                <div className="mb-4">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 mb-5">
                  <button
                    onClick={() => skip(-10)}
                    className="p-3 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <SkipBack size={22} weight="fill" />
                  </button>

                  <button
                    onClick={togglePlayPause}
                    className="p-5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-all hover:scale-105 shadow-lg"
                  >
                    {isPlaying ? (
                      <Pause size={30} weight="fill" />
                    ) : (
                      <Play size={30} weight="fill" />
                    )}
                  </button>

                  <button
                    onClick={() => skip(10)}
                    className="p-3 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <SkipForward size={22} weight="fill" />
                  </button>
                </div>
              </>
            ) : (
              <div className="mb-6 rounded-2xl border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">
                  {brief.status === "PROCESSING" ||
                  brief.status === "GENERATING_AUDIO"
                    ? "Audio is still generating."
                    : brief.status === "FAILED"
                      ? "Audio generation failed for this brief."
                      : "Audio is not available for this brief yet."}
                </p>
              </div>
            )}

            {brief.summarySchedule && (
              <div className="mt-5 p-4 rounded-xl border border-muted/50 bg-muted/10 text-xs text-left space-y-2.5 backdrop-blur-sm">
                <p className="font-black uppercase tracking-wider text-[10px] text-zinc-500">Briefing Context</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-bold block text-muted-foreground">Scheduled Time</span>
                    <span className="font-semibold text-foreground">{brief.summarySchedule.deliveryTime}</span>
                  </div>
                  <div>
                    <span className="font-bold block text-muted-foreground">Timezone</span>
                    <span className="font-semibold text-foreground">{brief.summarySchedule.timezone}</span>
                  </div>
                  <div>
                    <span className="font-bold block text-muted-foreground">Voice Tone</span>
                    <span className="font-semibold text-foreground uppercase">{brief.summarySchedule.voicePersona.toLowerCase()}</span>
                  </div>
                </div>
                {brief.summarySchedule.customPrompt && (
                  <div className="border-t border-dashed border-black/10 dark:border-white/10 pt-2 mt-2">
                    <span className="font-bold block text-muted-foreground">Custom Purpose</span>
                    <p className="font-medium text-foreground italic mt-0.5 leading-normal">
                      "{brief.summarySchedule.customPrompt}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="bg-card rounded-[2rem] border shadow-xl p-5 md:p-6 min-h-[520px] lg:col-span-7 space-y-5">
            <div className="rounded-2xl border bg-muted/20 p-4 md:p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Sparkle size={18} className="text-primary" weight="fill" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                    Audit Summary
                  </h3>
                </div>
                {canCollapseSummary && (
                  <button
                    type="button"
                    onClick={() => setIsSummaryExpanded((prev) => !prev)}
                    className="text-xs font-bold text-primary hover:underline shrink-0"
                  >
                    {isSummaryExpanded ? "Read less" : "Read more"}
                  </button>
                )}
              </div>

              <div className="relative">
                <div
                  className={`overflow-hidden transition-[max-height] duration-200 ease-out ${
                    isSummaryExpanded
                      ? "max-h-[1200px]"
                      : "max-h-[170px] md:max-h-[220px]"
                  }`}
                >
                  <Markdown
                    content={auditSummaryText}
                    className="text-sm leading-relaxed text-foreground/90"
                  />
                </div>

                {!isSummaryExpanded && canCollapseSummary && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-muted/95 to-transparent" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ListChecks size={20} weight="fill" className="text-primary" />
                <h2 className="text-xl font-black tracking-tight">
                  Calendar Events
                </h2>
              </div>
              {isLoadingActionHistory && (
                <span className="text-[11px] text-muted-foreground font-semibold">
                  Loading action history...
                </span>
              )}
            </div>

            {actionItems.length === 0 ? (
              <div className="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                No calendar-specific events found in this summary yet.
              </div>
            ) : (
              <div className="space-y-4">
                {orderedActionItems.map((item) => {
                  const history = actionHistoryBySourceId[item.id];
                  const isCompleted = completedActionIds.includes(item.id);
                  const isProcessing = processingActionIds.includes(item.id);
                  const completedAtLabel = formatTimestamp(
                    history?.completedAt,
                  );
                  const failedAtLabel =
                    history?.status === "FAILED"
                      ? formatTimestamp(history?.updatedAt)
                      : null;

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-2xl border p-4 md:p-5 transition-all duration-300",
                        isCompleted
                          ? "bg-emerald-500/5 text-foreground border-emerald-500/20 dark:bg-emerald-500/[0.03]"
                          : "bg-card border-border/50 hover:border-muted-foreground/30 hover:shadow-sm"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2.5 mb-1">
                            {item.type === "event" && (
                              <CalendarPlus
                                size={16}
                                className="text-primary"
                              />
                            )}
                            {item.type === "reminder" && (
                              <Bell size={16} className="text-primary" />
                            )}
                            {item.type === "meeting" && (
                              <VideoCamera size={16} className="text-primary" />
                            )}
                            {item.type === "task" && (
                              <Bell size={16} className="text-primary" />
                            )}
                            <p className="text-sm font-bold text-foreground">{item.title}</p>
                            {isCompleted && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider select-none">
                                <CheckCircle size={12} weight="bold" />
                                Added
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {item.details}
                          </p>
                          {item.dateLabel && (
                            <p className="text-xs text-muted-foreground/80 mt-2.5 inline-flex items-center gap-1.5 font-semibold">
                              <Clock size={13} weight="bold" />
                              {item.dateLabel}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          className="rounded-2xl font-black text-[10px] uppercase tracking-widest px-4 h-9 transition-all active:scale-[0.98]"
                          onClick={() => void handleApproveAction(item)}
                          disabled={isCompleted || isProcessing}
                          variant={isCompleted ? "secondary" : "default"}
                        >
                          {isCompleted
                            ? "Done"
                            : isProcessing
                              ? "Adding..."
                              : "Add to calendar"}
                        </Button>
                      </div>

                      {history && (
                        <div className="mt-4 rounded-xl border border-muted/50 bg-muted/10 p-3 text-xs space-y-1.5 backdrop-blur-sm">
                          <p className="font-semibold text-muted-foreground">
                            Status:{" "}
                            <span className="font-black text-foreground">{history.status}</span>
                          </p>
                          {history.status === "COMPLETED" && completedAtLabel && (
                            <p className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Completed: {completedAtLabel}
                            </p>
                          )}
                          {history.status === "FAILED" && (
                            <>
                              {failedAtLabel && (
                                <p className="text-destructive font-bold">
                                  Failed: {failedAtLabel}
                                </p>
                              )}
                              {history.errorMessage && (
                                <p className="text-destructive/80 font-mono text-[10px] break-words bg-destructive/5 p-2 rounded-lg border border-destructive/10 leading-normal">
                                  Error: {history.errorMessage}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {brief.audioUrl && (
          <audio
            ref={audioRef}
            src={brief.audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
          />
        )}
      </div>
    </div>
  );
}
