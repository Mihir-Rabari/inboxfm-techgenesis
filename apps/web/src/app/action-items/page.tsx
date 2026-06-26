"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useActionItems } from "@/hooks/useActionItems";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  Calendar,
  CheckSquare,
  EnvelopeOpen,
  ArrowClockwise,
  Eye,
  ThumbsUp,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Trash
} from "@phosphor-icons/react";
import { ActionItem } from "@/lib/api";

const TYPE_ICONS = {
  MEETING: <Calendar className="w-4 h-4" />,
  TASK: <CheckSquare className="w-4 h-4" />,
  REPLY: <EnvelopeOpen className="w-4 h-4" />,
  FOLLOW_UP: <ArrowClockwise className="w-4 h-4" />,
  REVIEW: <Eye className="w-4 h-4" />,
  APPROVAL: <ThumbsUp className="w-4 h-4" />,
};

const TYPE_LABELS = {
  MEETING: "Meeting",
  TASK: "Task",
  REPLY: "Reply Needed",
  FOLLOW_UP: "Follow-up",
  REVIEW: "Review",
  APPROVAL: "Approval",
};

const STATUS_TABS = [
  { id: "ALL", label: "All" },
  { id: "PENDING", label: "Pending" },
  { id: "APPROVED", label: "Approved" },
  { id: "IGNORED", label: "Ignored" },
  { id: "COMPLETED", label: "Completed" },
  { id: "SNOOZED", label: "Snoozed" }
];

const TYPE_FILTERS = [
  { id: "ALL", label: "All Types" },
  { id: "MEETING", label: "Meetings" },
  { id: "TASK", label: "Tasks" },
  { id: "REPLY", label: "Replies" },
  { id: "FOLLOW_UP", label: "Follow-ups" },
  { id: "REVIEW", label: "Reviews" },
  { id: "APPROVAL", label: "Approvals" }
];

interface SwipeableItemCardProps {
  item: ActionItem;
  index: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateStatus: (id: string, status: ActionItem["status"]) => Promise<any>;
  onConfirmDelete: (item: ActionItem) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router: any;
}

function SwipeableItemCard({ item, index, updateStatus, onConfirmDelete, router }: SwipeableItemCardProps) {
  const x = useMotionValue(0);
  const isPending = item.status === "PENDING";

  // Background indicators for swiping
  const swipeBackground = useTransform(
    x,
    [-150, 0, 150],
    ["#fef2f2", "#ffffff00", "#ecfdf5"] // light red, transparent, light green
  );

  const approveIconOpacity = useTransform(x, [0, 80], [0, 1]);
  const ignoreIconOpacity = useTransform(x, [-80, 0], [1, 0]);

  // Color bar based on priority
  const priorityColor = 
    item.priority >= 80 
      ? "bg-red-400" 
      : item.priority >= 50 
        ? "bg-amber-300" 
        : "bg-emerald-300";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      layout
      className="relative overflow-hidden rounded-xl border-2 border-black dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(39,39,42,1)]"
    >
      {/* Background Swipe Actions (behind the card) */}
      {isPending && (
        <motion.div 
          style={{ backgroundColor: swipeBackground }}
          className="absolute inset-0 flex items-center justify-between px-6 z-0"
        >
          <motion.div style={{ opacity: approveIconOpacity }} className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-xs">
            <ThumbsUp weight="fill" className="w-5 h-5" />
            <span>Approve</span>
          </motion.div>
          <motion.div style={{ opacity: ignoreIconOpacity }} className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold uppercase tracking-wider text-xs">
            <span>Ignore</span>
            <XCircle weight="fill" className="w-5 h-5" />
          </motion.div>
        </motion.div>
      )}

      {/* Foreground Draggable Card */}
      <motion.div
        style={isPending ? { x } : {}}
        drag={isPending ? "x" : false}
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.5}
        onDragEnd={(e, info) => {
          if (!isPending) return;
          if (info.offset.x > 130) {
            updateStatus(item.id, "APPROVED");
            toast.success("Approved action item!");
          } else if (info.offset.x < -130) {
            updateStatus(item.id, "IGNORED");
            toast.success("Ignored action item.");
          }
        }}
        onClick={() => router.push(`/action-items/${item.id}`)}
        className="relative bg-white dark:bg-zinc-900 w-full h-full flex flex-col md:flex-row md:items-center justify-between gap-4 pl-6 pr-4 py-4 select-none cursor-pointer z-10 transition-colors duration-150 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
      >
        {/* Priority Indicator Bar */}
        <div className={cn("absolute left-0 top-0 bottom-0 w-2.5", priorityColor)} />

        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
              {TYPE_ICONS[item.type] || <CheckSquare className="w-4 h-4" />}
              {TYPE_LABELS[item.type]}
            </span>

            {item.replyIndicator && (
              <span className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-850 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                Draft Ready
              </span>
            )}

            {item.startsAt && (
              <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-450 border border-emerald-350 dark:border-emerald-850 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(item.startsAt).toLocaleDateString()}
              </span>
            )}

            {item.links && item.links.length > 0 && (
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-455 border border-blue-350 dark:border-blue-850 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                <span>🔗 {item.links.length} {item.links.length === 1 ? "Link" : "Links"}</span>
              </span>
            )}
          </div>

          <h4 className="font-black text-base text-black dark:text-white truncate">
            {item.title}
          </h4>

          {item.description && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-zinc-500 dark:text-zinc-500 pt-0.5">
            {item.sourceSender && (
              <span className="truncate">
                From: <strong>{item.sourceSender.split("<")[0].trim()}</strong>
              </span>
            )}
            {item.sourceSubject && (
              <span className="hidden sm:inline truncate">
                Subject: <em>{item.sourceSubject}</em>
              </span>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 justify-end self-end md:self-center shrink-0" onClick={(e) => e.stopPropagation()}>
          {isPending && (
            <>
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  updateStatus(item.id, "APPROVED");
                  toast.success("Approved action item!");
                }}
                className="bg-emerald-300 hover:bg-emerald-400 border border-black text-black font-black text-[10px] uppercase tracking-wider h-8 px-2.5 shadow-[1.5px_1.5px_0px_0px_#000000]"
              >
                Approve
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  updateStatus(item.id, "IGNORED");
                  toast.success("Ignored action item.");
                }}
                className="bg-zinc-200 hover:bg-zinc-300 border border-black text-black font-black text-[10px] uppercase tracking-wider h-8 px-2.5 shadow-[1.5px_1.5px_0px_0px_#000000]"
              >
                Ignore
              </Button>
            </>
          )}

          {item.status === "APPROVED" && item.type !== "MEETING" && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => {
                updateStatus(item.id, "COMPLETED");
                toast.success("Completed task!");
              }}
              className="bg-violet-300 hover:bg-violet-400 border border-black text-black font-black text-[10px] uppercase tracking-wider h-8 px-2.5 shadow-[1.5px_1.5px_0px_0px_#000000]"
            >
              Complete
            </Button>
          )}

          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => onConfirmDelete(item)}
            className="border-2 border-black h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <Trash className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => router.push(`/action-items/${item.id}`)}
            className="border-2 border-black h-8 w-8 text-foreground dark:text-[#E5D8C9]"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ActionItemsPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [activeStatus, setActiveStatus] = useState<string>("PENDING");
  const [activeType, setActiveType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingItem, setDeletingItem] = useState<ActionItem | null>(null);

  const {
    items,
    counts,
    isLoading: itemsLoading,
    updateStatus,
    deleteItem
  } = useActionItems({
    status: activeStatus === "ALL" ? undefined : activeStatus,
    type: activeType === "ALL" ? undefined : activeType,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Filter items locally by search query
  const filteredItems = items.filter((item) => {
    const query = searchQuery.toLowerCase();
    const titleMatch = item.title.toLowerCase().includes(query);
    const descMatch = item.description?.toLowerCase().includes(query) || false;
    const senderMatch = item.sourceSender?.toLowerCase().includes(query) || false;
    const subjectMatch = item.sourceSubject?.toLowerCase().includes(query) || false;
    return titleMatch || descMatch || senderMatch || subjectMatch;
  });

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    try {
      await deleteItem(deletingItem.id);
      toast.success("Deleted action item.");
    } catch {
      toast.error("Failed to delete action item.");
    } finally {
      setDeletingItem(null);
    }
  };

  if (authLoading || (itemsLoading && items.length === 0)) {
    return <LoadingScreen message="Loading Action Items..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader 
          title="Action Items" 
          description="Actionable tasks distilled by AI from your briefings."
        />
        <div className="flex items-center gap-2">
          {counts.PENDING > 0 && (
            <div className="bg-red-400 text-black border-2 border-black font-black uppercase tracking-wider px-3 py-1 text-xs rounded shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]">
              {counts.PENDING} Pending
            </div>
          )}
        </div>
      </div>

      {/* Toolbar: Search and Select Type Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search action items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-700 text-black dark:text-white font-medium rounded-lg shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2.5px_2.5px_0px_0px_rgba(39,39,42,1)] focus:outline-none placeholder:text-zinc-500 text-sm h-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={activeType} onValueChange={setActiveType}>
            <SelectTrigger className="w-[150px] font-bold border-2 border-black dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] text-xs h-10 text-black dark:text-white">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="border-2 border-black bg-white dark:bg-zinc-950 font-bold">
              {TYPE_FILTERS.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none gap-2">
        {STATUS_TABS.map((tab) => {
          const isActive = activeStatus === tab.id;
          const count = tab.id === "ALL" 
            ? Object.values(counts).reduce((a, b) => a + b, 0)
            : counts[tab.id] || 0;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveStatus(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 border-2 border-black rounded-md font-bold text-sm transition-all whitespace-nowrap shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                isActive 
                  ? "bg-amber-300 text-black -translate-x-0.5 -translate-y-0.5 shadow-[3.5px_3.5px_0px_0px_rgba(0,0,0,1)]" 
                  : "bg-white dark:bg-zinc-900 text-black dark:text-white hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              )}
            >
              {tab.label}
              <span className="bg-black/10 dark:bg-white/10 px-2 py-0.5 text-xs rounded-full">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Action Items List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              key="empty-state"
            >
              <Card className="border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(39,39,42,1)]">
                <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-zinc-150 dark:bg-zinc-800 rounded-full flex items-center justify-center border-2 border-black mb-4">
                    <CheckSquare className="w-8 h-8 text-zinc-400" />
                  </div>
                  <h3 className="font-bold text-xl mb-1 text-black dark:text-white">All Clear!</h3>
                  <p className="text-zinc-650 dark:text-zinc-400 max-w-sm text-sm">
                    {searchQuery 
                      ? "No action items matching your search criteria." 
                      : `No ${activeStatus.toLowerCase()} action items found.`}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            filteredItems.map((item, index) => (
              <SwipeableItemCard
                key={item.id}
                item={item}
                index={index}
                updateStatus={updateStatus}
                onConfirmDelete={(itm) => setDeletingItem(itm)}
                router={router}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deletingItem !== null}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        title="Delete Action Item"
        description="Are you sure you want to delete this action item? This action will permanently remove it from your workspace."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
