"use client";

import { Envelope, Clock, HourglassHigh, TrendUp } from "@phosphor-icons/react";
import { Spinner } from "@/components/shared/Spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Brief } from "@/lib/api";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  briefs: Brief[];
  isLoading: boolean;
}

const getTopCategory = (briefs: Brief[]) => {
  const counts: Record<string, number> = {};
  for (const brief of briefs) {
    const cats = (
      brief as unknown as { categoryCounts?: Record<string, number> }
    ).categoryCounts;
    if (!cats || typeof cats !== "object") continue;
    for (const [k, v] of Object.entries(cats)) {
      counts[k] = (counts[k] || 0) + (Number(v) || 0);
    }
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || "—";
};

const getCurrentStreak = (briefs: Brief[]) => {
  const delivered = briefs
    .filter((b) => b.status === "DELIVERED")
    .map((b) => new Date(b.date).toISOString().slice(0, 10));

  const uniqueDates = [...new Set(delivered)].sort().reverse();
  if (!uniqueDates.length) return 0;

  let streak = 0;
  const cursor = new Date();
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (uniqueDates.includes(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
};

export const StatsCards = ({ briefs, isLoading }: StatsCardsProps) => {
  const totalEmails = briefs.reduce(
    (sum, b) => sum + (b.emailsProcessed || 0),
    0,
  );
  const totalDuration = briefs.reduce(
    (sum, b) => sum + (b.audioDuration || 0),
    0,
  );
  const listeningMinutes = Math.floor(totalDuration / 60);
  const estimatedTimeSaved = totalEmails * 2;
  const deliveredBriefs = briefs.filter((b) => b.status === "DELIVERED").length;
  const efficiency =
    briefs.length > 0 ? Math.round((deliveredBriefs / briefs.length) * 100) : 0;
  const topCategory = getTopCategory(briefs);
  const streak = getCurrentStreak(briefs);

  const stats = [
    {
      label: "Emails Processed",
      value: isLoading ? "—" : totalEmails.toString(),
      sub: `${briefs.length} briefs`,
      icon: <Envelope size={22} weight="duotone" />,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-2 border-blue-500/30 dark:bg-blue-500/[0.12]",
    },
    {
      label: "Listening Time",
      value: isLoading ? "—" : `${listeningMinutes}m`,
      sub: `Top category: ${topCategory}`,
      icon: <Clock size={22} weight="duotone" />,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-2 border-amber-500/30 dark:bg-amber-500/[0.12]",
    },
    {
      label: "AI Time Saved",
      value: isLoading
        ? "—"
        : `${Math.floor(estimatedTimeSaved / 60)}h ${estimatedTimeSaved % 60}m`,
      sub: `Streak: ${streak} day${streak === 1 ? "" : "s"}`,
      icon: <HourglassHigh size={22} weight="duotone" />,
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-2 border-purple-500/30 dark:bg-purple-500/[0.12]",
    },
    {
      label: "Success Rate",
      value: isLoading ? "—" : `${efficiency}%`,
      sub: `${deliveredBriefs} delivered`,
      icon: <TrendUp size={22} weight="duotone" />,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500/30 dark:bg-emerald-500/[0.12]",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="opacity-0 animate-fade-in"
          style={{ animationDelay: `${index * 0.08}s` }}
        >
          <Card className="border-2 border-black dark:border-zinc-700 bg-card shadow-[var(--ds-shadow-card)] hover:shadow-[var(--ds-shadow-hover)] transition-spring-normal rounded-[var(--ds-radius-inner)]">
            <CardContent className="p-3.5 md:p-6">
              <div className="flex items-start justify-between gap-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground mb-1 truncate">
                    {stat.label}
                  </p>
                  <h3 className="text-xl md:text-2xl font-black truncate">
                    {isLoading ? <Spinner size={20} /> : stat.value}
                  </h3>
                  <p className="text-[9px] font-black text-muted-foreground/60 mt-1 uppercase tracking-widest truncate">
                    {stat.sub}
                  </p>
                </div>
                <div
                  className={cn(
                    "w-10 h-10 rounded-[var(--ds-radius-inner)] hidden sm:flex items-center justify-center shrink-0 transition-spring-snappy hover:scale-105",
                    stat.color
                  )}
                >
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};
