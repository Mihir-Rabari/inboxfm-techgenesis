"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api, { Integration, BriefingStyle } from "@/lib/api";

export interface ConfigWarning {
  id: string;
  type: "warning" | "info";
  message: string;
  action?: {
    label: string;
    href: string;
  };
}

let cachedIntegrations: Integration[] | null = null;
let cachedSchedules: any[] | null = null;
let cachedStyles: BriefingStyle[] | null = null;
let isFetching = false;
const listeners = new Set<() => void>();

export function useConfigWarnings() {
  const { isAuthenticated, user } = useAuth();
  const [warnings, setWarnings] = useState<ConfigWarning[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setWarnings([]);
      setIsLoading(false);
      return;
    }

    const updateWarnings = (
      integrations: Integration[],
      schedules: any[],
      styles: BriefingStyle[]
    ) => {
      const list: ConfigWarning[] = [];

      const hasEmailConnected = integrations.some(
        (i) => (i.provider === "GMAIL" || i.provider === "OUTLOOK") && i.status === "CONNECTED"
      );

      const hasCalendarConnected = integrations.some(
        (i) => i.provider === "GOOGLE_CALENDAR" && i.status === "CONNECTED"
      );

      const hasOutlookConnected = integrations.some(
        (i) => i.provider === "OUTLOOK" && i.status === "CONNECTED"
      );

      const hasSchedules = schedules.length > 0;
      const hasStyles = styles.length > 0;

      // 1. Email Config Warning
      if (!hasEmailConnected) {
        list.push({
          id: "no-email",
          type: "warning",
          message: "Connect your email to start receiving briefings",
          action: { label: "Connect Email", href: "/integrations" },
        });
      }

      // 2. Schedule Config Warning
      if (hasEmailConnected && !hasSchedules) {
        list.push({
          id: "no-schedule",
          type: "warning",
          message: "Create a schedule to receive daily briefings",
          action: { label: "Create Schedule", href: "/summaries" },
        });
      }

      // 3. Calendar Config Warning (informational)
      if (!hasCalendarConnected) {
        list.push({
          id: "no-calendar",
          type: "info",
          message: "Connect Google Calendar to sync meetings from briefings",
          action: { label: "Connect Calendar", href: "/integrations" },
        });
      }

      // 4. Outlook Sending Config Warning (informational)
      if (!hasOutlookConnected) {
        list.push({
          id: "no-outlook",
          type: "info",
          message: "Connect Outlook to send email replies and changes",
          action: { label: "Connect Outlook", href: "/integrations" },
        });
      }

      // 5. Style Config Warning (informational)
      if (!hasStyles) {
        list.push({
          id: "no-style",
          type: "info",
          message: "Create a briefing style to customize your summaries",
          action: { label: "Create Style", href: "/styles" },
        });
      }

      setWarnings(list);
      setIsLoading(false);
    };

    const fetchData = async () => {
      if (cachedIntegrations && cachedSchedules && cachedStyles) {
        updateWarnings(cachedIntegrations, cachedSchedules, cachedStyles);
        return;
      }

      if (isFetching) {
        const handleNotify = () => {
          if (cachedIntegrations && cachedSchedules && cachedStyles) {
            updateWarnings(cachedIntegrations, cachedSchedules, cachedStyles);
          }
        };
        listeners.add(handleNotify);
        return () => {
          listeners.delete(handleNotify);
        };
      }

      isFetching = true;
      try {
        const [integrations, schedules, styles] = await Promise.all([
          api.integrations.getAll(),
          api.schedules.getAll(),
          api.styles.getAll(),
        ]);
        cachedIntegrations = integrations;
        cachedSchedules = schedules;
        cachedStyles = styles;
        updateWarnings(integrations, schedules, styles);
        listeners.forEach((l) => l());
      } catch (err) {
        console.error("Failed to fetch config warning data:", err);
        setWarnings([]);
        setIsLoading(false);
      } finally {
        isFetching = false;
      }
    };

    fetchData();
  }, [isAuthenticated, user]);

  return { warnings, isLoading };
}

export function resetConfigWarningsCache() {
  cachedIntegrations = null;
  cachedSchedules = null;
  cachedStyles = null;
}
