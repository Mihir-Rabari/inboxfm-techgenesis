"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useActionItems } from "@/hooks/useActionItems";
import { useConfigWarnings } from "@/hooks/useConfigWarnings";
import { ConfigWarningBanner } from "@/components/shared/ConfigWarningBanner";
import { AudioPlayer } from "@/components/dashboard/AudioPlayer";
import { BriefsList } from "@/components/dashboard/BriefsList";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Spinner } from "@/components/shared/Spinner";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import api, { Brief } from "@/lib/api";
import { 
  MagicWand, 
  Waves, 
  ArrowRight, 
  Calendar, 
  CheckSquare, 
  EnvelopeOpen, 
  ArrowClockwise, 
  Eye, 
  ShieldCheck, 
  CheckCircle,
  Clock,
  Sparkle
} from "@phosphor-icons/react";

const PROCESSING_STATUSES: Brief["status"][] = [
  "PENDING",
  "FETCHING",
  "PROCESSING",
  "GENERATING_AUDIO",
  "DELIVERING",
];
const POLL_INTERVAL_MS = 8_000;

const TYPE_ICONS = {
  MEETING: <Calendar className="w-3.5 h-3.5" />,
  TASK: <CheckSquare className="w-3.5 h-3.5" />,
  REPLY: <EnvelopeOpen className="w-3.5 h-3.5" />,
  FOLLOW_UP: <ArrowClockwise className="w-3.5 h-3.5" />,
  REVIEW: <Eye className="w-3.5 h-3.5" />,
  APPROVAL: <ShieldCheck className="w-3.5 h-3.5" />,
};

const TYPE_LABELS = {
  MEETING: "Meeting",
  TASK: "Task",
  REPLY: "Reply Needed",
  FOLLOW_UP: "Follow-up",
  REVIEW: "Review",
  APPROVAL: "Approval",
};

export default function DashboardPage() {
  const { isLoading: authLoading, isAuthenticated, user } = useAuth();
  const router = useRouter();

  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [isLoadingBriefs, setIsLoadingBriefs] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { warnings } = useConfigWarnings();
  const {
    items: pendingActionItems,
    isLoading: actionItemsLoading,
    updateStatus,
  } = useActionItems({ status: "PENDING", limit: 5 });

  const hasProcessingBriefs = briefs.some((b) =>
    PROCESSING_STATUSES.includes(b.status)
  );

  const fetchBriefs = useCallback(async () => {
    try {
      const data = await api.briefs.getAll();
      setBriefs(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch briefs", err);
      setError(err instanceof Error ? err.message : "Failed to load briefs");
    } finally {
      setIsLoadingBriefs(false);
    }
  }, []);

  const handleGenerateNow = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      await api.briefs.generate();
      toast.success("Briefing generation started!", {
        description: "We're distilling your inbox. It will appear here shortly.",
      });
      await fetchBriefs();
    } catch (err) {
      console.error("Failed to generate brief", err);
      toast.error("Failed to start generation", {
        description: err instanceof Error ? err.message : "An unexpected error occurred",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setIsLoadingBriefs(true);
    fetchBriefs();
  }, [isAuthenticated, fetchBriefs]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (hasProcessingBriefs) {
      pollTimerRef.current = setTimeout(() => fetchBriefs(), POLL_INTERVAL_MS);
    }
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [hasProcessingBriefs, isAuthenticated, fetchBriefs]);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 17) return "Good afternoon";
    return "Good evening";
  };

  if (authLoading) return <LoadingScreen message="Loading Dashboard..." />;
  if (!isAuthenticated) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="w-full pb-32 relative space-y-8 max-w-4xl mx-auto px-4 md:px-0"
    >
      {/* Decorative Blur Spotlight */}
      <div className="absolute top-0 right-1/4 w-[350px] h-[350px] bg-brand-orange/5 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse" />

      <PageHeader
        title={`${getGreeting()}, ${user?.name?.split(" ")[0] || "there"}!`}
        description="Here is your distilled workspace and audio daily digest."
        action={
          <Button
            onClick={handleGenerateNow}
            disabled={isGenerating || hasProcessingBriefs}
            size="brand"
            className="gap-2.5"
          >
            {isGenerating ? <Spinner size={16} /> : <MagicWand size={16} weight="fill" />}
            <span>{isGenerating ? "Synthesizing..." : "Generate Briefing"}</span>
          </Button>
        }
        className="mb-8"
      />

      {/* Config Warnings Section */}
      {warnings.length > 0 && (
        <div className="space-y-3">
          {warnings.map((warning) => (
            <ConfigWarningBanner
              key={warning.id}
              type={warning.type}
              message={warning.message}
              action={warning.action}
            />
          ))}
        </div>
      )}

      {/* Stats row */}
      <StatsCards briefs={briefs} isLoading={isLoadingBriefs} />

      {/* Now Playing (AudioPlayer) */}
      <div className="space-y-4 text-left">
        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/80 ml-1 flex items-center gap-2 select-none">
          <Waves size={14} weight="fill" className="text-muted-foreground" />
          On Air
        </h3>
        <ErrorBoundary>
          <AudioPlayer briefs={briefs} isLoading={isLoadingBriefs} />
        </ErrorBoundary>
      </div>

      {/* Pending Actions Section */}
      <div className="space-y-4 text-left">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/80 ml-1 flex items-center gap-2 select-none">
            <Sparkle size={14} weight="fill" className="text-muted-foreground" />
            Pending Actions
          </h3>
          <Link href="/action-items" passHref className="text-xs font-bold text-primary hover:underline flex items-center gap-1 select-none">
            <span>View All Action Items</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {actionItemsLoading && pendingActionItems.length === 0 ? (
          <Card className="border-2 border-black dark:border-zinc-700 bg-card shadow-[var(--ds-shadow-card)]">
            <CardContent className="py-8 flex items-center justify-center">
              <Spinner size={24} className="text-primary" />
            </CardContent>
          </Card>
        ) : pendingActionItems.length === 0 ? (
          <Card className="border-2 border-black dark:border-zinc-700 bg-card shadow-[var(--ds-shadow-card)] rounded-[var(--ds-radius-inner)]">
            <CardContent className="py-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border-2 border-black dark:border-zinc-700">
                <CheckCircle size={20} weight="fill" />
              </div>
              <p className="text-sm font-bold text-foreground">Zero Critical Tasks Pending</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed font-medium">
                All daily inbox actions are cleared. Your workflow is completely up to date.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingActionItems.map((item, index) => {
              const priorityColor =
                item.priority >= 80
                  ? "bg-red-400"
                  : item.priority >= 50
                    ? "bg-amber-300"
                    : "bg-emerald-300";

              return (
                <div
                  key={item.id}
                  onClick={() => router.push(`/action-items/${item.id}`)}
                  className="relative group border-2 border-black dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(39,39,42,1)] overflow-hidden hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                >
                  <div className={cn("absolute left-0 top-0 bottom-0 w-2.5", priorityColor)} />
                  <div className="pl-5 pr-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-zinc-700 px-2 py-0.5 rounded text-[10px] font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                          {TYPE_ICONS[item.type] || <CheckSquare className="w-3.5 h-3.5" />}
                          {TYPE_LABELS[item.type]}
                        </span>
                        {item.replyIndicator && (
                          <span className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 px-2 py-0.5 rounded text-[10px] font-bold">
                            Draft Ready
                          </span>
                        )}
                        {item.startsAt && (
                          <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(item.startsAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-base text-black dark:text-white truncate">
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateStatus(item.id, "APPROVED");
                          toast.success("Approved action item!");
                        }}
                        className="bg-emerald-300 hover:bg-emerald-400 border-2 border-black text-black font-bold h-8 text-xs px-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateStatus(item.id, "IGNORED");
                          toast.success("Ignored action item.");
                        }}
                        className="bg-zinc-200 hover:bg-zinc-300 border-2 border-black text-black font-bold h-8 text-xs px-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      >
                        Ignore
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Briefings */}
      <div className="space-y-4 text-left">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/80 ml-1 flex items-center gap-2 select-none">
            <Calendar size={14} weight="fill" className="text-muted-foreground" />
            Recent Briefings
          </h3>
          <Link href="/briefings" passHref className="text-xs font-bold text-primary hover:underline flex items-center gap-1 select-none">
            <span>View All Briefings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <ErrorBoundary>
          <BriefsList
            briefs={briefs.slice(0, 3)}
            isLoading={isLoadingBriefs}
            error={error}
            onDelete={(id) => setBriefs((prev) => prev.filter((b) => b.id !== id))}
            onRefresh={fetchBriefs}
          />
        </ErrorBoundary>
      </div>
    </motion.div>
  );
}
