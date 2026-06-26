"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useActionItems } from "@/hooks/useActionItems";
import { useBriefFilters, StatusFilterOption, SortOption } from "@/hooks/useBriefFilters";
import { BriefCard } from "@/components/briefings/BriefCard";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Spinner } from "@/components/shared/Spinner";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import api, { Brief } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  MagnifyingGlass,
  ArrowClockwise,
  EnvelopeSimple,
  SlidersHorizontal,
  Funnel,
  Trash
} from "@phosphor-icons/react";

function stripStructuredMarker(textSummary: string): string {
  const marker = "__INBOXFM_STRUCTURED_JSON__";
  if (!textSummary?.startsWith(marker)) return textSummary;
  const newlineIdx = textSummary.indexOf("\n");
  return newlineIdx === -1 ? "" : textSummary.slice(newlineIdx + 1);
}



export default function BriefingsPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [isLoadingBriefs, setIsLoadingBriefs] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deletingBrief, setDeletingBrief] = useState<Brief | null>(null);

  const fetchBriefs = useCallback(async () => {
    try {
      const data = await api.briefs.getAll();
      setBriefs(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch briefs", err);
      setError(err instanceof Error ? err.message : "Failed to load briefings");
    } finally {
      setIsLoadingBriefs(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchBriefs();
    }
  }, [isAuthenticated, fetchBriefs]);

  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    filteredAndSortedBriefs,
  } = useBriefFilters(briefs);

  const handleDeleteBrief = async () => {
    if (!deletingBrief) return;
    try {
      await api.briefs.delete(deletingBrief.id);
      setBriefs((prev) => prev.filter((b) => b.id !== deletingBrief.id));
      toast.success("Briefing deleted successfully");
    } catch {
      toast.error("Failed to delete briefing");
    } finally {
      setDeletingBrief(null);
    }
  };

  const handlePlayBrief = (brief: Brief) => {
    router.push(`/player/${brief.id}`);
  };

  if (authLoading || (isLoadingBriefs && briefs.length === 0)) {
    return <LoadingScreen message="Loading Briefings..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 px-4 md:px-0">
      <PageHeader
        title="Briefings"
        description="All personalized daily summaries compiled on your schedule."
        action={
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchBriefs}
            title="Refresh list"
            className="border-2 border-black dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black dark:text-white"
          >
            <ArrowClockwise className="w-4 h-4 font-bold" />
          </Button>
        }
      />

      <ErrorBoundary>
        <StatsCards briefs={briefs} isLoading={isLoadingBriefs} />
      </ErrorBoundary>

      {/* Search + Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            <MagnifyingGlass className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Search briefings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-700 text-black dark:text-white font-medium rounded-lg shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2.5px_2.5px_0px_0px_rgba(39,39,42,1)] focus:outline-none placeholder:text-zinc-500 text-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 self-end sm:self-center">
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as StatusFilterOption)}>
            <SelectTrigger className="w-[140px] font-bold border-2 border-black dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] text-xs text-black dark:text-white h-9">
              <div className="flex items-center gap-1.5">
                <Funnel className="w-3.5 h-3.5" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent className="border-2 border-black bg-white dark:bg-zinc-950 font-bold">
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="READY">Ready</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
            <SelectTrigger className="w-[160px] font-bold border-2 border-black dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] text-xs text-black dark:text-white h-9">
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <SelectValue placeholder="Sort" />
              </div>
            </SelectTrigger>
            <SelectContent className="border-2 border-black bg-white dark:bg-zinc-950 font-bold">
              <SelectItem value="date_desc">Newest First</SelectItem>
              <SelectItem value="date_asc">Oldest First</SelectItem>
              <SelectItem value="emails_desc">Most Emails</SelectItem>
              <SelectItem value="duration_desc">Longest Duration</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Briefs Grid */}
      <div className="space-y-4">
        {error && (
          <div className="p-4 border-2 border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-lg text-sm font-bold shadow-[3px_3px_0px_0px_rgba(239,68,68,0.2)]">
            {error}
          </div>
        )}

        {filteredAndSortedBriefs.length === 0 ? (
          <EmptyState
            icon={<EnvelopeSimple size={48} weight="duotone" />}
            title={searchTerm || statusFilter !== "ALL" ? "No matches found" : "No briefings yet"}
            description={
              searchTerm || statusFilter !== "ALL"
                ? "Try adjusting your search query or filter options."
                : "Your daily briefings will appear here once they are compiled."
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredAndSortedBriefs.map((brief, index) => (
                <BriefCard
                  key={brief.id}
                  brief={brief}
                  index={index}
                  onPlay={handlePlayBrief}
                  onDelete={setDeletingBrief}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deletingBrief !== null}
        onOpenChange={(open) => !open && setDeletingBrief(null)}
        title="Delete Briefing"
        description="Are you sure you want to delete this daily briefing? This action will permanently remove it and all associated metadata."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteBrief}
      />
    </div>
  );
}
