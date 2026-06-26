"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import api, { ActionItem, Integration } from "@/lib/api";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Check,
  X,
  Clock,
  Trash,
  Pencil,
  Eye,
  PaperPlaneTilt,
  Sparkle,
  MapPin,
  Link as LinkIcon
} from "@phosphor-icons/react";

export default function ActionItemDetailPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [item, setItem] = useState<ActionItem | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editReply, setEditReply] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editStartsAt, setEditStartsAt] = useState("");
  const [editEndsAt, setEditEndsAt] = useState("");

  const hasOutlook = integrations.some(
    (i) => i.provider === "OUTLOOK" && i.status === "CONNECTED"
  );
  const hasGoogleCalendar = integrations.some(
    (i) => i.provider === "GOOGLE_CALENDAR" && i.status === "CONNECTED"
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchDetails = async () => {
    try {
      const [fetchedItem, fetchedIntegrations] = await Promise.all([
        api.actionItems.getOne(id),
        api.integrations.getAll(),
      ]);

      setItem(fetchedItem);
      setIntegrations(fetchedIntegrations);

      // Initialize form fields
      setEditTitle(fetchedItem.title);
      setEditDescription(fetchedItem.description || "");
      setEditReply(fetchedItem.editedContent || fetchedItem.suggestedReply || "");
      setEditLocation(fetchedItem.location || "");
      setEditStartsAt(
        fetchedItem.startsAt ? new Date(fetchedItem.startsAt).toISOString().slice(0, 16) : ""
      );
      setEditEndsAt(
        fetchedItem.endsAt ? new Date(fetchedItem.endsAt).toISOString().slice(0, 16) : ""
      );
    } catch (err) {
      console.error("Failed to load details", err);
      toast.error("Failed to load action item details");
      router.push("/action-items");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchDetails();
    }
  }, [isAuthenticated, id]);

  const handleUpdateStatus = async (status: ActionItem["status"]) => {
    if (!item) return;
    try {
      const updated = await api.actionItems.updateStatus(item.id, status);
      setItem(updated);
      toast.success(`Action item status set to ${status.toLowerCase()}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleSaveEdits = async () => {
    if (!item) return;
    try {
      const updated = await api.actionItems.update(item.id, {
        title: editTitle,
        description: editDescription,
        location: editLocation || null,
        startsAt: editStartsAt ? new Date(editStartsAt).toISOString() : null,
        endsAt: editEndsAt ? new Date(editEndsAt).toISOString() : null,
        editedContent: editReply || null,
      });
      setItem(updated);
      setIsEditing(false);
      toast.success("Action item updated successfully!");
    } catch (err) {
      toast.error("Failed to save updates");
    }
  };

  const handleGenerateReply = async () => {
    if (!item) return;
    setIsGenerating(true);
    try {
      const res = await api.actionItems.generateReply(item.id);
      setEditReply(res.suggestedReply);
      if (item) {
        setItem({ ...item, suggestedReply: res.suggestedReply });
      }
      toast.success("AI reply draft generated!");
    } catch (err) {
      toast.error("Failed to generate AI suggestion");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMail = async () => {
    if (!item) return;
    if (!hasOutlook) {
      toast.warning("Connect Outlook in Integrations to send replies", {
        action: {
          label: "Connect",
          onClick: () => router.push("/integrations"),
        },
      });
      return;
    }

    setIsSendingMail(true);
    try {
      if (editReply !== item.editedContent) {
        await api.actionItems.update(item.id, { editedContent: editReply });
      }
      await api.actionItems.sendMail(item.id);
      toast.success("Reply sent successfully via Outlook!");
      fetchDetails();
    } catch (err) {
      toast.error("Failed to send reply email");
    } finally {
      setIsSendingMail(false);
    }
  };

  const handleCalendarSync = async () => {
    if (!item) return;
    if (!hasGoogleCalendar) {
      toast.warning("Connect Google Calendar in Integrations to sync events", {
        action: {
          label: "Connect",
          onClick: () => router.push("/integrations"),
        },
      });
      return;
    }

    setIsSyncingCalendar(true);
    try {
      await api.actionItems.calendarSync(item.id);
      toast.success("Event synced to Google Calendar!");
      fetchDetails();
    } catch (err) {
      toast.error("Failed to sync calendar event");
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!item) return;
    try {
      await api.actionItems.delete(item.id);
      toast.success("Action item deleted.");
      router.push("/action-items");
    } catch (err) {
      toast.error("Failed to delete action item");
    }
  };

  if (authLoading || isLoading || !item) {
    return <LoadingScreen message="Loading details..." />;
  }

  const isReplyNeeded = item.type === "REPLY" || item.replyIndicator;
  const isMeeting = item.type === "MEETING";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="max-w-3xl mx-auto space-y-6 pb-32 px-4 md:px-0"
    >
      {/* Back navigation */}
      <button
        onClick={() => router.push("/action-items")}
        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Action Items
      </button>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-border pb-6">
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-[var(--ds-radius-pill)] text-xs font-bold uppercase tracking-wider">
              {item.type}
            </span>
            <span className="bg-muted border border-border px-2.5 py-0.5 rounded-[var(--ds-radius-pill)] text-xs font-semibold">
              Priority: {item.priority}
            </span>
            <span className="bg-muted border border-border px-2.5 py-0.5 rounded-[var(--ds-radius-pill)] text-xs font-semibold">
              Status: {item.status}
            </span>
          </div>
          {isEditing ? (
            <Input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-xl font-bold h-11"
            />
          ) : (
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              {item.title}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="default"
                onClick={handleSaveEdits}
                className="font-bold"
              >
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="font-bold"
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="font-bold text-foreground dark:text-[#E5D8C9]"
            >
              <Pencil className="w-4 h-4 mr-1.5" />
              Edit Details
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Source Card (The Email context) */}
        {(item.sourceSender || item.sourceSubject) && (
          <Card variant="glass" className="p-6">
            <CardContent className="p-0 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-black text-lg flex items-center gap-2">
                  <Eye className="w-5 h-5 text-violet-400" />
                  Original Source Context
                </h3>
                {item.sourceType && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Source: {item.sourceType}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-medium">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-0.5">From:</span>
                  <span className="text-foreground break-all">
                    {item.sourceSender || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-0.5">Subject:</span>
                  <span className="text-foreground break-words">
                    {item.sourceSubject || "N/A"}
                  </span>
                </div>
              </div>

              {item.sourcePreview && (
                <div className="bg-muted/30 border border-border p-4 rounded-[var(--ds-radius-inner)] text-sm text-foreground italic font-mono max-h-40 overflow-y-auto">
                  &ldquo;{item.sourcePreview}&rdquo;
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Details Card */}
        <Card variant="glass" className="p-6">
          <CardContent className="p-0 space-y-6">
            <div className="space-y-2">
              <h3 className="font-black text-lg">Description & Notes</h3>
              {isEditing ? (
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="min-h-[120px] resize-none font-medium"
                />
              ) : (
                <p className="text-sm text-foreground font-medium leading-relaxed whitespace-pre-wrap">
                  {item.description || "No description provided."}
                </p>
              )}
            </div>

            {/* Meeting Fields */}
            {(isMeeting || item.startsAt) && (
              <div className="border-t border-border pt-6 space-y-4">
                <h3 className="font-black text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  Schedule Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Starts At:</span>
                    {isEditing ? (
                      <Input
                        type="datetime-local"
                        value={editStartsAt}
                        onChange={(e) => setEditStartsAt(e.target.value)}
                        className="font-bold text-sm"
                      />
                    ) : (
                      <span className="text-foreground text-sm font-semibold flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {item.startsAt ? new Date(item.startsAt).toLocaleString() : "N/A"}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Ends At:</span>
                    {isEditing ? (
                      <Input
                        type="datetime-local"
                        value={editEndsAt}
                        onChange={(e) => setEditEndsAt(e.target.value)}
                        className="font-bold text-sm"
                      />
                    ) : (
                      <span className="text-foreground text-sm font-semibold flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {item.endsAt ? new Date(item.endsAt).toLocaleString() : "N/A"}
                      </span>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Location:</span>
                    {isEditing ? (
                      <Input
                        type="text"
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        className="font-bold"
                      />
                    ) : (
                      <span className="text-foreground text-sm font-semibold flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        {item.location || "No location set"}
                      </span>
                    )}
                  </div>

                  {item.participants && item.participants.length > 0 && (
                    <div className="md:col-span-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Participants:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {item.participants.map((email) => (
                          <span
                            key={email}
                            className="bg-muted/50 border border-border px-2 py-0.5 rounded-[var(--ds-radius-pill)] text-xs font-semibold text-foreground"
                          >
                            {email}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {isMeeting && (
                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    {item.googleEventId ? (
                      <a
                        href={item.googleEventUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-bold rounded-[var(--ds-radius-btn)] border border-emerald-500/30 transition-all text-sm h-10 select-none active:scale-[0.97]"
                      >
                        <Calendar className="w-4 h-4" />
                        View in Google Calendar
                      </a>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={handleCalendarSync}
                        loading={isSyncingCalendar}
                        className="font-bold text-foreground dark:text-[#E5D8C9]"
                      >
                        <Calendar className="w-4 h-4 mr-1.5" />
                        Sync to Google Calendar
                      </Button>
                    )}

                    {item.meetLink && (
                      <a
                        href={item.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 font-bold rounded-[var(--ds-radius-btn)] border border-blue-500/30 transition-all text-sm h-10 select-none active:scale-[0.97]"
                      >
                        Join Meeting
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Email Reply Section */}
            {isReplyNeeded && (
              <div className="border-t border-border pt-6 space-y-4">
                <h3 className="font-black text-lg flex items-center gap-2">
                  <PaperPlaneTilt className="w-5 h-5 text-violet-400" />
                  Email Reply Assistant
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Suggested Reply Draft:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateReply}
                      loading={isGenerating}
                      className="font-bold text-foreground dark:text-[#E5D8C9]"
                    >
                      <Sparkle className="w-3.5 h-3.5 mr-1" />
                      Regenerate Draft
                    </Button>
                  </div>

                  <Textarea
                    value={editReply}
                    onChange={(e) => setEditReply(e.target.value)}
                    placeholder="Generate suggested reply or draft something here..."
                    className="min-h-[160px] resize-none font-medium text-foreground"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  {item.sentMailId ? (
                    <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 px-4 py-2 font-bold text-sm rounded-[var(--ds-radius-btn)] flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Reply Sent via Outlook at {item.sentAt ? new Date(item.sentAt).toLocaleTimeString() : ""}
                    </div>
                  ) : (
                    <Button
                      variant="default"
                      onClick={handleSendMail}
                      loading={isSendingMail}
                      className="font-bold"
                    >
                      <PaperPlaneTilt className="w-4 h-4 mr-1.5" />
                      Send via Outlook
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Links Section */}
            {item.links && item.links.length > 0 && (
              <div className="border-t border-border pt-6 space-y-4">
                <h3 className="font-black text-lg flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-indigo-400" />
                  Extracted Links
                </h3>
                <div className="flex flex-wrap gap-2">
                  {item.links.map((url, idx) => {
                    let hostname = "Open Link";
                    try {
                      hostname = new URL(url).hostname;
                    } catch (_) {}
                    return (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-[var(--ds-radius-pill)] text-xs font-semibold transition-all select-none active:scale-[0.97]"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[240px]">{hostname}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="sticky bottom-0 border-t border-border bg-background/85 backdrop-blur-md p-4 z-30 -mx-4 md:-mx-8 md:px-8 mt-8">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {item.status === "PENDING" && (
              <>
                <Button
                  variant="default"
                  onClick={() => handleUpdateStatus("APPROVED")}
                  className="font-bold w-full sm:w-auto justify-center"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  Approve Action
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus("IGNORED")}
                  className="font-bold text-foreground dark:text-[#E5D8C9] w-full sm:w-auto justify-center"
                >
                  <X className="w-4 h-4 mr-1.5" />
                  Ignore
                </Button>
              </>
            )}

            {item.status === "APPROVED" && (
              <Button
                variant="default"
                onClick={() => handleUpdateStatus("COMPLETED")}
                className="font-bold w-full sm:w-auto justify-center"
              >
                <Check className="w-4 h-4 mr-1.5" />
                Complete Task
              </Button>
            )}

            {item.status !== "PENDING" && item.status !== "APPROVED" && (
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus("PENDING")}
                className="font-bold text-foreground dark:text-[#E5D8C9] w-full sm:w-auto justify-center"
              >
                Revert to Pending
              </Button>
            )}
          </div>

          <Button
            variant="danger"
            onClick={() => setShowConfirmDelete(true)}
            className="font-bold w-full sm:w-auto justify-center"
          >
            <Trash className="w-4 h-4 mr-1.5" />
            Delete Item
          </Button>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={showConfirmDelete}
        onOpenChange={setShowConfirmDelete}
        title="Delete action item?"
        description="This will permanently delete this action item from your list. This action cannot be undone."
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </motion.div>
  );
}
