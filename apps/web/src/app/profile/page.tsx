"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Lock,
  GoogleLogo,
  Bell,
  Camera,
  SignOut,
  CheckCircle,
  XCircle,
} from "@phosphor-icons/react";
import { Spinner } from "@/components/shared/Spinner";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { NotificationOptIn } from "@/components/shared/NotificationOptIn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const {
    user,
    isLoading,
    isAuthenticated,
    logout,
    refreshUser,
    connectGmail,
    disconnectGmail,
  } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("profile");
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Detect unsaved changes to prompt the floating save capsule
  const hasChanges = user && (name !== (user.name || "") || timezone !== (user.timezone || ""));

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setTimezone(user.timezone || "");
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await api.users.updatePreferences({ name, timezone });
      await refreshUser();
      toast.success("Profile updated!");
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnectGmail = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectGmail();
      toast.success("Gmail disconnected");
    } catch (err) {
      toast.error("Failed to disconnect Gmail");
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const initials =
    user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="max-w-3xl mx-auto pb-32"
    >
      <PageHeader
        title="Account Settings"
        description="Manage your personal information, delivery choices, and credentials."
        className="mb-8"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        {/* Dynamic Sliding Tabs Trigger */}
        <TabsList className="bg-muted/40 p-1 h-12 rounded-[var(--ds-radius-pill)] w-full sm:w-auto grid grid-cols-3 sm:flex border-2 border-black dark:border-zinc-700 relative overflow-hidden backdrop-blur-sm">
          <TabsTrigger
            value="profile"
            className={cn(
              "relative rounded-[var(--ds-radius-pill)] font-black text-[10px] uppercase tracking-wider gap-2 px-6 py-2.5 transition-all duration-300 z-10 select-none data-[state=active]:text-primary text-muted-foreground/80 hover:text-foreground",
              activeTab === "profile" && "text-primary"
            )}
          >
            {activeTab === "profile" && (
              <motion.div
                layoutId="active-profile-tab"
                className="absolute inset-0 bg-background rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.1)]"
                style={{ zIndex: -1 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <User size={16} weight="bold" /> Profile
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className={cn(
              "relative rounded-[var(--ds-radius-pill)] font-black text-[10px] uppercase tracking-wider gap-2 px-6 py-2.5 transition-all duration-300 z-10 select-none data-[state=active]:text-primary text-muted-foreground/80 hover:text-foreground",
              activeTab === "notifications" && "text-primary"
            )}
          >
            {activeTab === "notifications" && (
              <motion.div
                layoutId="active-profile-tab"
                className="absolute inset-0 bg-background rounded-[var(--ds-radius-pill)] shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.1)]"
                style={{ zIndex: -1 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <Bell size={16} weight="bold" /> Notify
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className={cn(
              "relative rounded-[var(--ds-radius-pill)] font-black text-[10px] uppercase tracking-wider gap-2 px-6 py-2.5 transition-all duration-300 z-10 select-none data-[state=active]:text-primary text-muted-foreground/80 hover:text-foreground",
              activeTab === "security" && "text-primary"
            )}
          >
            {activeTab === "security" && (
              <motion.div
                layoutId="active-profile-tab"
                className="absolute inset-0 bg-background rounded-[var(--ds-radius-pill)] shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.1)]"
                style={{ zIndex: -1 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <Lock size={16} weight="bold" /> Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 focus-visible:outline-none">
          <section className="rounded-[var(--ds-radius-card)] glass overflow-hidden shadow-[var(--ds-shadow-card)] hover:shadow-[var(--ds-shadow-hover)] transition-all duration-300">
            {/* Identity Strip (Zone A) */}
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 bg-muted/5 border-b-2 border-black dark:border-zinc-700">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="relative group select-none">
                  <Avatar className="h-20 w-20 border-2 border-black dark:border-zinc-700 shadow-[var(--ds-shadow-card)] transition-transform duration-300 group-hover:scale-105">
                    <AvatarImage src={user.picture || undefined} />
                    <AvatarFallback className="text-2xl font-black bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute -bottom-1 -right-1 p-2 bg-background rounded-full border-2 border-black dark:border-zinc-700 text-muted-foreground hover:text-primary hover:shadow-[var(--ds-shadow-primary)] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all duration-200 active:scale-90">
                    <Camera size={14} weight="bold" />
                  </button>
                </div>
                <div className="text-center sm:text-left pt-1.5">
                  <h3 className="text-xl font-black tracking-tight">
                    {user.name || "No name set"}
                  </h3>
                  <p className="text-sm text-muted-foreground/75 font-semibold mb-3">
                    {user.email}
                  </p>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    {user.isActive ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-[var(--ds-radius-pill)] text-[10px] font-black uppercase tracking-wider border-2 border-black dark:border-zinc-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse border border-black dark:border-zinc-900" />
                        Identity Verified
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-[var(--ds-radius-pill)] text-[10px] font-black uppercase tracking-wider border-2 border-black dark:border-zinc-700">
                        <XCircle size={14} weight="fill" className="text-amber-500" />
                        Pending Setup
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Fields (Zone B) */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                <div className="grid gap-2">
                  <Label
                    htmlFor="name"
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1"
                  >
                    Display Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="font-bold"
                    placeholder="Your full name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label
                    htmlFor="timezone"
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1"
                  >
                    Timezone
                  </Label>
                  <Input
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    placeholder="America/New_York"
                    className="font-bold"
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label
                    htmlFor="email"
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1"
                  >
                    Email Address
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      value={user.email}
                      placeholder="your@email.com"
                      className="opacity-60"
                      disabled
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">
                      Managed by Google
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Decision Gravity: Elegant Floating Save Capsule */}
          <AnimatePresence>
            {hasChanges && (
              <motion.div
                initial={{ y: 80, x: "-50%", opacity: 0 }}
                animate={{ y: 0, x: "-50%", opacity: 1 }}
                exit={{ y: 80, x: "-50%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className="fixed bottom-6 left-1/2 bg-background border-2 border-black dark:border-zinc-700 p-3 rounded-[var(--ds-radius-card)] z-30 flex items-center gap-4 px-6 shadow-[var(--ds-shadow-hover)] max-w-lg w-[calc(100%-2rem)] md:w-auto"
              >
                <span className="text-xs font-black text-foreground/80 shrink-0 hidden sm:inline select-none uppercase tracking-wider">
                  Unsaved profile edits
                </span>
                <div className="flex gap-2 w-full justify-end sm:w-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setName(user.name || "");
                      setTimezone(user.timezone || "");
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                  >
                    {isSaving ? <><Spinner size={14} /> Saving...</> : "Save Changes"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <section className="rounded-[var(--ds-radius-card)] glass p-6 md:p-8 shadow-[var(--ds-shadow-card)] flex flex-col sm:flex-row items-center justify-between gap-6 hover:shadow-[var(--ds-shadow-hover)] transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-muted/20 rounded-[var(--ds-radius-inner)] flex items-center justify-center border-2 border-black dark:border-zinc-700 shrink-0 select-none">
                <GoogleLogo
                  size={28}
                  weight="bold"
                  className={user.gmailConnected ? "text-primary" : "text-muted-foreground/35"}
                />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-black text-sm tracking-tight">
                  {user.gmailConnected ? "Gmail Connected" : "Connect your Inbox"}
                </h4>
                <p className="text-xs text-muted-foreground/75 font-semibold max-w-xs sm:max-w-md">
                  Used for secure background briefing analysis and daily audio digests.
                </p>
                {user.gmailConnected && (
                  <div className="pt-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-600/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 border border-black dark:border-zinc-900" />
                    Active • Synced
                  </div>
                )}
              </div>
            </div>
            {user.gmailConnected ? (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDisconnectGmail}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? "Disconnecting..." : "Disconnect"}
              </Button>
            ) : (
              <Button size="sm" onClick={connectGmail}>
                Enable Gmail
              </Button>
            )}
          </section>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 focus-visible:outline-none">
          <section className="rounded-[var(--ds-radius-card)] glass p-6 md:p-8 space-y-6 shadow-[var(--ds-shadow-card)]">
            <div>
              <h3 className="text-lg font-black tracking-tight">
                Notification Preferences
              </h3>
              <p className="text-xs text-muted-foreground/80 mt-0.5 font-medium">
                Configure delivery triggers and alerts for generated briefings.
              </p>
            </div>
            
            <Separator className="border-t-2 border-dashed border-black/10 dark:border-white/10 opacity-50" />

            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-black">Push Notifications</Label>
                <p className="text-xs text-muted-foreground/75 font-semibold">
                  Get real-time indicators on your device when your morning brief is compiled.
                </p>
                <NotificationOptIn />
              </div>
              
              <Separator className="opacity-50" />
              
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="text-sm font-black">Email Summaries</Label>
                  <p className="text-xs text-muted-foreground/75 font-semibold">
                    Receive a text version of your audio briefings directly via email.
                  </p>
                </div>
                <Switch
                  defaultChecked
                  className="data-[state=checked]:bg-primary"
                />
              </div>
              
              <Separator className="opacity-50" />
              
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="text-sm font-black">Maintenance Alerts</Label>
                  <p className="text-xs text-muted-foreground/75 font-semibold">
                    Important notifications regarding updates, system performance, and features.
                  </p>
                </div>
                <Switch className="data-[state=checked]:bg-primary" />
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 focus-visible:outline-none">
          <section className="rounded-[var(--ds-radius-card)] glass p-6 md:p-8 space-y-8 shadow-[var(--ds-shadow-card)]">
            <div>
              <h3 className="text-lg font-black tracking-tight">
                Security & Credentials
              </h3>
              <p className="text-xs text-muted-foreground/80 mt-0.5 font-medium">
                Update account passwords and manage safety parameters.
              </p>
            </div>

            <div className="grid gap-5 max-w-md">
              <div className="grid gap-2">
                <Label
                  htmlFor="current"
                  className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1"
                >
                  Current Password
                </Label>
                <Input id="current" type="password" placeholder="Enter current password" className="font-bold" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                  New Password
                </Label>
                <Input id="new" type="password" placeholder="Min. 8 characters" className="font-bold" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                  Confirm New Password
                </Label>
                <Input id="confirm" type="password" placeholder="Repeat new password" className="font-bold" />
              </div>
              <Button size="sm" className="w-fit mt-2">
                Update Password
              </Button>
            </div>

            <Separator className="border-t-2 border-dashed border-black/10 dark:border-white/10 opacity-50" />

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/80 ml-1">
                Account Safety
              </h4>
              
              <div className="grid gap-4">
                <div className="rounded-[var(--ds-radius-inner)] border-2 border-red-500 bg-red-500/5 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[var(--ds-shadow-primary)] hover:shadow-[var(--ds-shadow-hover)] transition-all">
                  <div className="text-center sm:text-left">
                    <p className="text-xs font-black text-red-600 uppercase tracking-wider mb-1">
                      Global Sign Out
                    </p>
                    <p className="text-[11px] text-muted-foreground/75 font-semibold">
                      Instantly de-authorize all active sessions across all devices.
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={logout}
                  >
                    Sign Out All
                  </Button>
                </div>

                <div className="rounded-[var(--ds-radius-inner)] border-2 border-black dark:border-zinc-700 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 group hover:border-destructive hover:bg-destructive/[0.02] shadow-[var(--ds-shadow-primary)] hover:shadow-[var(--ds-shadow-hover)] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all duration-300">
                  <div className="text-center sm:text-left">
                    <p className="text-xs font-black text-muted-foreground group-hover:text-destructive transition-colors uppercase tracking-wider mb-1">
                      Delete Account
                    </p>
                    <p className="text-[11px] text-muted-foreground/60 font-semibold">
                      Permanently remove all briefing data, files, and credentials.
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                  >
                    Archive Account
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
