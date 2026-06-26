"use client";

import * as React from "react";
import { ModalShell } from "@/components/shared/ModalShell";
import { Button } from "@/components/ui/button";
import { Palette, Sparkle } from "@phosphor-icons/react";
import { toast } from "sonner";
import api, { BriefingStyle } from "@/lib/api";

interface CreateStyleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  styleToEdit?: BriefingStyle | null;
  onSave: () => void;
}

export function CreateStyleModal({
  open,
  onOpenChange,
  styleToEdit,
  onSave,
}: CreateStyleModalProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [prompt, setPrompt] = React.useState("");
  const [isDefault, setIsDefault] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      if (styleToEdit) {
        setName(styleToEdit.name);
        setDescription(styleToEdit.description || "");
        setPrompt(styleToEdit.prompt);
        setIsDefault(styleToEdit.isDefault);
      } else {
        setName("");
        setDescription("");
        setPrompt("");
        setIsDefault(false);
      }
    }
  }, [open, styleToEdit]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a style name");
      return;
    }
    if (!prompt.trim()) {
      toast.error("Please enter a custom system prompt");
      return;
    }

    setIsSaving(true);
    try {
      if (styleToEdit) {
        await api.styles.update(styleToEdit.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          prompt: prompt.trim(),
          isDefault,
        });
        toast.success("Briefing style updated!");
      } else {
        await api.styles.create({
          name: name.trim(),
          description: description.trim() || undefined,
          prompt: prompt.trim(),
          isDefault,
        });
        toast.success("Briefing style created!");
      }
      onSave();
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save style:", err);
      toast.error("Failed to save briefing style", {
        description: err instanceof Error ? err.message : "An unexpected error occurred",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const footer = (
    <div className="flex gap-2 w-full">
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(false)}
        className="flex-1 font-bold border-2 border-black dark:border-zinc-700 bg-white hover:bg-zinc-50 dark:bg-zinc-900 text-black dark:text-white"
        disabled={isSaving}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        form="style-form"
        className="flex-1 font-bold border-2 border-black dark:border-zinc-700 bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-primary/95 disabled:opacity-50"
        loading={isSaving}
      >
        {styleToEdit ? "Update Style" : "Create Style"}
      </Button>
    </div>
  );

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      icon={<Palette size={22} weight="fill" />}
      title={styleToEdit ? "Edit Briefing Style" : "Create Briefing Style"}
      description={
        styleToEdit
          ? "Modify the custom system instructions for your daily briefs."
          : "Define custom AI personality prompts to shape your narrative summary voice."
      }
      footer={footer}
      size="default"
    >
      <form id="style-form" onSubmit={handleSave} className="space-y-4 text-left">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase tracking-widest text-zinc-500">
            Style Name
          </label>
          <input
            type="text"
            placeholder="e.g. Executive Summary, Casual TL;DR"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-700 text-black dark:text-white font-medium rounded-lg focus:outline-none placeholder:text-zinc-500 text-sm"
            required
            disabled={isSaving}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase tracking-widest text-zinc-500">
            Description
          </label>
          <input
            type="text"
            placeholder="Briefly describe when to use this style..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-700 text-black dark:text-white font-medium rounded-lg focus:outline-none placeholder:text-zinc-500 text-sm"
            disabled={isSaving}
          />
        </div>

        {/* Prompt */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500">
              System Instructions (AI Prompt)
            </label>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Sparkle className="w-3.5 h-3.5 text-primary" weight="fill" />
              Custom Instruction
            </span>
          </div>
          <textarea
            placeholder="e.g. Summarize the inbox in a professional bulleted list, focused on customer support issues and marketing metrics. Do not include news..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-700 text-black dark:text-white font-mono leading-relaxed rounded-lg focus:outline-none placeholder:text-zinc-500 text-xs"
            required
            disabled={isSaving}
          />
        </div>

        {/* Default toggle */}
        <div className="flex items-center gap-2.5 pt-1">
          <input
            type="checkbox"
            id="is-default"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="rounded border-black dark:border-zinc-700 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
            disabled={isSaving || (styleToEdit?.isDefault ?? false)}
          />
          <label
            htmlFor="is-default"
            className="text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none"
          >
            Set as default style for new briefings
          </label>
        </div>
      </form>
    </ModalShell>
  );
}
