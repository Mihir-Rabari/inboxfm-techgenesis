"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  ChartBar,
  ArrowClockwise,
  Plus,
  EnvelopeSimple,
  Headphones,
  CaretRight,
  CaretDown,
  CaretUp,
  MagnifyingGlass,
  Star,
  ChatCircleDots,
  Megaphone,
  Clock,
  Fire,
  TrendUp,
  Database,
  ListChecks,
  CheckCircle,
  XCircle,
  Trash,
  Bell,
  Pause,
  Play,
  Stop,
  FileCsv,
  UploadSimple,
  WarningCircle,
  Eye,
  CaretLeft,
  X,
} from "@phosphor-icons/react";
import { Spinner } from "@/components/shared/Spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import api, {
  AdminAnalytics,
  SupportTicket,
  FeedbackEntry,
  FeedbackStats,
  Release,
  User,
  WaitlistEntry,
} from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TabId =
  | "analytics"
  | "users"
  | "waitlist"
  | "support"
  | "feedback"
  | "releases"
  | "comms";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "analytics",
    label: "Analytics",
    icon: <ChartBar size={18} weight="fill" />,
  },
  { id: "users", label: "Users", icon: <Users size={18} weight="fill" /> },
  {
    id: "waitlist",
    label: "Waitlist",
    icon: <ListChecks size={18} weight="fill" />,
  },
  {
    id: "support",
    label: "Support",
    icon: <ChatCircleDots size={18} weight="fill" />,
  },
  { id: "feedback", label: "Feedback", icon: <Star size={18} weight="fill" /> },
  {
    id: "releases",
    label: "Releases",
    icon: <Megaphone size={18} weight="fill" />,
  },
  {
    id: "comms",
    label: "Broadcast",
    icon: <EnvelopeSimple size={18} weight="fill" />,
  },
];

// Schedule Heatmap Component
function ScheduleHeatmap({ data }: { data: Record<number, number> }) {
  const maxCount = Math.max(...Object.values(data), 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="grid grid-cols-12 gap-1">
      {hours.map((hour) => {
        const count = data[hour] || 0;
        const intensity = count / maxCount;
        return (
          <div
            key={hour}
            className="aspect-square rounded-md flex items-center justify-center text-[10px] font-bold cursor-default transition-transform hover:scale-110"
            style={{
              backgroundColor:
                intensity > 0
                  ? `rgba(249, 115, 22, ${0.2 + intensity * 0.8})`
                  : "#f4f4f5",
              color: intensity > 0.5 ? "white" : "#71717a",
            }}
            title={`${hour}:00 - ${count} schedule${count !== 1 ? "s" : ""}`}
          >
            {hour}
          </div>
        );
      })}
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon,
  trend,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
            {label}
          </p>
          <p className="text-3xl font-black">{value}</p>
          {trend && (
            <p className="text-xs text-green-600 font-bold mt-1 flex items-center gap-1">
              <TrendUp size={12} weight="bold" />
              {trend}
            </p>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary to-orange-600 flex items-center justify-center text-white">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabId>("analytics");
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(
    null,
  );
  const [releases, setReleases] = useState<Release[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [waitlistSearch, setWaitlistSearch] = useState("");
  const [waitlistFilter, setWaitlistFilter] = useState<"ALL" | "PENDING" | "WAITLISTED" | "APPROVED" | "REJECTED">("ALL");
  const [expandedWaitlistIds, setExpandedWaitlistIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Email state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  // New Marketing Email States
  const [senderPrefix, setSenderPrefix] = useState("newsletter");
  const [recipientType, setRecipientType] = useState<"csv" | "single">("single");
  const [singleRecipient, setSingleRecipient] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null);
  const [selectedToHeader, setSelectedToHeader] = useState("");
  
  // Autocomplete @ popup states
  const [activeInput, setActiveInput] = useState<"to" | "subject" | "body" | null>(null);
  const [showVarDropdown, setShowVarDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Refs for tracking cursor insertion
  const toRef = useRef<HTMLInputElement | null>(null);
  const subjectRef = useRef<HTMLInputElement | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  // Broadcast Live Progress States
  const [broadcastStatus, setBroadcastStatus] = useState<"idle" | "sending" | "paused" | "completed" | "cancelled">("idle");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalRecipients, setTotalRecipients] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failureCount, setFailureCount] = useState(0);
  const [sendLogs, setSendLogs] = useState<{ email: string; status: "success" | "failed"; error?: string }[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Keep references to values inside the async loops
  const isSendingRef = useRef(false);
  const currentIndexRef = useRef(0);
  const sendingListRef = useRef<any[]>([]);

  // Release state
  const [newRelease, setNewRelease] = useState({
    version: "",
    title: "",
    content: "",
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Load core data first
        const [analyticsData, usersData] = await Promise.all([
          api.admin.getAnalytics().catch((err) => {
            console.error("Analytics failed", err);
            return null;
          }),
          api.admin.getUsers().catch((err) => {
            console.error("Users failed", err);
            return [];
          }),
        ]);

        if (analyticsData) setAnalytics(analyticsData);
        setUsers(usersData || []);

        // Load additional data
        const [
          ticketsData,
          feedbackData,
          feedbackStatsData,
          releasesData,
          waitlistData,
        ] = await Promise.all([
          api.admin.getTickets().catch(() => []),
          api.admin.getFeedback().catch(() => []),
          api.admin.getFeedbackStats().catch(() => null),
          api.admin.getReleases().catch(() => []),
          api.admin.getWaitlist().catch(() => []),
        ]);

        setTickets(ticketsData || []);
        setFeedback(feedbackData || []);
        setFeedbackStats(feedbackStatsData);
        setReleases(releasesData || []);
        setWaitlist(waitlistData || []);
      } catch (err) {
        console.error("Critical admin load error:", err);
        toast.error("Failed to load admin data", {
          description:
            err instanceof Error
              ? err.message
              : "Please try refreshing the page",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleApproveWaitlist = async (id: string) => {
    try {
      const updated = await api.admin.approveWaitlist(id);
      setWaitlist((prev) => prev.map((w) => (w.id === id ? updated : w)));
      toast.success("Access code sent! User has been approved and emailed.");
    } catch (err) {
      toast.error("Failed to approve waitlist entry", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  const handleRejectWaitlist = async (id: string) => {
    try {
      const updated = await api.admin.rejectWaitlist(id);
      setWaitlist((prev) => prev.map((w) => (w.id === id ? updated : w)));
      toast.success("Waitlist entry rejected.");
    } catch {
      toast.error("Failed to reject waitlist entry");
    }
  };

  const handleDeleteWaitlist = async (id: string) => {
    try {
      await api.admin.deleteWaitlist(id);
      setWaitlist((prev) => prev.filter((w) => w.id !== id));
      toast.success("Waitlist entry deleted.");
    } catch {
      toast.error("Failed to delete waitlist entry");
    }
  };

  const handleWaitlistWaitlist = async (id: string) => {
    try {
      const updated = await api.admin.waitlistWaitlist(id);
      setWaitlist((prev) => prev.map((w) => (w.id === id ? updated : w)));
      toast.success("Waitlist entry moved to waitlist status.");
    } catch {
      toast.error("Failed to move waitlist entry to waitlist status.");
    }
  };

  const toggleExpandWaitlist = (id: string) => {
    setExpandedWaitlistIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSendEmail = async () => {
    if (!emailSubject || !emailMessage || selectedUserIds.length === 0) {
      toast.error("Please select users and fill in all fields");
      return;
    }

    try {
      setIsSending(true);
      await api.admin.sendEmail({
        userIds: selectedUserIds,
        subject: emailSubject,
        message: emailMessage,
      });
      toast.success(`Email sent to ${selectedUserIds.length} users`);
      setEmailSubject("");
      setEmailMessage("");
      setSelectedUserIds([]);
    } catch {
      toast.error("Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  // CSV parser and state helpers
  const parseCSVText = (text: string) => {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return { headers: [], rows: [] };
    
    const rawHeaders = lines[0].split(",");
    const headers = rawHeaders.map(h => h.trim().replace(/^["']|["']$/g, ""));
    const rows: Record<string, string>[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim().replace(/^["']|["']$/g, ""));
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^["']|["']$/g, ""));
      
      const rowObj: Record<string, string> = {};
      headers.forEach((header, index) => {
        rowObj[header] = values[index] || "";
      });
      rows.push(rowObj);
    }
    return { headers, rows };
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { headers, rows } = parseCSVText(text);
      setCsvData({ headers, rows });
      
      // Auto select email header if present
      const emailHeader = headers.find(h => h.toLowerCase().includes("email") || h.toLowerCase() === "to");
      if (emailHeader) {
        setSelectedToHeader(emailHeader);
      } else if (headers.length > 0) {
        setSelectedToHeader(headers[0]);
      }
      toast.success(`CSV loaded: ${rows.length} records found`);
    };
    reader.readAsText(file);
  };

  // Autocomplete @ dynamic variables
  const availableVariables = csvData?.headers || ["First_name", "Email"];
  const filteredVariables = availableVariables.filter((v: string) => 
    v.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Autocomplete @ dynamic input trigger
  const handleInputChange = (
    val: string,
    field: "to" | "subject" | "body",
    target: HTMLInputElement | HTMLTextAreaElement
  ) => {
    const cursorPos = target.selectionStart || 0;
    
    if (field === "to") {
      setSingleRecipient(val);
    } else if (field === "subject") {
      setEmailSubject(val);
    } else if (field === "body") {
      setEmailMessage(val);
    }

    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtIndex !== -1 && (lastAtIndex === 0 || /\s/.test(textBeforeCursor[lastAtIndex - 1]))) {
      const query = textBeforeCursor.slice(lastAtIndex + 1);
      if (!/\s/.test(query)) {
        setActiveInput(field);
        setShowVarDropdown(true);
        setSearchQuery(query);
        return;
      }
    }
    
    setShowVarDropdown(false);
  };

  const handleSelectVariable = (variable: string) => {
    let text = "";
    let setter: (v: string) => void = () => {};
    let ref: HTMLInputElement | HTMLTextAreaElement | null = null;
    
    if (activeInput === "to") {
      if (recipientType === "csv") {
        setSelectedToHeader(variable);
        setShowVarDropdown(false);
        return;
      } else {
        text = singleRecipient;
        setter = setSingleRecipient;
        ref = toRef.current;
      }
    } else if (activeInput === "subject") {
      text = emailSubject;
      setter = setEmailSubject;
      ref = subjectRef.current;
    } else if (activeInput === "body") {
      text = emailMessage;
      setter = setEmailMessage;
      ref = bodyRef.current;
    }
    
    if (!ref) return;
    
    const cursorPos = ref.selectionStart || 0;
    const textBeforeCursor = text.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf("@");
    
    if (atIndex !== -1) {
      const replacement = `{{${variable}}}`;
      const newText = text.slice(0, atIndex) + replacement + text.slice(cursorPos);
      setter(newText);
      
      setTimeout(() => {
        if (ref) {
          ref.focus();
          const newCursorPos = atIndex + replacement.length;
          ref.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 50);
    }
    
    setShowVarDropdown(false);
  };

  // Broadcast Loops and State Controllers
  const fromEmail = `${senderPrefix.trim().toLowerCase()}@inboxfm.me`;

  const getPreviewCompiled = (template: string) => {
    if (recipientType === "single") {
      return template
        .replace(/{{First_name}}/g, "Mihir")
        .replace(/{{Email}}/g, singleRecipient || "mihir@inboxfm.me");
    }
    if (!csvData || csvData.rows.length === 0) {
      return template;
    }
    const row = csvData.rows[previewIndex] || csvData.rows[0];
    let result = template;
    Object.entries(row).forEach(([key, val]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      result = result.replace(regex, (val as string) || "");
    });
    return result;
  };

  const startBroadcast = async () => {
    let list: { email: string; variables: Record<string, string> }[] = [];
    
    if (recipientType === "single") {
      if (!singleRecipient.trim()) {
        toast.error("Please enter a recipient email address");
        return;
      }
      list = [{ email: singleRecipient.trim(), variables: { First_name: "Customer", Email: singleRecipient.trim() } }];
    } else {
      if (!csvData || csvData.rows.length === 0) {
        toast.error("Please upload a valid CSV file");
        return;
      }
      if (!selectedToHeader) {
        toast.error("Please select the CSV column containing emails");
        return;
      }
      list = csvData.rows.map(row => ({
        email: row[selectedToHeader] || "",
        variables: row
      })).filter(item => item.email.trim() !== "");
      
      if (list.length === 0) {
        toast.error("No valid emails found in the selected CSV column");
        return;
      }
    }

    if (!emailSubject.trim()) {
      toast.error("Please enter an email subject");
      return;
    }
    if (!emailMessage.trim()) {
      toast.error("Please compose your email body");
      return;
    }

    // Reset progress
    setCurrentIndex(0);
    setSuccessCount(0);
    setFailureCount(0);
    setSendLogs([]);
    setTotalRecipients(list.length);
    
    currentIndexRef.current = 0;
    sendingListRef.current = list;
    isSendingRef.current = true;
    
    setBroadcastStatus("sending");
    runSendingLoop();
  };

  const runSendingLoop = async () => {
    const list = sendingListRef.current;
    
    for (let i = currentIndexRef.current; i < list.length; i++) {
      if (!isSendingRef.current) {
        break;
      }
      
      const recipient = list[i];
      setCurrentIndex(i);
      
      let compiledSubject = emailSubject;
      let compiledBody = emailMessage;
      
      Object.entries(recipient.variables || {}).forEach(([key, val]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
        compiledSubject = compiledSubject.replace(regex, (val as string) || "");
        compiledBody = compiledBody.replace(regex, (val as string) || "");
      });
      
      try {
        await api.admin.sendCustomEmail({
          to: recipient.email,
          fromEmail: fromEmail,
          subject: compiledSubject,
          message: compiledBody
        });
        
        setSuccessCount(prev => prev + 1);
        setSendLogs(prev => [
          { email: recipient.email, status: "success" },
          ...prev
        ]);
      } catch (err: any) {
        setFailureCount(prev => prev + 1);
        setSendLogs(prev => [
          { email: recipient.email, status: "failed", error: err.message || "Failed to send" },
          ...prev
        ]);
      }
      
      currentIndexRef.current = i + 1;
      
      // Delay
      await new Promise(resolve => setTimeout(resolve, 350));
    }
    
    if (currentIndexRef.current >= list.length) {
      setBroadcastStatus("completed");
      isSendingRef.current = false;
      toast.success("Email campaign completed!");
    }
  };

  const pauseBroadcast = () => {
    isSendingRef.current = false;
    setBroadcastStatus("paused");
    toast.info("Broadcast paused");
  };

  const resumeBroadcast = () => {
    isSendingRef.current = true;
    setBroadcastStatus("sending");
    runSendingLoop();
    toast.info("Broadcast resumed");
  };

  const cancelBroadcast = () => {
    isSendingRef.current = false;
    setBroadcastStatus("cancelled");
    toast.error("Broadcast cancelled");
  };

  const resetBroadcast = () => {
    setBroadcastStatus("idle");
    setCurrentIndex(0);
    setSuccessCount(0);
    setFailureCount(0);
    setSendLogs([]);
    currentIndexRef.current = 0;
    sendingListRef.current = [];
  };

  const handleCreateRelease = async () => {
    if (!newRelease.version || !newRelease.title || !newRelease.content) {
      toast.error("Please fill in all release fields");
      return;
    }

    try {
      const release = await api.admin.createRelease(newRelease);
      setReleases((prev) => [release, ...prev]);
      setNewRelease({ version: "", title: "", content: "" });
      toast.success("Release note created");
    } catch {
      toast.error("Failed to create release");
    }
  };

  const handleBroadcastRelease = async (id: string) => {
    try {
      const result = await api.admin.broadcastRelease(id);
      toast.success(`Release broadcast to ${result.sentCount} users`);
    } catch {
      toast.error("Failed to broadcast release");
    }
  };

  const handleUpdateTicket = async (
    id: string,
    status: SupportTicket["status"],
  ) => {
    try {
      await api.admin.updateTicket(id, { status });
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status } : t)),
      );
      toast.success("Ticket updated");
    } catch {
      toast.error("Failed to update ticket");
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Spinner size={48} className="text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden h-full bg-muted/10">
      {/* Sidebar */}
      <div className="w-64 bg-zinc-950 text-white flex flex-col flex-none border-r border-white/5 h-full">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-orange-600 flex items-center justify-center text-white">
              <Headphones size={20} weight="fill" />
            </div>
            <div>
              <h1 className="font-black text-lg">Inbox FM</h1>
              <p className="text-xs text-white/40">Workspace Options</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {TABS.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-bold transition-all ${
                    activeTab === tab.id
                      ? "bg-primary text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {activeTab === tab.id && (
                    <CaretRight size={14} className="ml-auto" weight="bold" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0) || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">
                {user?.name || "Admin"}
              </p>
              <p className="text-xs text-white/60 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto h-full">
        <AnimatePresence mode="wait">
          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 max-w-6xl mx-auto"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black">Analytics</h2>
                  <p className="text-muted-foreground">
                    Platform overview and statistics
                  </p>
                </div>
                <Button variant="outline" className="rounded-full gap-2 border-border text-foreground hover:bg-muted">
                  <ArrowClockwise size={16} weight="bold" />
                  Refresh
                </Button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4">
                <StatCard
                  label="Total Users"
                  value={analytics?.totalUsers || 0}
                  icon={<Users size={20} weight="fill" />}
                  trend={`+${analytics?.newUsersThisWeek || 0} this week`}
                />
                <StatCard
                  label="Active Users"
                  value={analytics?.activeUsers || 0}
                  icon={<Fire size={20} weight="fill" />}
                />
                <StatCard
                  label="Total Briefs"
                  value={analytics?.totalBriefs || 0}
                  icon={<Headphones size={20} weight="fill" />}
                />
                <StatCard
                  label="Push Subscribers"
                  value={analytics?.totalPushSubscriptions || 0}
                  icon={<Bell size={20} weight="fill" />}
                  trend={`${Math.round((analytics?.totalPushSubscriptions || 0) / Math.max(analytics?.totalUsers || 1, 1) * 100)}% adoption`}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Schedule Heatmap */}
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock size={20} weight="fill" className="text-primary" />
                      Schedule Heatmap
                    </CardTitle>
                    <CardDescription>
                      Distribution of delivery times (24hr)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics?.scheduleHeatmap && (
                      <ScheduleHeatmap data={analytics.scheduleHeatmap} />
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database
                        size={20}
                        weight="fill"
                        className="text-primary"
                      />
                      System Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-muted/50 rounded-xl">
                      <span className="text-sm font-bold">Total Summaries</span>
                      <span className="text-2xl font-black">
                        {analytics?.totalSummaries || 0}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-muted/50 rounded-xl">
                      <span className="text-sm font-bold">
                        Processing Queue
                      </span>
                      <span className="text-2xl font-black">
                        {analytics?.processingQueue || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-muted/50 rounded-xl">
                      <span className="text-sm font-bold">
                        Avg. Brief Duration
                      </span>
                      <span className="text-2xl font-black">
                        {analytics?.averageDuration || 0}s
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-950 rounded-xl">
                      <span className="text-sm font-bold">Gmail Connected</span>
                      <span className="text-2xl font-black">
                        {analytics?.activeGmailUsers || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Growth Charts */}
              <div className="grid grid-cols-2 gap-6">
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendUp size={20} weight="fill" className="text-primary" />
                      User Growth (30d)
                    </CardTitle>
                    <CardDescription>
                      New registrations per day
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-auto">
                      {analytics?.userGrowth &&
                        Object.entries(analytics.userGrowth).map(([date, count]) => (
                          <div
                            key={date}
                            className="flex items-center justify-between p-2 hover:bg-muted/50 rounded"
                          >
                            <span className="text-xs text-muted-foreground">
                              {new Date(date).toLocaleDateString()}
                            </span>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2 bg-primary rounded-full"
                                style={{
                                  width: `${Math.min(count * 20, 100)}px`,
                                }}
                              />
                              <span className="text-sm font-bold w-8 text-right">
                                {count}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell size={20} weight="fill" className="text-primary" />
                      Push Subscriptions (30d)
                    </CardTitle>
                    <CardDescription>
                      New push notification subscribers per day
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-auto">
                      {analytics?.pushSubscriptionGrowth &&
                        Object.entries(analytics.pushSubscriptionGrowth).map(
                          ([date, count]) => (
                            <div
                              key={date}
                              className="flex items-center justify-between p-2 hover:bg-muted/50 rounded"
                            >
                              <span className="text-xs text-muted-foreground">
                                {new Date(date).toLocaleDateString()}
                              </span>
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-2 bg-green-500 rounded-full"
                                  style={{
                                    width: `${Math.min(count * 20, 100)}px`,
                                  }}
                                />
                                <span className="text-sm font-bold w-8 text-right">
                                  {count}
                                </span>
                              </div>
                            </div>
                          )
                        )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black">Users</h2>
                  <p className="text-muted-foreground">All registered users</p>
                </div>
                <Badge variant="secondary" className="text-base px-4 py-2 border">
                  {users.length} total
                </Badge>
              </div>

              <Card className="rounded-2xl overflow-hidden border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Gmail</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {u.picture ? (
                              <Image
                                src={u.picture}
                                alt=""
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-full"
                                unoptimized
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                                {u.name?.charAt(0) ||
                                  u.email.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="font-medium">
                              {u.name || "Anonymous"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {u.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={u.gmailConnected ? "default" : "secondary"}
                          >
                            {u.gmailConnected ? "Connected" : "Not Connected"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </motion.div>
          )}

          {/* Waitlist Tab */}
          {activeTab === "waitlist" && (
            <motion.div
              key="waitlist"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black">Waitlist & Applications</h2>
                  <p className="text-muted-foreground">
                    Review and manage early access applications
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary" className="text-sm px-3 py-1.5 border bg-zinc-900 text-[#B8B8B8] border-zinc-800">
                    {waitlist.filter((w) => w.status === "PENDING").length} pending
                  </Badge>
                  <Badge variant="secondary" className="text-sm px-3 py-1.5 border bg-zinc-900 text-[#B8B8B8] border-zinc-800">
                    {waitlist.filter((w) => w.status === "WAITLISTED").length} waitlisted
                  </Badge>
                  <Badge variant="default" className="text-sm px-3 py-1.5 bg-brand-orange text-black">
                    {waitlist.length} total
                  </Badge>
                </div>
              </div>

              {/* Filters & Search Control Bar */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-[#161519]/60 p-4 rounded-[var(--ds-radius-card)] border border-zinc-800/80">
                <div className="md:col-span-5 relative">
                  <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-muted-foreground/60">
                    <MagnifyingGlass size={16} />
                  </div>
                  <Input
                    placeholder="Search by name or email..."
                    value={waitlistSearch}
                    onChange={(e) => setWaitlistSearch(e.target.value)}
                    className="pl-10 font-semibold border-2 border-zinc-800 bg-[#0B0B0B] text-[#E5D8C9] rounded-[var(--ds-radius-inner)]"
                  />
                </div>
                <div className="md:col-span-7 flex flex-wrap gap-2 justify-end">
                  {(["ALL", "PENDING", "WAITLISTED", "APPROVED", "REJECTED"] as const).map((status) => (
                    <Button
                      key={status}
                      variant={waitlistFilter === status ? "default" : "outline"}
                      onClick={() => setWaitlistFilter(status)}
                      size="sm"
                      className={`font-black text-[10px] uppercase tracking-wider rounded-xl h-9 px-3 ${
                        waitlistFilter === status
                          ? "bg-brand-orange text-black hover:bg-brand-orange/90"
                          : "border-zinc-800 text-muted-foreground hover:text-foreground hover:bg-zinc-900"
                      }`}
                    >
                      {status === "ALL" ? "All" : status.toLowerCase()}
                    </Button>
                  ))}
                </div>
              </div>

              {/* CRM Card Feed Layout */}
              <div className="space-y-4">
                {(() => {
                  const filteredWaitlist = waitlist.filter((entry) => {
                    const matchesSearch =
                      entry.email.toLowerCase().includes(waitlistSearch.toLowerCase()) ||
                      (entry.name && entry.name.toLowerCase().includes(waitlistSearch.toLowerCase()));
                    const matchesStatus = waitlistFilter === "ALL" || entry.status === waitlistFilter;
                    return matchesSearch && matchesStatus;
                  });

                  if (filteredWaitlist.length === 0) {
                    return (
                      <Card className="rounded-[var(--ds-radius-card)] overflow-hidden border border-zinc-800 p-16 text-center">
                        <ListChecks
                          size={44}
                          className="mx-auto mb-3 text-brand-orange opacity-40"
                        />
                        <p className="font-black text-lg text-[#E5D8C9]">No waitlist entries found</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          No applicants match your current search queries or status filters.
                        </p>
                      </Card>
                    );
                  }

                  return filteredWaitlist.map((entry) => {
                    const isExpanded = expandedWaitlistIds.includes(entry.id);
                    return (
                      <Card
                        key={entry.id}
                        className="rounded-[var(--ds-radius-card)] border border-zinc-800/80 bg-[#161519]/90 hover:border-zinc-700/80 transition-all p-5 md:p-6 space-y-4 text-left relative overflow-hidden shadow-sm hover:shadow-md"
                      >
                        {/* Header: Avatar, Name, Email, Date, Status */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center font-bold text-sm text-brand-orange shrink-0">
                              {entry.name?.charAt(0)?.toUpperCase() || entry.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-black text-sm text-[#E5D8C9] truncate flex items-center gap-2 flex-wrap">
                                {entry.name || <span className="text-muted-foreground italic font-medium">No name</span>}
                                {entry.role && (
                                  <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-mono font-bold text-[#B8B8B8] bg-zinc-900 border-zinc-800">
                                    {entry.role}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">{entry.email}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0 border-t sm:border-none border-zinc-900/60 pt-2 sm:pt-0">
                            <span className="text-[10px] font-mono font-medium text-muted-foreground/60">
                              {new Date(entry.createdAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <Badge
                              variant="secondary"
                              className={`text-[9px] uppercase font-mono font-bold tracking-wider py-0.5 px-2.5 rounded-full border ${
                                entry.status === "APPROVED"
                                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                  : entry.status === "REJECTED"
                                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                                    : entry.status === "WAITLISTED"
                                      ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                      : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                              }`}
                            >
                              {entry.status}
                            </Badge>
                          </div>
                        </div>

                        {/* Mid Section: Stats summary & details link */}
                        {(entry.emailVolume || entry.biggestPain || entry.whyInboxfm) && (
                          <div className="text-xs space-y-2 border-t border-zinc-900/60 pt-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {entry.emailVolume && (
                                <div>
                                  <span className="text-[9px] font-mono uppercase font-black tracking-wider text-muted-foreground/50 block">Email Volume</span>
                                  <span className="font-bold text-[#E5D8C9]">{entry.emailVolume} daily</span>
                                </div>
                              )}
                              {entry.biggestPain && (
                                <div>
                                  <span className="text-[9px] font-mono uppercase font-black tracking-wider text-muted-foreground/50 block">Biggest attention pain</span>
                                  <span className="font-bold text-[#E5D8C9]">{entry.biggestPain}</span>
                                </div>
                              )}
                              {(entry.whyInboxfm || entry.notes) && (
                                <div className="col-span-2 flex items-center md:justify-end">
                                  <button
                                    onClick={() => toggleExpandWaitlist(entry.id)}
                                    className="font-bold text-brand-orange hover:underline flex items-center gap-1 transition-all text-xs"
                                  >
                                    {isExpanded ? (
                                      <>Hide Application details <CaretUp size={12} weight="bold" /></>
                                    ) : (
                                      <>Show Application details <CaretDown size={12} weight="bold" /></>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Dropdown collapsible context details */}
                            <AnimatePresence initial={false}>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                                  className="overflow-hidden space-y-3 pt-3 mt-3 border-t border-zinc-900/40"
                                >
                                  {entry.whyInboxfm && (
                                    <div className="space-y-1 bg-zinc-950/40 p-3 rounded-[var(--ds-radius-inner)] border border-zinc-900">
                                      <span className="text-[9px] font-mono uppercase font-black tracking-wider text-muted-foreground/60">What made you interested?</span>
                                      <p className="text-xs font-semibold text-[#E5D8C9] whitespace-pre-wrap leading-relaxed">{entry.whyInboxfm}</p>
                                    </div>
                                  )}
                                  {entry.notes && (
                                    <div className="space-y-1 bg-zinc-950/40 p-3 rounded-[var(--ds-radius-inner)] border border-zinc-900">
                                      <span className="text-[9px] font-mono uppercase font-black tracking-wider text-muted-foreground/60">Anything you'd like us to know?</span>
                                      <p className="text-xs font-semibold text-[#E5D8C9] whitespace-pre-wrap leading-relaxed">{entry.notes}</p>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        {/* Footer: CRM Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-zinc-900/60 mt-2">
                          <div className="flex flex-wrap gap-2">
                            {entry.status !== "APPROVED" && (
                              <Button
                                size="sm"
                                className="rounded-xl gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider h-9 px-4 border-none transition-all cursor-pointer"
                                onClick={() => handleApproveWaitlist(entry.id)}
                              >
                                <CheckCircle size={14} weight="fill" />
                                Approve & Invite
                              </Button>
                            )}

                            {entry.status !== "WAITLISTED" && entry.status !== "APPROVED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl gap-1.5 border-zinc-800 hover:border-amber-600/40 text-amber-500 hover:bg-amber-600/5 text-[10px] font-black uppercase tracking-wider h-9 px-4 transition-all cursor-pointer"
                                onClick={() => handleWaitlistWaitlist(entry.id)}
                              >
                                <Clock size={14} weight="fill" />
                                Waitlist
                              </Button>
                            )}

                            {entry.status !== "REJECTED" && entry.status !== "APPROVED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl gap-1.5 border-zinc-800 hover:border-red-600/40 text-red-500 hover:bg-red-600/5 text-[10px] font-black uppercase tracking-wider h-9 px-4 transition-all cursor-pointer"
                                onClick={() => handleRejectWaitlist(entry.id)}
                              >
                                <XCircle size={14} weight="fill" />
                                Reject
                              </Button>
                            )}

                            {entry.status === "APPROVED" && (
                              <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/5 text-[10px] font-mono uppercase tracking-widest py-1.5 px-3">
                                <CheckCircle size={12} weight="fill" className="mr-1 inline-block" />
                                Invite Sent
                              </Badge>
                            )}
                          </div>

                          <Button
                            size="icon"
                            variant="ghost"
                            className="rounded-xl h-9 w-9 text-muted-foreground hover:text-red-500 hover:bg-red-500/5 transition-colors cursor-pointer self-end sm:self-auto"
                            onClick={() => handleDeleteWaitlist(entry.id)}
                          >
                            <Trash size={15} />
                          </Button>
                        </div>
                      </Card>
                    );
                  });
                })()}
              </div>
            </motion.div>
          )}

          {/* Support Tab */}
          {activeTab === "support" && (
            <motion.div
              key="support"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black">Support Tickets</h2>
                  <p className="text-muted-foreground">
                    Manage user support requests
                  </p>
                </div>
              </div>

              <Card className="rounded-2xl overflow-hidden border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-12 text-muted-foreground"
                        >
                          No support tickets yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      tickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {ticket.subject}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {ticket.email}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{ticket.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                ticket.status === "RESOLVED"
                                  ? "default"
                                  : ticket.status === "OPEN"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {ticket.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Select
                              value={ticket.status}
                              onValueChange={(status) =>
                                handleUpdateTicket(
                                  ticket.id,
                                  status as SupportTicket["status"],
                                )
                              }
                            >
                              <SelectTrigger className="w-32 h-8 rounded-full text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="OPEN">Open</SelectItem>
                                <SelectItem value="IN_PROGRESS">
                                  In Progress
                                </SelectItem>
                                <SelectItem value="RESOLVED">
                                  Resolved
                                </SelectItem>
                                <SelectItem value="CLOSED">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </motion.div>
          )}

          {/* Feedback Tab */}
          {activeTab === "feedback" && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 max-w-6xl mx-auto"
            >
              <div>
                <h2 className="text-3xl font-black">Feedback</h2>
                <p className="text-muted-foreground">
                  User ratings and feedback
                </p>
              </div>

              {/* Stats */}
              {feedbackStats && (
                <div className="grid grid-cols-3 gap-4">
                  <Card className="rounded-2xl p-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      Total Feedback
                    </p>
                    <p className="text-4xl font-black">{feedbackStats.total}</p>
                  </Card>
                  <Card className="rounded-2xl p-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      Average Rating
                    </p>
                    <p className="text-4xl font-black flex items-center gap-2">
                      {feedbackStats.averageRating}
                      <Star
                        size={28}
                        weight="fill"
                        className="text-yellow-400"
                      />
                    </p>
                  </Card>
                  <Card className="rounded-2xl p-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                      Distribution
                    </p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div key={star} className="flex-1">
                          <div className="h-16 bg-muted rounded-lg relative overflow-hidden">
                            <div
                              className="absolute bottom-0 left-0 right-0 bg-yellow-400 rounded-b-lg"
                              style={{
                                height: `${(feedbackStats.distribution[star] / feedbackStats.total) * 100}%`,
                              }}
                            />
                          </div>
                          <p className="text-xs text-center mt-1 font-bold">
                            {star}★
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              <Card className="rounded-2xl overflow-hidden border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rating</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedback.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center py-12 text-muted-foreground"
                        >
                          No feedback yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      feedback.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={16}
                                  weight={star <= f.rating ? "fill" : "regular"}
                                  className={
                                    star <= f.rating
                                      ? "text-yellow-400"
                                      : "text-gray-300"
                                  }
                                />
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {f.email}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(f.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </motion.div>
          )}

          {/* Releases Tab */}
          {activeTab === "releases" && (
            <motion.div
              key="releases"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 max-w-6xl mx-auto"
            >
              <div>
                <h2 className="text-3xl font-black">Release Notes</h2>
                <p className="text-muted-foreground">
                  Manage and broadcast product updates
                </p>
              </div>

              {/* Create New Release */}
              <Card className="rounded-2xl p-6">
                <h3 className="font-bold mb-4">Create New Release</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Input
                    placeholder="Version (e.g., 1.2.0)"
                    value={newRelease.version}
                    onChange={(e) =>
                      setNewRelease((prev) => ({
                        ...prev,
                        version: e.target.value,
                      }))
                    }
                    className="rounded-xl"
                  />
                  <Input
                    placeholder="Title (e.g., Dark Mode & More)"
                    value={newRelease.title}
                    onChange={(e) =>
                      setNewRelease((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="rounded-xl"
                  />
                </div>
                <Textarea
                  placeholder="Release content (supports newlines for list items)"
                  value={newRelease.content}
                  onChange={(e) =>
                    setNewRelease((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  className="rounded-xl mb-4"
                  rows={4}
                />
                <Button
                  onClick={handleCreateRelease}
                  className="rounded-full gap-2 bg-primary hover:bg-primary/95 text-white"
                >
                  <Plus size={16} weight="bold" />
                  Create Release
                </Button>
              </Card>

              {/* Release List */}
              <Card className="rounded-2xl overflow-hidden border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {releases.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-12 text-muted-foreground"
                        >
                          No releases yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      releases.map((release) => (
                        <TableRow key={release.id}>
                          <TableCell className="font-mono font-bold">
                            v{release.version}
                          </TableCell>
                          <TableCell className="font-medium">
                            {release.title}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={release.sentAt ? "default" : "secondary"}
                            >
                              {release.sentAt ? "Sent" : "Draft"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(release.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {!release.sentAt && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full gap-1 border-border text-foreground hover:bg-muted"
                                onClick={() =>
                                  handleBroadcastRelease(release.id)
                                }
                              >
                                <Megaphone size={14} weight="fill" />
                                Broadcast
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </motion.div>
          )}

          {/* Broadcast Tab */}
          {activeTab === "comms" && (
            <motion.div
              key="comms"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 max-w-6xl mx-auto"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black">Broadcast</h2>
                  <p className="text-muted-foreground">Send targeted email marketing campaigns to your audience</p>
                </div>
                {broadcastStatus !== "idle" && (
                  <Badge variant="outline" className="px-3 py-1 rounded-full gap-2 border-primary/20 bg-primary/5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Campaign Active
                  </Badge>
                )}
              </div>

              {broadcastStatus !== "idle" ? (
                /* Beautiful Live Progress Card */
                <Card className="rounded-2xl border-white/10 overflow-hidden shadow-2xl bg-zinc-950 text-white relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-orange-500 to-yellow-500" />
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                          <EnvelopeSimple size={22} weight="fill" className="text-primary" />
                          <span>Email Campaign Delivery</span>
                        </CardTitle>
                        <CardDescription className="text-white/40 mt-1">
                          Sending from <span className="text-white font-mono font-bold">{fromEmail}</span>
                        </CardDescription>
                      </div>
                      <Badge 
                        className={`font-black rounded-full px-3 py-1 uppercase tracking-wider text-[10px] ${
                          broadcastStatus === "sending" ? "bg-primary text-white" :
                          broadcastStatus === "paused" ? "bg-yellow-500 text-black" :
                          broadcastStatus === "completed" ? "bg-green-600 text-white" :
                          "bg-red-600 text-white"
                        }`}
                      >
                        {broadcastStatus}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Live Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-bold">
                        <span>Overall Progress</span>
                        <span>{Math.round((currentIndex / totalRecipients) * 100)}% ({currentIndex} / {totalRecipients})</span>
                      </div>
                      <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          className="h-full bg-linear-to-r from-primary to-orange-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(currentIndex / totalRecipients) * 100}%` }}
                          transition={{ duration: 0.2 }}
                        />
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Delivered</p>
                        <p className="text-2xl font-black text-green-500">{successCount}</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Failed</p>
                        <p className="text-2xl font-black text-red-500">{failureCount}</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Remaining</p>
                        <p className="text-2xl font-black text-white/70">{totalRecipients - currentIndex}</p>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex gap-3 justify-center py-2">
                      {broadcastStatus === "sending" && (
                        <Button 
                          onClick={pauseBroadcast}
                          className="rounded-full bg-yellow-500 hover:bg-yellow-600 text-black px-6 gap-2 font-bold border-none"
                        >
                          <Pause size={16} weight="bold" />
                          Pause Broadcast
                        </Button>
                      )}
                      {broadcastStatus === "paused" && (
                        <Button 
                          onClick={resumeBroadcast}
                          className="rounded-full bg-primary hover:bg-primary/95 text-white px-6 gap-2 font-bold border-none"
                        >
                          <Play size={16} weight="fill" />
                          Resume Broadcast
                        </Button>
                      )}
                      {(broadcastStatus === "sending" || broadcastStatus === "paused") && (
                        <Button 
                          onClick={cancelBroadcast}
                          variant="destructive"
                          className="rounded-full px-6 gap-2 font-bold border border-red-500/30"
                        >
                          <Stop size={16} weight="fill" />
                          Stop & Cancel
                        </Button>
                      )}
                      {(broadcastStatus === "completed" || broadcastStatus === "cancelled") && (
                        <Button 
                          onClick={resetBroadcast}
                          variant="outline"
                          className="rounded-full px-6 gap-2 font-bold border-white/10 text-white hover:bg-white/5"
                        >
                          <ArrowClockwise size={16} weight="bold" />
                          New Campaign
                        </Button>
                      )}
                    </div>

                    {/* Live Delivery Log Console */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Live Delivery Logs</p>
                      <div className="h-44 bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-xs overflow-y-auto space-y-1.5 scrollbar-thin">
                        {sendLogs.length === 0 ? (
                          <div className="text-white/30 italic text-center py-12">Initialising transmission protocols...</div>
                        ) : (
                          sendLogs.map((log, idx) => (
                            <div key={idx} className="flex justify-between items-start gap-4 py-0.5 border-b border-white/5 last:border-b-0">
                              <span className="truncate text-white/70">{log.email}</span>
                              <span className="flex items-center gap-1.5 flex-none">
                                {log.status === "success" ? (
                                  <Badge className="bg-green-500/10 text-green-400 border-none font-bold text-[9px] px-1.5 py-0.5">
                                    SUCCESS
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-500/10 text-red-400 border-none font-bold text-[9px] px-1.5 py-0.5" title={log.error}>
                                    FAILED
                                  </Badge>
                                )}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* Beautiful Campaign Configuration Suite */
                <div className="grid lg:grid-cols-12 gap-6 items-start">
                  
                  {/* LEFT: Configuration & Setup (7 cols) */}
                  <div className="lg:col-span-7 space-y-6">
                    
                    {/* 1. Sender Configuration */}
                    <Card className="rounded-2xl border border-border bg-card">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <EnvelopeSimple size={18} weight="fill" className="text-primary" />
                          <span>Sender Address Selection</span>
                        </CardTitle>
                        <CardDescription>Choose the sending authority prefix for this campaign</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex gap-2">
                          {["newsletter", "support", "hello", "mihir"].map((pfx) => (
                            <button
                              key={pfx}
                              type="button"
                              onClick={() => setSenderPrefix(pfx)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                                senderPrefix === pfx
                                  ? "bg-primary border-primary text-white shadow-xs"
                                  : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              {pfx}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center">
                          <div className="relative flex-1 flex rounded-xl border border-input focus-within:ring-2 focus-within:ring-primary/20 bg-background overflow-hidden">
                            <input
                              type="text"
                              value={senderPrefix}
                              onChange={(e) => setSenderPrefix(e.target.value.replace(/[^a-zA-Z0-9.-]/g, ""))}
                              placeholder="custom-prefix"
                              className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none placeholder:text-muted-foreground"
                            />
                            <div className="flex items-center px-3 border-l border-border bg-muted/30 text-xs font-bold text-muted-foreground select-none font-mono">
                              @inboxfm.me
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                          Verified Sender Domain active. Senders will appear as <strong className="text-foreground font-mono">{fromEmail}</strong>
                        </p>
                      </CardContent>
                    </Card>

                    {/* 2. Recipient Targeting */}
                    <Card className="rounded-2xl border border-border bg-card">
                      <CardHeader className="pb-4 flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-base font-bold flex items-center gap-2">
                            <Users size={18} weight="fill" className="text-primary" />
                            <span>Target Recipient List</span>
                          </CardTitle>
                          <CardDescription>Target a single operator or upload a custom marketing CSV</CardDescription>
                        </div>
                        <div className="flex bg-muted rounded-full p-0.5 flex-none">
                          <button
                            type="button"
                            onClick={() => setRecipientType("single")}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                              recipientType === "single" ? "bg-white text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Single Address
                          </button>
                          <button
                            type="button"
                            onClick={() => setRecipientType("csv")}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                              recipientType === "csv" ? "bg-white text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            CSV File
                          </button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {recipientType === "single" ? (
                          <div className="relative">
                            <div className="text-xs text-muted-foreground mb-1 font-bold uppercase tracking-wider">Recipient Email</div>
                            <Input
                              ref={toRef}
                              type="email"
                              placeholder="e.g. partner@gmail.com"
                              value={singleRecipient}
                              onChange={(e) => handleInputChange(e.target.value, "to", e.target)}
                              className="rounded-xl pr-10"
                            />
                            {showVarDropdown && activeInput === "to" && (
                              <div className="absolute z-50 mt-1 w-64 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl p-2 max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-100">
                                <div className="text-[10px] font-bold text-white/40 px-2 py-1 uppercase tracking-wider border-b border-white/5 mb-1 flex items-center justify-between">
                                  <span>Dynamic Fields</span>
                                </div>
                                {filteredVariables.map((v) => (
                                  <button
                                    key={v}
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); handleSelectVariable(v); }}
                                    className="w-full text-left text-xs font-medium text-white/80 hover:text-white hover:bg-primary px-3 py-2 rounded-lg transition-colors flex items-center justify-between"
                                  >
                                    <span>{v}</span>
                                    <span className="text-[10px] opacity-40 font-mono">{"{{"}{v}{"}}"}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="border-2 border-dashed border-border hover:border-primary/40 rounded-2xl p-6 transition-colors flex flex-col items-center justify-center text-center cursor-pointer relative bg-muted/10">
                              <input
                                type="file"
                                accept=".csv"
                                onChange={handleCSVUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              />
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                                <UploadSimple size={20} weight="bold" />
                              </div>
                              <p className="text-xs font-bold text-foreground">
                                {csvFile ? csvFile.name : "Select or drag your CSV file here"}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-1">Supports columns like First_name, Email, company</p>
                            </div>

                            {csvData && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border"
                              >
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">To Column (Email)</label>
                                    <Select value={selectedToHeader} onValueChange={setSelectedToHeader}>
                                      <SelectTrigger className="w-full h-9 rounded-lg bg-background text-xs border">
                                        <SelectValue placeholder="Choose column" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {csvData.headers.map((h) => (
                                          <SelectItem key={h} value={h} className="text-xs">
                                            {h}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="flex flex-col justify-end">
                                    <p className="text-[10px] text-muted-foreground font-bold">List Stats</p>
                                    <p className="text-lg font-black mt-1 text-foreground">{csvData.rows.length} records found</p>
                                  </div>
                                </div>

                                {/* Premium CSV Header preview list */}
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Available Variables</label>
                                  <div className="flex flex-wrap gap-1">
                                    {csvData.headers.map((h) => (
                                      <Badge key={h} variant="secondary" className="text-[9px] font-mono font-bold bg-background text-muted-foreground border-border select-all cursor-pointer">
                                        {"{{"}{h}{"}}"}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* 3. Composer Details */}
                    <Card className="rounded-2xl border border-border bg-card">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <Plus size={18} weight="bold" className="text-primary" />
                          <span>Compose Message Template</span>
                        </CardTitle>
                        <CardDescription>Support templating. Type <strong className="text-primary">@</strong> anywhere to trigger variables insertion</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="relative">
                          <label className="text-xs text-muted-foreground mb-1 font-bold uppercase tracking-wider block">Subject Line</label>
                          <Input
                            ref={subjectRef}
                            type="text"
                            placeholder="hey @First_name, check this out!"
                            value={emailSubject}
                            onChange={(e) => handleInputChange(e.target.value, "subject", e.target)}
                            className="rounded-xl w-full"
                          />
                          {showVarDropdown && activeInput === "subject" && (
                            <div className="absolute z-50 mt-1 w-64 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl p-2 max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-100">
                              <div className="text-[10px] font-bold text-white/40 px-2 py-1 uppercase tracking-wider border-b border-white/5 mb-1 flex items-center justify-between">
                                <span>Variables</span>
                                <span className="text-primary">@</span>
                              </div>
                              {filteredVariables.map((v) => (
                                <button
                                  key={v}
                                  type="button"
                                  onMouseDown={(e) => { e.preventDefault(); handleSelectVariable(v); }}
                                  className="w-full text-left text-xs font-medium text-white/80 hover:text-white hover:bg-primary px-3 py-2 rounded-lg transition-colors flex items-center justify-between"
                                >
                                  <span>{v}</span>
                                  <span className="text-[10px] opacity-40 font-mono">{"{{"}{v}{"}}"}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="relative">
                          <label className="text-xs text-muted-foreground mb-1 font-bold uppercase tracking-wider block">Message Content (HTML Allowed)</label>
                          <Textarea
                            ref={bodyRef}
                            placeholder="Hey @First_name,&#10;&#10;We wanted to reach out to you at @company regarding InboxFM updates..."
                            value={emailMessage}
                            onChange={(e) => handleInputChange(e.target.value, "body", e.target)}
                            className="rounded-xl min-h-[180px] w-full"
                          />
                          {showVarDropdown && activeInput === "body" && (
                            <div className="absolute z-50 mt-1 w-64 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl p-2 max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-100">
                              <div className="text-[10px] font-bold text-white/40 px-2 py-1 uppercase tracking-wider border-b border-white/5 mb-1 flex items-center justify-between">
                                <span>Variables</span>
                                <span className="text-primary">@</span>
                              </div>
                              {filteredVariables.map((v) => (
                                <button
                                  key={v}
                                  type="button"
                                  onMouseDown={(e) => { e.preventDefault(); handleSelectVariable(v); }}
                                  className="w-full text-left text-xs font-medium text-white/80 hover:text-white hover:bg-primary px-3 py-2 rounded-lg transition-colors flex items-center justify-between"
                                >
                                  <span>{v}</span>
                                  <span className="text-[10px] opacity-40 font-mono">{"{{"}{v}{"}}"}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              if (recipientType === "csv" && (!csvData || csvData.rows.length === 0)) {
                                toast.error("Upload a CSV file first");
                                return;
                              }
                              setShowPreviewModal(true);
                            }}
                            className="rounded-full gap-2 border-border text-foreground hover:bg-muted"
                          >
                            <Eye size={16} />
                            Preview Dynamic Templates
                          </Button>
                          <Button
                            onClick={startBroadcast}
                            disabled={
                              recipientType === "single"
                                ? !singleRecipient || !emailSubject || !emailMessage
                                : !csvFile || !selectedToHeader || !emailSubject || !emailMessage
                            }
                            className="rounded-full bg-primary hover:bg-primary/95 text-white gap-2 font-bold px-6 shadow-sm shadow-primary/10 hover:shadow-primary/20 transition-all hover:-translate-y-0.5 duration-100 border-none"
                          >
                            <Megaphone size={16} weight="bold" />
                            Initialize Campaign
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* RIGHT: High-End Live Compilation Preview Panel (5 cols) */}
                  <div className="lg:col-span-5 space-y-6">
                    <Card className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs h-full flex flex-col">
                      <div className="p-6 border-b border-border">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <Eye size={18} className="text-primary" />
                          <span>Real-time Broadcast Preview</span>
                        </CardTitle>
                        <CardDescription>Verify dynamic variables compile seamlessly</CardDescription>
                      </div>
                      
                      <div className="flex-1 p-6 flex flex-col justify-between bg-muted/10">
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Sender</span>
                            <div className="bg-background border border-border rounded-xl p-3 text-xs font-mono font-bold text-muted-foreground truncate">
                              Inbox FM &lt;{fromEmail}&gt;
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Recipient</span>
                            <div className="bg-background border border-border rounded-xl p-3 text-xs font-mono font-bold text-muted-foreground truncate">
                              {recipientType === "single" 
                                ? (singleRecipient || "Enter recipient email above...") 
                                : csvData && csvData.rows.length > 0 
                                  ? `${csvData.rows[previewIndex]?.[selectedToHeader] || "Selected column email..."}` 
                                  : "Upload CSV list to see preview..."
                              }
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Subject Line</span>
                            <div className="bg-background border border-border rounded-xl p-3 text-xs font-bold text-foreground truncate min-h-[42px] flex items-center">
                              {emailSubject ? getPreviewCompiled(emailSubject) : "Enter subject template..."}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Email Body</span>
                            <div className="bg-background border border-border rounded-xl p-4 text-xs text-muted-foreground font-medium min-h-[160px] max-h-[220px] overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                              {emailMessage ? getPreviewCompiled(emailMessage) : "Compose email template to see compiled result..."}
                            </div>
                          </div>
                        </div>

                        {recipientType === "csv" && csvData && csvData.rows.length > 1 && (
                          <div className="flex items-center justify-between pt-4 border-t border-border mt-4 flex-none">
                            <span className="text-[10px] text-muted-foreground font-bold">Record {previewIndex + 1} of {csvData.rows.length}</span>
                            <div className="flex gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0 rounded-full"
                                onClick={() => setPreviewIndex((prev) => Math.max(0, prev - 1))}
                                disabled={previewIndex === 0}
                              >
                                <CaretLeft size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0 rounded-full"
                                onClick={() => setPreviewIndex((prev) => Math.min(csvData.rows.length - 1, prev + 1))}
                                disabled={previewIndex === csvData.rows.length - 1}
                              >
                                <CaretRight size={14} />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {/* Dynamic Preview Modal */}
              <AnimatePresence>
                {showPreviewModal && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-background border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl text-foreground"
                    >
                      <div className="p-6 border-b flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold">Dynamic Template Validation</h3>
                          <p className="text-xs text-muted-foreground">Detailed HTML layout rendering preview</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full w-8 h-8 p-0"
                          onClick={() => setShowPreviewModal(false)}
                        >
                          <X size={18} />
                        </Button>
                      </div>
                      <div className="p-6 overflow-y-auto max-h-[450px] bg-muted/20">
                        {/* Premium template mockup */}
                        <div className="max-w-[480px] mx-auto bg-white border rounded-xl shadow-lg overflow-hidden text-black font-sans leading-relaxed text-sm">
                          {/* Header */}
                          <div className="bg-black p-6 text-left flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white">🎧</div>
                            <span className="text-white font-black tracking-tighter uppercase">INBOX<span className="text-primary">FM</span></span>
                          </div>
                          {/* Body */}
                          <div className="p-8 space-y-4 min-h-[220px]">
                            <h2 className="text-xl font-bold font-sans text-black leading-tight">
                              {emailSubject ? getPreviewCompiled(emailSubject) : "Subject Preview"}
                            </h2>
                            <div 
                              className="text-gray-700 whitespace-pre-wrap pt-2 animate-pulse"
                              dangerouslySetInnerHTML={{
                                __html: emailMessage 
                                  ? getPreviewCompiled(emailMessage).replace(/\n/g, "<br>")
                                  : "Message Preview"
                              }}
                            />
                          </div>
                          {/* Footer */}
                          <div className="bg-black p-6 text-left border-t text-[10px] text-gray-400 space-y-2">
                            <div className="font-bold text-white">VEDLABS</div>
                            <p>© {new Date().getFullYear()} VedLabs. All rights reserved.</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
