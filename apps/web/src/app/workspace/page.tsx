"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api, { ActionItem } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  CheckSquare,
  CalendarBlank,
  EnvelopeOpen,
  ArrowClockwise,
  ArrowSquareOut,
  VideoCamera,
  MapPin,
  CheckCircle,
  Sparkle,
  Checks,
  CaretDown,
  CaretUp
} from "@phosphor-icons/react";

interface WorkspaceFeed {
  tasks: ActionItem[];
  meetings: ActionItem[];
  replies: ActionItem[];
  followUps: ActionItem[];
  recentActivity: ActionItem[];
  counts: Record<string, number>;
}

interface WorkspaceCalendarEvent {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string | null;
  location: string;
  meetLink: string;
  source: "google" | "outlook" | "action_item";
}

export default function WorkspacePage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [feed, setFeed] = useState<WorkspaceFeed | null>(null);
  const [calendar, setCalendar] = useState<WorkspaceCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Section collapse states
  const [tasksExpanded, setTasksExpanded] = useState(true);
  const [calendarExpanded, setCalendarExpanded] = useState(true);
  const [repliesExpanded, setRepliesExpanded] = useState(true);
  const [followUpsExpanded, setFollowUpsExpanded] = useState(true);
  const [activityExpanded, setActivityExpanded] = useState(true);

  const fetchWorkspaceData = useCallback(async () => {
    try {
      const [feedData, calendarData] = await Promise.all([
        api.workspace.getFeed(),
        api.workspace.getCalendar(),
      ]);
      setFeed(feedData);
      setCalendar(calendarData);
      setError(null);
    } catch (err) {
      console.error("Failed to load workspace data:", err);
      setError(err instanceof Error ? err.message : "Failed to load workspace feed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkspaceData();

      // Poll workspace data every 30 seconds for live feel
      const interval = setInterval(fetchWorkspaceData, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchWorkspaceData]);

  const handleCompleteTask = async (task: ActionItem) => {
    if (!feed) return;
    const previousFeed = { ...feed };
    
    // Remove from tasks and add to recent activity
    const updatedTasks = feed.tasks.filter((t) => t.id !== task.id);
    const updatedTaskItem = { ...task, status: "COMPLETED" as const, updatedAt: new Date().toISOString() };
    const updatedActivity = [updatedTaskItem, ...feed.recentActivity].slice(0, 10);
    
    setFeed({
      ...feed,
      tasks: updatedTasks,
      recentActivity: updatedActivity,
      counts: {
        ...feed.counts,
        tasks: updatedTasks.length,
      }
    });

    try {
      await api.actionItems.updateStatus(task.id, "COMPLETED");
      toast.success(`Task "${task.title}" completed!`);
    } catch {
      toast.error("Failed to complete task");
      setFeed(previousFeed); // Revert
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 75) return "bg-red-500 border-red-600/30";
    if (priority >= 40) return "bg-amber-500 border-amber-600/30";
    return "bg-blue-500 border-blue-600/30";
  };

  if (authLoading || (isLoading && !feed)) {
    return <LoadingScreen message="Loading Workspace Feed..." />;
  }

  if (!isAuthenticated || !feed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="max-w-6xl mx-auto space-y-6 pb-24 px-4 md:px-0"
    >
      <PageHeader
        title="Workspace"
        description="Unified task feed, briefings calendar, and activity command center."
        action={
          <Button
            variant="outline"
            onClick={fetchWorkspaceData}
            className="font-bold text-foreground dark:text-[#E5D8C9]"
          >
            Refresh Feed
          </Button>
        }
      />

      {error && (
        <div className="p-4 border border-destructive bg-destructive/5 text-destructive rounded-[var(--ds-radius-inner)] text-sm font-bold shadow-sm">
          {error}
        </div>
      )}

      {/* Grid Layout: 2/3 for feeds, 1/3 for calendar & activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tasks Section */}
          <SectionCard
            icon={<CheckSquare size={22} weight="fill" />}
            title={`Tasks (${feed.counts.tasks || 0})`}
            description="Daily action items and checklists requiring your focus."
            action={
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setTasksExpanded(!tasksExpanded)}
                className="text-muted-foreground hover:text-foreground"
              >
                {tasksExpanded ? <CaretUp size={18} /> : <CaretDown size={18} />}
              </Button>
            }
          >
            <AnimatePresence initial={false}>
              {tasksExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 pt-2">
                    {feed.tasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic py-4 text-center">
                        All caught up on tasks! Grab a coffee. ☕
                      </p>
                    ) : (
                      feed.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="group/item flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 hover:bg-muted/30 rounded-[var(--ds-radius-inner)] border border-border/40 transition-all duration-150"
                        >
                          <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto flex-1">
                            {/* Priority Indicator */}
                            <div className={cn("w-1.5 h-8 rounded-full border shrink-0", getPriorityColor(task.priority))} />
                            
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-foreground truncate">
                                {task.title}
                              </h4>
                              {task.sourceSubject && (
                                <span className="text-[10px] text-muted-foreground truncate block mt-0.5 font-medium">
                                  From: {task.sourceSubject}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 justify-end sm:justify-start w-full sm:w-auto shrink-0 md:opacity-0 md:group-hover/item:opacity-100 transition-opacity duration-150">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => router.push(`/action-items/${task.id}`)}
                              className="font-bold text-foreground dark:text-[#E5D8C9] w-full sm:w-auto"
                            >
                              Details
                            </Button>
                            <Button
                              size="xs"
                              onClick={() => handleCompleteTask(task)}
                              className="font-bold gap-1 bg-emerald-500 hover:bg-emerald-600 text-black border border-emerald-600/30 w-full sm:w-auto justify-center"
                            >
                              <CheckCircle size={14} weight="fill" />
                              <span>Complete</span>
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </SectionCard>

          {/* Pending Replies Section */}
          <SectionCard
            icon={<EnvelopeOpen size={22} weight="fill" />}
            title={`Pending Replies (${feed.counts.replies || 0})`}
            description="Emails flagged as requiring a response draft."
            action={
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setRepliesExpanded(!repliesExpanded)}
                className="text-muted-foreground hover:text-foreground"
              >
                {repliesExpanded ? <CaretUp size={18} /> : <CaretDown size={18} />}
              </Button>
            }
          >
            <AnimatePresence initial={false}>
              {repliesExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 pt-2">
                    {feed.replies.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic py-4 text-center">
                        No pending email replies needed.
                      </p>
                    ) : (
                      feed.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="group/item p-3 hover:bg-muted/30 rounded-[var(--ds-radius-inner)] border border-border/40 transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="min-w-0 w-full sm:w-auto flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold text-muted-foreground truncate block">
                                From: {reply.sourceSender || "Unknown"}
                              </span>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            </div>
                            <h4 className="text-sm font-bold text-foreground truncate">
                              {reply.title}
                            </h4>
                             {reply.sourcePreview && (
                              <p className="text-xs text-muted-foreground line-clamp-2 italic font-medium pt-0.5">
                                &ldquo;{reply.sourcePreview}&rdquo;
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-end sm:justify-start w-full sm:w-auto shrink-0 md:opacity-0 md:group-hover/item:opacity-100 transition-opacity duration-150">
                            <Button
                              size="xs"
                              onClick={() => router.push(`/action-items/${reply.id}`)}
                              className="font-bold text-foreground dark:text-[#E5D8C9] border-2 border-border w-full sm:w-auto flex justify-center items-center"
                            >
                              <span>Reply</span>
                              <ArrowSquareOut className="w-3.5 h-3.5 ml-1" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </SectionCard>

          {/* Follow-ups Section */}
          <SectionCard
            icon={<ArrowClockwise size={22} weight="fill" />}
            title={`Follow-ups (${feed.counts.followUps || 0})`}
            description="Actions or emails awaiting follow-up confirmation."
            action={
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setFollowUpsExpanded(!followUpsExpanded)}
                className="text-muted-foreground hover:text-foreground"
              >
                {followUpsExpanded ? <CaretUp size={18} /> : <CaretDown size={18} />}
              </Button>
            }
          >
            <AnimatePresence initial={false}>
              {followUpsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 pt-2">
                    {feed.followUps.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic py-4 text-center">
                        No active follow-ups pending.
                      </p>
                    ) : (
                      feed.followUps.map((item) => (
                        <div
                          key={item.id}
                          className="group/item p-3 hover:bg-muted/30 rounded-[var(--ds-radius-inner)] border border-border/40 transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="min-w-0 w-full sm:w-auto flex-1">
                            <h4 className="text-sm font-bold text-foreground truncate">
                              {item.title}
                            </h4>
                            {item.sourceSender && (
                              <p className="text-xs text-muted-foreground mt-0.5 font-medium truncate">
                                Follow up with {item.sourceSender}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center justify-end sm:justify-start w-full sm:w-auto shrink-0 md:opacity-0 md:group-hover/item:opacity-100 transition-opacity duration-150">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => router.push(`/action-items/${item.id}`)}
                              className="font-bold text-foreground dark:text-[#E5D8C9] w-full sm:w-auto"
                            >
                              Resolve
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </SectionCard>
        </div>

        {/* Right Column (1/3 width) - Sticky panel */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-8 self-start">
          {/* Calendar Section */}
          <SectionCard
            icon={<CalendarBlank size={22} weight="fill" />}
            title={`Calendar (${calendar.length})`}
            description="Next 48 hours."
            action={
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setCalendarExpanded(!calendarExpanded)}
                className="text-muted-foreground hover:text-foreground"
              >
                {calendarExpanded ? <CaretUp size={18} /> : <CaretDown size={18} />}
              </Button>
            }
          >
            <AnimatePresence initial={false}>
              {calendarExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-4 pt-2">
                    {calendar.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic py-4 text-center">
                        No events scheduled.
                      </p>
                    ) : (
                      <div className="relative border-l border-border/40 ml-2 pl-4 space-y-4">
                        {calendar.map((event) => {
                          const startDate = new Date(event.startsAt);
                          const isGoogle = event.source === "google";
                          const isOutlook = event.source === "outlook";

                          return (
                            <div key={event.id} className="relative">
                              {/* Timeline Node */}
                              <div className="absolute -left-[21px] top-1.5 w-3.5 h-3.5 rounded-full border border-border bg-background flex items-center justify-center">
                                <div className={cn("w-1.5 h-1.5 rounded-full", isGoogle ? "bg-red-500" : isOutlook ? "bg-blue-600" : "bg-primary")} />
                              </div>

                              <div className="p-3 border border-border/40 rounded-[var(--ds-radius-inner)] bg-card/30 hover:bg-muted/20 transition-all flex flex-col gap-2">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[9px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                                      {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                    <span className="text-[9px] font-mono text-muted-foreground font-bold">
                                      {startDate.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                                    </span>
                                  </div>
                                  <h4 className="text-xs font-bold text-foreground leading-tight">
                                    {event.title}
                                  </h4>
                                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap font-medium">
                                    {event.location && (
                                      <span className="flex items-center gap-1">
                                        <MapPin size={10} />
                                        <span className="truncate max-w-[120px]">{event.location}</span>
                                      </span>
                                    )}
                                    {event.source && (
                                      <span className="text-[9px] font-mono font-black uppercase text-muted-foreground/60">
                                        via {event.source.replace("_", " ")}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 justify-end">
                                  {event.meetLink && (
                                    <Button
                                      size="xs"
                                      variant="outline"
                                      onClick={() => window.open(event.meetLink, "_blank")}
                                      className="gap-1 font-bold text-foreground dark:text-[#E5D8C9] text-[10px] h-7 px-2"
                                    >
                                      <VideoCamera size={12} weight="fill" className="text-emerald-500" />
                                      <span>Join</span>
                                    </Button>
                                  )}
                                  {event.source === "action_item" && (
                                    <Button
                                      size="xs"
                                      onClick={() => router.push(`/action-items/${event.id.replace("action-item-", "")}`)}
                                      className="font-bold text-[10px] h-7 px-2"
                                    >
                                      Review
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </SectionCard>

          {/* Activity Feed Section */}
          <SectionCard
            icon={<Sparkle size={22} weight="fill" />}
            title="Activity Log"
            description="Recent operations."
            action={
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setActivityExpanded(!activityExpanded)}
                className="text-muted-foreground hover:text-foreground"
              >
                {activityExpanded ? <CaretUp size={18} /> : <CaretDown size={18} />}
              </Button>
            }
          >
            <AnimatePresence initial={false}>
              {activityExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 pt-2">
                    {feed.recentActivity.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic py-4 text-center">
                        No recent activity.
                      </p>
                    ) : (
                      feed.recentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 py-2 border-b border-dashed border-border/30 last:border-0 pl-1"
                        >
                          <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0 mt-0.5">
                            <Checks size={12} className="text-emerald-600 dark:text-emerald-400" weight="bold" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-foreground truncate">
                              Completed: {activity.title}
                            </p>
                            <span className="text-[9px] font-mono text-muted-foreground font-semibold">
                              {new Date(activity.updatedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </SectionCard>
        </div>
      </div>
    </motion.div>
  );
}
