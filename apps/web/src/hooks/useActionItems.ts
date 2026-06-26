"use client";

import { useState, useEffect, useCallback } from "react";
import api, { ActionItem } from "@/lib/api";
import { toast } from "sonner";

interface UseActionItemsOptions {
  status?: string;
  type?: string;
  briefId?: string;
  limit?: number;
  skipFetch?: boolean;
}

// Simple in-memory global state cache to allow sharing across multiple instances
let globalActionItems: ActionItem[] = [];
let globalCounts: Record<string, number> = {
  PENDING: 0,
  APPROVED: 0,
  IGNORED: 0,
  COMPLETED: 0,
  EDITED: 0,
  SNOOZED: 0,
};
let isFirstFetchDone = false;

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function updateGlobalState(newItems: ActionItem[]) {
  const itemMap = new Map(globalActionItems.map((item) => [item.id, item]));
  newItems.forEach((item) => itemMap.set(item.id, item));
  globalActionItems = Array.from(itemMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  notify();
}

function updateItemInGlobalState(id: string, updates: Partial<ActionItem>) {
  globalActionItems = globalActionItems.map((item) => {
    if (item.id === id) {
      return { ...item, ...updates } as ActionItem;
    }
    return item;
  });
  notify();
}

function notify() {
  listeners.forEach((l) => l());
}

export function useActionItems(options?: UseActionItemsOptions) {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>(globalCounts);
  const [isLoading, setIsLoading] = useState(!isFirstFetchDone);
  const [error, setError] = useState<Error | null>(null);

  // Sync component state with global state
  useEffect(() => {
    const syncState = () => {
      let filtered = [...globalActionItems];
      if (options?.status) {
        filtered = filtered.filter((item) => item.status === options.status);
      }
      if (options?.type) {
        filtered = filtered.filter((item) => item.type === options.type);
      }
      if (options?.briefId) {
        filtered = filtered.filter((item) => item.briefId === options.briefId);
      }
      if (options?.limit) {
        filtered = filtered.slice(0, options.limit);
      }
      setItems(filtered);
      setCounts(globalCounts);
    };

    syncState();
    return subscribe(syncState);
  }, [options?.status, options?.type, options?.briefId, options?.limit]);

  const refresh = useCallback(async () => {
    if (options?.skipFetch) return;
    try {
      const [fetchedItems, fetchedCounts] = await Promise.all([
        api.actionItems.getAll({
          status: options?.status,
          type: options?.type,
          briefId: options?.briefId,
          limit: options?.limit,
        }),
        api.actionItems.getCounts(),
      ]);

      globalCounts = fetchedCounts;
      updateGlobalState(fetchedItems);
      isFirstFetchDone = true;
      setError(null);
    } catch (err) {
      console.error("Failed to fetch action items", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch action items"));
    } finally {
      setIsLoading(false);
    }
  }, [options?.status, options?.type, options?.briefId, options?.limit, options?.skipFetch]);

  // Initial fetch and polling
  useEffect(() => {
    refresh();
    const interval = setInterval(() => {
      refresh();
    }, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Update status of an item optimistically
  const updateStatus = useCallback(
    async (id: string, newStatus: ActionItem["status"]) => {
      const originalItem = globalActionItems.find((item) => item.id === id);
      if (!originalItem) return;

      const previousStatus = originalItem.status;

      // Adjust counts optimistically
      const nextCounts = { ...globalCounts };
      if (previousStatus in nextCounts) nextCounts[previousStatus] = Math.max(0, nextCounts[previousStatus] - 1);
      if (newStatus in nextCounts) nextCounts[newStatus] = (nextCounts[newStatus] || 0) + 1;
      globalCounts = nextCounts;

      // Update item in global state
      updateItemInGlobalState(id, { status: newStatus });

      try {
        await api.actionItems.updateStatus(id, newStatus);
        // Refresh counts to make sure we're in sync
        const c = await api.actionItems.getCounts();
        globalCounts = c;
        notify();
      } catch (err) {
        console.error("Failed to update status", err);
        // Revert status
        updateItemInGlobalState(id, { status: previousStatus });
        // Revert counts
        const revertedCounts = { ...globalCounts };
        if (newStatus in revertedCounts) revertedCounts[newStatus] = Math.max(0, revertedCounts[newStatus] - 1);
        if (previousStatus in revertedCounts) revertedCounts[previousStatus] = (revertedCounts[previousStatus] || 0) + 1;
        globalCounts = revertedCounts;
        notify();

        toast.error("Failed to update status", {
          description: "Something went wrong. Please try again.",
        });
      }
    },
    []
  );

  // Delete an item optimistically
  const deleteItem = useCallback(async (id: string) => {
    const originalItem = globalActionItems.find((item) => item.id === id);
    if (!originalItem) return;

    const previousStatus = originalItem.status;

    // Adjust counts
    const nextCounts = { ...globalCounts };
    if (previousStatus in nextCounts) nextCounts[previousStatus] = Math.max(0, nextCounts[previousStatus] - 1);
    globalCounts = nextCounts;

    // Remove from global list
    globalActionItems = globalActionItems.filter((item) => item.id !== id);
    notify();

    try {
      await api.actionItems.delete(id);
    } catch (err) {
      console.error("Failed to delete action item", err);
      // Revert deletion
      globalActionItems = [originalItem, ...globalActionItems].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const revertedCounts = { ...globalCounts };
      if (previousStatus in revertedCounts) revertedCounts[previousStatus] = (revertedCounts[previousStatus] || 0) + 1;
      globalCounts = revertedCounts;
      notify();

      toast.error("Failed to delete action item", {
        description: "Something went wrong. Please try again.",
      });
    }
  }, []);

  return {
    items,
    counts,
    isLoading,
    error,
    refresh,
    updateStatus,
    deleteItem,
  };
}
