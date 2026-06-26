"use client";

import { useRouter } from "next/navigation";
import {
  Play,
  DotsThreeVertical,
  Clock,
  EnvelopeSimple,
  CheckCircle,
  XCircle,
  Hourglass,
  Trash,
  Eye,
  ArrowClockwise,
  CalendarPlus,
  Bell,
  VideoCamera,
} from "@phosphor-icons/react";
import { Spinner } from "@/components/shared/Spinner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import api, { Brief, BriefActionHistoryEntry } from "@/lib/api";
import { toast } from "sonner";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StatusBadge, StatusKey } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { BriefShape } from "@/components/shared/BriefShape";

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

interface BriefsListProps {
  briefs: Brief[];
  isLoading: boolean;
  error: string | null;
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
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

export const BriefsList = ({
  briefs,
  isLoading,
  error,
  onDelete,
  onRefresh,
}: BriefsListProps) => {
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [creatingEventId, setCreatingEventId] = useState<string | null>(null);
  const [actionHistoryBySourceId, setActionHistoryBySourceId] = useState<
    Record<string, BriefActionHistoryEntry>
  >({});
  const [isLoadingActionHistory, setIsLoadingActionHistory] = useState(false);
  const [deletingBriefId, setDeletingBriefId] = useState<string | null>(null);
  const router = useRouter();

  const selectedBriefActions = useMemo(() => {
    if (!selectedBrief) return [];
    return parseActionItems(
      selectedBrief.textSummary || "",
      selectedBrief.date,
    );
  }, [selectedBrief]);

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
      toast.error("Could not load action history");
    } finally {
      setIsLoadingActionHistory(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedBrief?.id) {
      setActionHistoryBySourceId({});
      setIsLoadingActionHistory(false);
      return;
    }

    void loadActionHistory(selectedBrief.id);
  }, [selectedBrief?.id, loadActionHistory]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
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

  const getStatusInfo = (status: Brief["status"]) => {
    switch (status) {
      case "DELIVERED":
        return {
          variant: "default" as const,
          icon: CheckCircle,
          label: "Ready",
        };
      case "FAILED":
        return {
          variant: "destructive" as const,
          icon: XCircle,
          label: "Failed",
        };
      case "PENDING":
        return {
          variant: "secondary" as const,
          icon: Hourglass,
          label: "Pending",
        };
      default:
        return {
          variant: "outline" as const,
          icon: Spinner,
          label: "Processing",
        };
    }
  };

  const handleBriefClick = (briefId: string, status: Brief["status"]) => {
    // Only navigate if brief is ready
    if (status === "DELIVERED") {
      router.push(`/player/${briefId}`);
    }
  };

  const handleDeleteBrief = async (id: string) => {
    try {
      await api.briefs.delete(id);
      if (onDelete) {
        onDelete(id);
      }
      toast.success("Brief deleted");
    } catch {
      toast.error("Failed to delete brief");
    } finally {
      setDeletingBriefId(null);
    }
  };

  const handleApproveAction = async (item: ActionItem) => {
    if (!selectedBrief || !item.startsAt) return;

    try {
      setCreatingEventId(item.id);
      await api.briefs.createCalendarEvent(selectedBrief.id, {
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

      toast.success("Event created in Google Calendar");
      await loadActionHistory(selectedBrief.id);
    } catch (error: unknown) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Could not create calendar event. Reconnect Google account and try again.";
      toast.error(message);
      await loadActionHistory(selectedBrief.id);
    } finally {
      setCreatingEventId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-black">Recent Briefs</h3>
        <div className="bg-card rounded-[var(--ds-radius-card)] border-2 border-black dark:border-zinc-700 p-12 flex items-center justify-center shadow-[var(--ds-shadow-card)]">
          <Spinner size={24} className="text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-black">Recent Briefs</h3>
        <EmptyState
          icon={<XCircle size={32} weight="duotone" />}
          title="Could not load briefs"
          description={error}
          action={
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          }
        />
      </div>
    );
  }

  if (briefs.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-black">Recent Briefs</h3>
        <EmptyState
          icon={<EnvelopeSimple size={32} weight="duotone" />}
          title="No briefs yet"
          description="Generate your first briefing to see it here."
          size="sm"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-black">Recent Briefs</h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {briefs.length} total
          </span>
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              title="Refresh briefs"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <ArrowClockwise size={16} weight="bold" />
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card rounded-[var(--ds-radius-card)] border-2 border-black dark:border-zinc-700 overflow-hidden shadow-[var(--ds-shadow-card)]">
        {briefs.map((brief, index) => {
          const isClickable = brief.status === "DELIVERED";

          return (
            <div
              key={brief.id}
              onClick={() => handleBriefClick(brief.id, brief.status)}
              className={`p-4 flex items-center justify-between gap-4 transition-all duration-205 group opacity-0 animate-fade-in ${index !== briefs.length - 1 ? "border-b-2 border-dashed border-black/10 dark:border-white/10" : ""} ${isClickable ? "hover:bg-muted/20 cursor-pointer" : "opacity-60"}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className={`w-12 h-12 bg-primary/10 text-primary border-2 border-black dark:border-zinc-700 rounded-[var(--ds-radius-inner)] flex items-center justify-center shrink-0 transition-all ${isClickable ? "group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105" : ""}`}
                >
                  <BriefShape briefId={brief.id} className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold">
                    {formatDate(brief.date)} Brief
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {new Date(brief.createdAt).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <EnvelopeSimple size={14} /> {brief.emailsProcessed}{" "}
                      emails
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold">
                    {formatDuration(brief.audioDuration)}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    Duration
                  </div>
                </div>
                <StatusBadge status={brief.status as StatusKey} dot />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DotsThreeVertical size={24} weight="bold" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 rounded-[var(--ds-radius-inner)] border-2 border-black dark:border-zinc-700 shadow-[var(--ds-shadow-hover)]"
                  >
                    <DropdownMenuItem
                      className="font-bold py-2.5 cursor-pointer rounded-[var(--ds-radius-btn)]"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBriefClick(brief.id, brief.status);
                      }}
                      disabled={!isClickable}
                    >
                      <Play
                        size={18}
                        weight="fill"
                        className="mr-2 text-primary"
                      />
                      Play Brief
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="font-bold py-2.5 cursor-pointer rounded-[var(--ds-radius-btn)]"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBrief(brief);
                      }}
                    >
                      <Eye
                        size={18}
                        weight="bold"
                        className="mr-2 text-blue-500"
                      />
                      View Summary
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-muted/50" />
                    <DropdownMenuItem
                      className="font-bold py-2.5 cursor-pointer rounded-[var(--ds-radius-btn)] text-destructive focus:text-destructive focus:bg-destructive/5"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingBriefId(brief.id);
                      }}
                    >
                      <Trash size={18} weight="bold" className="mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deletingBriefId}
        onOpenChange={(open) => !open && setDeletingBriefId(null)}
        title="Delete this brief?"
        description="This action cannot be undone. The audio recording and summary will be permanently removed."
        confirmLabel="Yes, delete"
        variant="destructive"
        onConfirm={() => deletingBriefId ? handleDeleteBrief(deletingBriefId) : Promise.resolve()}
      />

      {/* View Summary Dialog */}
      <Dialog
        open={!!selectedBrief}
        onOpenChange={(open) => !open && setSelectedBrief(null)}
      >
        <DialogContent size="lg" className="p-0 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-5 border-b border-border/40">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary/10 rounded-[var(--ds-radius-inner)] flex items-center justify-center text-primary shrink-0">
                <Eye size={22} weight="fill" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight leading-none">Brief Summary</h2>
                <p className="text-sm text-muted-foreground font-medium mt-1">
                  {selectedBrief && formatDate(selectedBrief.date)} · {selectedBrief?.emailsProcessed} emails processed
                </p>
              </div>
            </div>
          </div>
          {/* Body */}
          <div className="px-8 py-6 max-h-[60vh] overflow-y-auto">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {selectedBrief?.status === "FAILED" ? (
                <div className="space-y-6">
                  <div className="bg-destructive/5 border-2 border-destructive/20 rounded-[var(--ds-radius-inner)] p-6">
                    <h4 className="text-destructive font-black uppercase tracking-widest text-xs mb-2">
                      Failure Reason
                    </h4>
                    <p className="text-lg font-bold text-foreground mb-4">
                      {selectedBrief.errorMessage ||
                        "An unknown error occurred during processing."}
                    </p>
                    {(selectedBrief.errorMessage
                      ?.toLowerCase()
                      .includes("credential") ||
                      selectedBrief.errorMessage
                        ?.toLowerCase()
                        .includes("auth") ||
                      selectedBrief.errorMessage
                        ?.toLowerCase()
                        .includes("token")) && (
                      <div className="pt-4 border-t border-destructive/10">
                        <p className="text-sm text-muted-foreground mb-4">
                          Your Gmail connection seems to have expired.
                          Reconnecting your account will resolve this.
                        </p>
                        <Button
                          onClick={() => router.push("/settings")}
                          variant="destructive"
                          size="sm"
                        >
                          <ArrowClockwise
                            size={18}
                            weight="bold"
                            className="mr-2"
                          />
                          Reconnect Gmail
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-muted-foreground italic">
                    No summary could be generated because the briefing process
                    failed.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-[var(--ds-radius-inner)] border-2 border-black dark:border-zinc-700 bg-muted/20 dark:bg-muted/10 p-5">
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">
                      Audit Summary
                    </h4>
                    <p className="text-base leading-relaxed font-medium whitespace-pre-wrap">
                      {stripStructuredMarker(
                        selectedBrief?.textSummary || "",
                      ) || "No summary available for this brief."}
                    </p>
                  </div>

                  <div className="rounded-[var(--ds-radius-inner)] border-2 border-black dark:border-zinc-700 p-5 bg-background/60">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                        Calendar Events
                      </h4>
                      {isLoadingActionHistory && (
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          Loading action history...
                        </span>
                      )}
                    </div>

                    {selectedBriefActions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No calendar-specific events found in this summary yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {selectedBriefActions.map((item) => {
                          const history = actionHistoryBySourceId[item.id];
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
                              className="rounded-[var(--ds-radius-btn)] border-2 border-black dark:border-zinc-700 p-3 bg-card"
                            >
                              <div className="flex items-start gap-2 mb-1">
                                {item.type === "event" && (
                                  <CalendarPlus
                                    size={16}
                                    className="text-primary mt-0.5"
                                  />
                                )}
                                {item.type === "reminder" && (
                                  <Bell
                                    size={16}
                                    className="text-primary mt-0.5"
                                  />
                                )}
                                {item.type === "meeting" && (
                                  <VideoCamera
                                    size={16}
                                    className="text-primary mt-0.5"
                                  />
                                )}
                                {item.type === "task" && (
                                  <CheckCircle
                                    size={16}
                                    className="text-primary mt-0.5"
                                  />
                                )}
                                <div>
                                  <p className="text-sm font-bold">
                                    {item.title}
                                  </p>
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {item.details}
                                  </p>
                                  {item.dateLabel && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {item.dateLabel}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  className="rounded-[var(--ds-radius-btn)] font-bold"
                                  onClick={() => void handleApproveAction(item)}
                                  disabled={creatingEventId === item.id}
                                  variant={
                                    history?.status === "COMPLETED"
                                      ? "secondary"
                                      : "default"
                                  }
                                >
                                  {creatingEventId === item.id
                                    ? "Creating..."
                                    : history?.status === "COMPLETED"
                                      ? "Done"
                                      : "Yes, create in calendar"}
                                </Button>

                                {item.secondaryUrl && (
                                  <Button
                                    asChild
                                    size="sm"
                                    variant="secondary"
                                    className="rounded-[var(--ds-radius-btn)] font-bold"
                                  >
                                    <a
                                      href={item.secondaryUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      Open meeting
                                    </a>
                                  </Button>
                                )}
                              </div>

                              {history && (
                                <div className="mt-3 rounded-[var(--ds-radius-btn)] border-2 border-black dark:border-zinc-700 bg-muted/30 p-2.5 text-xs space-y-1">
                                  <p className="font-semibold">
                                    Status:{" "}
                                    <span className="font-black">
                                      {history.status}
                                    </span>
                                  </p>
                                  {history.status === "COMPLETED" &&
                                    completedAtLabel && (
                                      <p className="text-emerald-700 dark:text-emerald-400">
                                        Completed: {completedAtLabel}
                                      </p>
                                    )}
                                  {history.status === "FAILED" && (
                                    <>
                                      {failedAtLabel && (
                                        <p className="text-destructive">
                                          Failed: {failedAtLabel}
                                        </p>
                                      )}
                                      {history.errorMessage && (
                                        <p className="text-destructive/90 break-words">
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
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-border/40 bg-muted/20 flex items-center justify-between">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Generated {selectedBrief && new Date(selectedBrief.createdAt).toLocaleDateString()}
            </span>
            <Button
              variant="default"
              size="sm"
              onClick={() => setSelectedBrief(null)}
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
