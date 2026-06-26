"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  GoogleLogo,
  CalendarBlank,
  SlackLogo,
  NotionLogo,
  MicrosoftOutlookLogo,
  RssSimple,
  CheckCircle,
  XCircle,
  Clock,
  Warning,
  Plus,
  Trash,
  GithubLogo,
  PaperPlaneRight,
  Database
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/shared/Spinner";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { useAuth } from "@/contexts/AuthContext";
import api, { Integration, IntegrationStatus } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Integration Registry (Frontend Metadata) ─────────────────────────────
interface IntegrationMeta {
  provider: string;
  name: string;
  description: string;
  icon: any;
  iconColor: string;
  iconBg: string;
  iconBorder: string;
}

const METAS: Record<string, IntegrationMeta> = {
  GMAIL: {
    provider: "GMAIL",
    name: "Gmail",
    description: "Read emails for daily audio briefings",
    icon: GoogleLogo,
    iconColor: "text-red-500",
    iconBg: "bg-red-500/10",
    iconBorder: "border-red-500/20",
  },
  GOOGLE_CALENDAR: {
    provider: "GOOGLE_CALENDAR",
    name: "Google Calendar",
    description: "Sync action items and events from briefings",
    icon: CalendarBlank,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
    iconBorder: "border-blue-500/20",
  },
  OUTLOOK_MAIL: {
    provider: "OUTLOOK",
    name: "Outlook Mail",
    description: "Read emails for daily audio briefings",
    icon: MicrosoftOutlookLogo,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-600/10",
    iconBorder: "border-blue-600/20",
  },
  OUTLOOK_CALENDAR: {
    provider: "OUTLOOK",
    name: "Outlook Calendar",
    description: "Read calendar events for briefings",
    icon: CalendarBlank,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-600/10",
    iconBorder: "border-emerald-600/20",
  },
  OUTLOOK_SENDING: {
    provider: "OUTLOOK",
    name: "Outlook Sending",
    description: "Send email replies and change notifications from action items",
    icon: PaperPlaneRight,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-600/10",
    iconBorder: "border-blue-600/20",
  },
  GITHUB: {
    provider: "GITHUB",
    name: "GitHub",
    description: "Pull notifications, issues, and PR reviews into briefings",
    icon: GithubLogo,
    iconColor: "text-foreground",
    iconBg: "bg-foreground/5",
    iconBorder: "border-foreground/10",
  },
  RSS_FEED: {
    provider: "RSS_FEED",
    name: "RSS Feeds",
    description: "Subscribe to RSS feeds to include articles in briefings",
    icon: RssSimple,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    iconBorder: "border-orange-500/20",
  },
};

// ─── Status Badge Component ────────────────────────────────────────────────
function IntegrationStatusBadge({ status }: { status: IntegrationStatus }) {
  const config: Record<IntegrationStatus, { label: string; className: string; icon: React.ReactNode }> = {
    CONNECTED: {
      label: "Connected",
      className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/15",
      icon: <CheckCircle size={10} weight="fill" />,
    },
    DISCONNECTED: {
      label: "Disconnected",
      className: "bg-muted/40 text-muted-foreground border-border/40",
      icon: <XCircle size={10} weight="fill" />,
    },
    PENDING: {
      label: "Pending",
      className: "bg-amber-500/10 text-amber-500 border-amber-500/15",
      icon: <Clock size={10} weight="fill" />,
    },
    ERROR: {
      label: "Error",
      className: "bg-red-500/10 text-red-500 border-red-500/15",
      icon: <Warning size={10} weight="fill" />,
    },
  };

  const c = config[status];
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 text-[9px] font-mono font-black uppercase tracking-wider px-2.5 py-1 rounded-[var(--ds-radius-pill)] border",
      c.className,
    )}>
      {c.icon} {c.label}
    </span>
  );
}

// ─── Integration Card Component ────────────────────────────────────────────
function IntegrationCard({
  meta,
  status,
  isAvailable,
  onConnect,
  onDisconnect,
  isLoading,
  connectedAt,
}: {
  meta: IntegrationMeta;
  status: IntegrationStatus;
  isAvailable: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  isLoading: boolean;
  connectedAt?: string | null;
}) {
  const Icon = meta.icon;
  const isConnected = status === "CONNECTED";
  const isComingSoon = !isAvailable;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "group relative p-5 rounded-[var(--ds-radius-inner)] border transition-all duration-300",
        isConnected
          ? "border-emerald-500/15 bg-emerald-500/[0.02] hover:border-emerald-500/25"
          : "border-border/30 bg-card/20 hover:border-primary/20 hover:shadow-[var(--ds-shadow-hover)]",
        isComingSoon && "opacity-60",
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0 flex-1 w-full">
          {/* Icon */}
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 transition-transform duration-300 group-hover:scale-110",
            meta.iconBg,
            meta.iconBorder,
          )}>
            <Icon size={22} weight="fill" className={meta.iconColor} />
          </div>

          {/* Info */}
          <div className="min-w-0 space-y-1.5 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h4 className="text-sm font-black tracking-tight text-foreground">
                {meta.name}
              </h4>
              <IntegrationStatusBadge status={status} />
              {isComingSoon && (
                <span className="text-[9px] font-mono font-black text-primary bg-primary/5 border border-primary/10 px-2 py-0.5 rounded-[var(--ds-radius-pill)] uppercase tracking-wider">
                  Coming Soon
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              {meta.description}
            </p>
            {isConnected && connectedAt && (
              <p className="text-[10px] text-muted-foreground/50 font-medium">
                Connected {new Date(connectedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 w-full sm:w-auto flex justify-end sm:justify-start">
          {isComingSoon ? (
            <Button variant="outline" size="sm" disabled className="opacity-50 w-full sm:w-auto">
              Soon
            </Button>
          ) : isConnected ? (
            <Button
              variant="danger"
              size="sm"
              onClick={onDisconnect}
              disabled={isLoading}
              className="shrink-0 w-full sm:w-auto"
            >
              {isLoading ? <><Spinner size={12} /> Disconnecting...</> : "Disconnect"}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onConnect}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? <><Spinner size={12} /> Connecting...</> : "Connect"}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── RSS Feed Config Panel ─────────────────────────────────────────────────
function RssFeedConfig({
  integration,
  onSave,
  isSaving,
}: {
  integration: Integration;
  onSave: (urls: string[]) => void;
  isSaving: boolean;
}) {
  const existingUrls = (integration.metadata?.urls as string[]) || [];
  const [urls, setUrls] = useState<string[]>(existingUrls.length > 0 ? existingUrls : [""]);

  const addUrl = () => setUrls([...urls, ""]);
  const removeUrl = (idx: number) => setUrls(urls.filter((_, i) => i !== idx));
  const updateUrl = (idx: number, val: string) => {
    const next = [...urls];
    next[idx] = val;
    setUrls(next);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="overflow-hidden"
    >
      <div className="pt-4 mt-4 border-t border-border/20 space-y-4">
        <div className="space-y-1">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
            Feed URLs
          </Label>
          <p className="text-[10px] text-muted-foreground/50 font-medium ml-1">
            Add RSS or Atom feed URLs to include in your briefings.
          </p>
        </div>

        <div className="space-y-2.5">
          {urls.map((url, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={url}
                onChange={(e) => updateUrl(idx, e.target.value)}
                placeholder="https://blog.example.com/feed.xml"
                className="font-bold flex-1"
              />
              {urls.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeUrl(idx)}
                  className="h-10 w-10 shrink-0 text-muted-foreground hover:text-red-500"
                >
                  <Trash size={14} weight="bold" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={addUrl}>
            <Plus size={14} weight="bold" /> Add Feed
          </Button>
          <Button
            size="sm"
            onClick={() => onSave(urls.filter((u) => u.trim()))}
            disabled={isSaving}
          >
            {isSaving ? <><Spinner size={12} /> Saving...</> : <>Save Feeds</>}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page Content ─────────────────────────────────────────────────────
function IntegrationsPageContent() {
  const { isLoading: authLoading, isAuthenticated, user, connectGmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionProvider, setActionProvider] = useState<string | null>(null);
  const [expandedRss, setExpandedRss] = useState(false);
  const [rssSaving, setRssSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchIntegrations = useCallback(async () => {
    try {
      const data = await api.integrations.getAll();
      setIntegrations(data);
    } catch {
      toast.error("Failed to load integrations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchIntegrations();
    }
  }, [isAuthenticated, fetchIntegrations]);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const provider = searchParams.get("provider");
    const error = searchParams.get("error");

    if (connected === "true" && provider) {
      toast.success(`${provider.toUpperCase() === "GITHUB" ? "GitHub" : "Outlook"} connected successfully!`);
      router.replace("/integrations");
      void fetchIntegrations();
    } else if (connected === "false" && error) {
      toast.error(`Authentication failed: ${error}`);
      router.replace("/integrations");
    }
  }, [searchParams, router, fetchIntegrations]);

  const handleConnect = async (provider: string) => {
    if (provider === "GMAIL") {
      try {
        await connectGmail();
      } catch {
        toast.error("Failed to initiate Gmail connection");
      }
      return;
    }

    if (provider === "GOOGLE_CALENDAR") {
      try {
        await connectGmail();
      } catch {
        toast.error("Failed to initiate Google Calendar connection");
      }
      return;
    }

    if (provider === "RSS_FEED") {
      setExpandedRss(true);
      return;
    }

    if (provider === "GITHUB") {
      try {
        const { ticket } = await api.integrations.initOAuth("github");
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        window.location.href = `${apiBase}/integrations/github/connect?ticket=${encodeURIComponent(ticket)}`;
      } catch {
        toast.error("Failed to initiate GitHub connection handshake");
      }
      return;
    }

    if (provider === "OUTLOOK") {
      try {
        const { ticket } = await api.integrations.initOAuth("outlook");
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        window.location.href = `${apiBase}/integrations/outlook/connect?ticket=${encodeURIComponent(ticket)}`;
      } catch {
        toast.error("Failed to initiate Outlook connection handshake");
      }
      return;
    }

    setActionProvider(provider);
    try {
      await api.integrations.connect(provider);
      await fetchIntegrations();
      toast.success("Connected!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setActionProvider(null);
    }
  };

  const handleDisconnect = async (provider: string) => {
    setActionProvider(provider);
    try {
      await api.integrations.disconnect(provider);
      await fetchIntegrations();
      toast.success("Integration disconnected");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setActionProvider(null);
    }
  };

  const handleRssSave = async (urls: string[]) => {
    setRssSaving(true);
    try {
      await api.integrations.connect("RSS_FEED", { metadata: { urls } });
      await fetchIntegrations();
      toast.success("RSS feeds saved");
    } catch {
      toast.error("Failed to save RSS feeds");
    } finally {
      setRssSaving(false);
    }
  };

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) return null;

  // Retrieve integrations state helper
  const getIntegration = (provider: string) => integrations.find((i) => i.provider === provider);

  const gmail = getIntegration("GMAIL");
  const gcal = getIntegration("GOOGLE_CALENDAR");
  const outlook = getIntegration("OUTLOOK");
  const github = getIntegration("GITHUB");
  const rss = getIntegration("RSS_FEED");
  const slack = getIntegration("SLACK");
  const notion = getIntegration("NOTION");

  const connectedCount = integrations.filter((i) => i.status === "CONNECTED").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="max-w-4xl mx-auto pb-32 space-y-8 px-4 md:px-0"
    >
      <PageHeader
        title="Integrations"
        description="Connect your email, calendar, and digital sources to enrich daily briefings."
        action={
          connectedCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/15 px-3 py-1.5 rounded-[var(--ds-radius-pill)] uppercase tracking-wider">
              <CheckCircle size={12} weight="fill" />
              {connectedCount} Connected
            </span>
          ) : undefined
        }
      />

      {/* 📧 Email Providers Section */}
      <SectionCard
        icon={<GoogleLogo size={22} weight="fill" />}
        title="Email Providers (Reading)"
        description="Fetch noisy inbox threads to compile overnight summaries."
      >
        <div className="space-y-3">
          {gmail && (
            <IntegrationCard
              meta={METAS.GMAIL}
              status={gmail.status}
              isAvailable={gmail.isAvailable}
              onConnect={() => handleConnect("GMAIL")}
              onDisconnect={() => handleDisconnect("GMAIL")}
              isLoading={actionProvider === "GMAIL"}
              connectedAt={gmail.connectedAt}
            />
          )}
          {outlook && (
            <IntegrationCard
              meta={METAS.OUTLOOK_MAIL}
              status={outlook.status}
              isAvailable={outlook.isAvailable}
              onConnect={() => handleConnect("OUTLOOK")}
              onDisconnect={() => handleDisconnect("OUTLOOK")}
              isLoading={actionProvider === "OUTLOOK"}
              connectedAt={outlook.connectedAt}
            />
          )}
        </div>
      </SectionCard>

      {/* 📅 Calendar Section */}
      <SectionCard
        icon={<CalendarBlank size={22} weight="fill" />}
        title="Calendar Connections"
        description="Detect standup conflicts, list meetings, and automate booking."
      >
        <div className="space-y-3">
          {gcal && (
            <IntegrationCard
              meta={METAS.GOOGLE_CALENDAR}
              status={gcal.status}
              isAvailable={gcal.isAvailable}
              onConnect={() => handleConnect("GOOGLE_CALENDAR")}
              onDisconnect={() => handleDisconnect("GOOGLE_CALENDAR")}
              isLoading={actionProvider === "GOOGLE_CALENDAR"}
              connectedAt={gcal.connectedAt}
            />
          )}
          {outlook && (
            <IntegrationCard
              meta={METAS.OUTLOOK_CALENDAR}
              status={outlook.status}
              isAvailable={outlook.isAvailable}
              onConnect={() => handleConnect("OUTLOOK")}
              onDisconnect={() => handleDisconnect("OUTLOOK")}
              isLoading={actionProvider === "OUTLOOK"}
              connectedAt={outlook.connectedAt}
            />
          )}
        </div>
      </SectionCard>

      {/* 📤 Email Sending Section */}
      <SectionCard
        icon={<PaperPlaneRight size={22} weight="fill" />}
        title="Email Sending (Replies & Actions)"
        description="Send generated drafts and standup change notifications."
      >
        <div className="space-y-3">
          {outlook && (
            <IntegrationCard
              meta={METAS.OUTLOOK_SENDING}
              status={outlook.status}
              isAvailable={outlook.isAvailable}
              onConnect={() => handleConnect("OUTLOOK")}
              onDisconnect={() => handleDisconnect("OUTLOOK")}
              isLoading={actionProvider === "OUTLOOK"}
              connectedAt={outlook.connectedAt}
            />
          )}

          {/* Gmail sending placeholder */}
          <div className="p-5 rounded-[var(--ds-radius-inner)] border border-dashed border-black/10 dark:border-white/10 opacity-60 bg-card/10 flex items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 bg-red-500/5 border-red-500/10 text-red-500/60">
                <GoogleLogo size={22} weight="fill" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black tracking-tight text-foreground">
                    Gmail Sending
                  </h4>
                  <span className="text-[9px] font-mono font-black text-primary bg-primary/5 border border-primary/10 px-2 py-0.5 rounded-[var(--ds-radius-pill)] uppercase tracking-wider">
                    Coming Soon
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  Gmail sending scope is pending Google verification.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>Soon</Button>
          </div>
        </div>
      </SectionCard>

      {/* 🔌 Data Sources Section */}
      <SectionCard
        icon={<Database size={22} weight="fill" />}
        title="Data Sources & Plugins"
        description="Enrich briefings with articles, issues, and messaging digests."
      >
        <div className="space-y-3">
          {github && (
            <IntegrationCard
              meta={METAS.GITHUB}
              status={github.status}
              isAvailable={github.isAvailable}
              onConnect={() => handleConnect("GITHUB")}
              onDisconnect={() => handleDisconnect("GITHUB")}
              isLoading={actionProvider === "GITHUB"}
              connectedAt={github.connectedAt}
            />
          )}

          {rss && (
            <div>
              <IntegrationCard
                meta={METAS.RSS_FEED}
                status={rss.status}
                isAvailable={rss.isAvailable}
                onConnect={() => handleConnect("RSS_FEED")}
                onDisconnect={() => handleDisconnect("RSS_FEED")}
                isLoading={actionProvider === "RSS_FEED"}
                connectedAt={rss.connectedAt}
              />
              {rss.status === "CONNECTED" && (
                <div className="ml-0 sm:ml-15 pl-3 sm:pl-4 border-l-2 border-primary/10 mt-3">
                  <RssFeedConfig
                    integration={rss}
                    onSave={handleRssSave}
                    isSaving={rssSaving}
                  />
                </div>
              )}
            </div>
          )}

          {slack && (
            <IntegrationCard
              meta={{
                provider: "SLACK",
                name: "Slack",
                description: "Pull updates and channel highlights into briefings",
                icon: SlackLogo,
                iconColor: "text-purple-500",
                iconBg: "bg-purple-500/10",
                iconBorder: "border-purple-500/20",
              }}
              status={slack.status}
              isAvailable={slack.isAvailable}
              onConnect={() => {}}
              onDisconnect={() => {}}
              isLoading={false}
            />
          )}

          {notion && (
            <IntegrationCard
              meta={{
                provider: "NOTION",
                name: "Notion",
                description: "Include page updates and database items in digests",
                icon: NotionLogo,
                iconColor: "text-foreground",
                iconBg: "bg-foreground/5",
                iconBorder: "border-foreground/10",
              }}
              status={notion.status}
              isAvailable={notion.isAvailable}
              onConnect={() => {}}
              onDisconnect={() => {}}
              isLoading={false}
            />
          )}
        </div>
      </SectionCard>
    </motion.div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <IntegrationsPageContent />
    </Suspense>
  );
}
