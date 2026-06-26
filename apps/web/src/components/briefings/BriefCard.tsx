"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  DotsThreeVertical,
  Clock,
  EnvelopeSimple,
  Trash,
  Eye,
  Download,
  Calendar
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { StatusBadge, StatusKey } from "@/components/shared/StatusBadge";
import { BriefShape } from "@/components/shared/BriefShape";
import { Brief } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BriefCardProps {
  brief: Brief;
  index: number;
  onPlay?: (brief: Brief) => void;
  onDelete?: (brief: Brief) => void;
  className?: string;
}

export function BriefCard({
  brief,
  index,
  onPlay,
  onDelete,
  className,
}: BriefCardProps) {
  const router = useRouter();
  const isClickable = brief.status === "DELIVERED";

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

  const handleCardClick = () => {
    if (isClickable) {
      router.push(`/player/${brief.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.23, 1, 0.32, 1] }}
      layout
      className={className}
    >
      <div
        onClick={handleCardClick}
        className={cn(
          "border-[3px] border-black bg-white dark:bg-zinc-900 rounded-xl p-5 flex flex-col justify-between gap-4 transition-all duration-200 select-none",
          isClickable
            ? "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[5px_5px_0px_0px_rgba(39,39,42,1)] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(39,39,42,1)] cursor-pointer"
            : "opacity-60 shadow-none border-zinc-300 dark:border-zinc-800"
        )}
      >
        {/* Card Top: Header Icon & Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 text-primary border-2 border-black dark:border-zinc-700 rounded-lg flex items-center justify-center shrink-0">
              <BriefShape briefId={brief.id} className="w-5.5 h-5.5" />
            </div>
            <div>
              <h4 className="font-black text-base leading-tight text-black dark:text-white">
                {brief.summarySchedule?.name || `${formatDate(brief.date)} Brief`}
              </h4>
              <p className="text-[10px] font-mono text-zinc-500 flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                {new Date(brief.createdAt).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <StatusBadge status={brief.status as StatusKey} dot />
        </div>

        {/* Card Middle: Summary Snippet */}
        {brief.textSummary && (
          <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
            {brief.textSummary.startsWith("__INBOXFM_STRUCTURED_JSON__")
              ? brief.textSummary.split("\n").slice(1).join(" ")
              : brief.textSummary}
          </p>
        )}

        {/* Card Bottom: Metrics & Actions */}
        <div className="flex items-center justify-between border-t-2 border-dashed border-black/10 dark:border-white/10 pt-3 mt-1">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1 text-zinc-500 font-bold">
              <EnvelopeSimple className="w-4 h-4" />
              <span>{brief.emailsProcessed} emails</span>
            </div>
            <div className="flex items-center gap-1 text-zinc-500 font-bold">
              <Clock className="w-4 h-4" />
              <span>{formatDuration(brief.audioDuration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {isClickable && onPlay && (
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => onPlay(brief)}
                className="bg-amber-300 hover:bg-amber-400 border-2 border-black h-8 w-8 text-black"
                title="Play Audio"
              >
                <Play className="w-4 h-4" weight="fill" />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="h-8 w-8 border-2 border-transparent hover:border-black dark:hover:border-zinc-700 text-zinc-500 hover:text-black dark:hover:text-white"
                >
                  <DotsThreeVertical className="w-5 h-5" weight="bold" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border-2 border-black dark:border-zinc-700 bg-white dark:bg-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(39,39,42,1)]"
              >
                {isClickable && (
                  <DropdownMenuItem
                    onClick={() => router.push(`/player/${brief.id}`)}
                    className="gap-2 font-bold cursor-pointer"
                  >
                    <Play className="w-4 h-4" /> Listen Briefing
                  </DropdownMenuItem>
                )}
                {brief.audioUrl && (
                  <DropdownMenuItem
                    onClick={() => window.open(brief.audioUrl!, "_blank")}
                    className="gap-2 font-bold cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Download Audio
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator className="bg-black/10 dark:bg-zinc-800" />
                    <DropdownMenuItem
                      onClick={() => onDelete(brief)}
                      className="gap-2 font-bold text-red-500 focus:text-red-500 cursor-pointer"
                    >
                      <Trash className="w-4 h-4" /> Delete Briefing
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
