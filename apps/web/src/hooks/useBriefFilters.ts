"use client";

import { useState, useMemo } from "react";
import { Brief } from "@/lib/api";

export type SortOption = "date_desc" | "date_asc" | "emails_desc" | "duration_desc";
export type StatusFilterOption = "ALL" | "READY" | "PROCESSING" | "FAILED";

export function useBriefFilters(briefs: Brief[]) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");

  const filteredAndSortedBriefs = useMemo(() => {
    return briefs
      .filter((b) => {
        // Search filter
        const textSummary = b.textSummary?.toLowerCase() || "";
        const rawDate = new Date(b.date).toLocaleDateString().toLowerCase();
        const matchesSearch =
          rawDate.includes(searchTerm.toLowerCase()) ||
          textSummary.includes(searchTerm.toLowerCase());

        // Status filter
        let matchesStatus = true;
        if (statusFilter === "READY") {
          matchesStatus = b.status === "DELIVERED";
        } else if (statusFilter === "PROCESSING") {
          matchesStatus = [
            "PENDING",
            "FETCHING",
            "PROCESSING",
            "GENERATING_AUDIO",
            "DELIVERING",
          ].includes(b.status);
        } else if (statusFilter === "FAILED") {
          matchesStatus = b.status === "FAILED";
        }

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "date_desc") {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortBy === "date_asc") {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (sortBy === "emails_desc") {
          return (b.emailsProcessed || 0) - (a.emailsProcessed || 0);
        }
        if (sortBy === "duration_desc") {
          return (b.audioDuration || 0) - (a.audioDuration || 0);
        }
        return 0;
      });
  }, [briefs, searchTerm, statusFilter, sortBy]);

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    filteredAndSortedBriefs,
  };
}
