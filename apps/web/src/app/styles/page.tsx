"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { CreateStyleModal } from "@/components/styles/CreateStyleModal";
import { toast } from "sonner";
import api, { BriefingStyle } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Palette,
  Plus,
  Pencil,
  Trash,
  CheckCircle,
  Star
} from "@phosphor-icons/react";

export default function StylesPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [styles, setStyles] = useState<BriefingStyle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [styleToEdit, setStyleToEdit] = useState<BriefingStyle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [styleToDelete, setStyleToDelete] = useState<BriefingStyle | null>(null);

  const fetchStyles = useCallback(async () => {
    try {
      const data = await api.styles.getAll();
      setStyles(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch styles:", err);
      setError(err instanceof Error ? err.message : "Failed to load styles");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStyles();
    }
  }, [isAuthenticated, fetchStyles]);

  const handleMakeDefault = async (style: BriefingStyle) => {
    if (style.isDefault) return;
    try {
      await api.styles.setDefault(style.id);
      toast.success(`Set "${style.name}" as default style`);
      await fetchStyles();
    } catch (err) {
      toast.error("Failed to update default style");
    }
  };

  const handleDeleteStyle = async () => {
    if (!styleToDelete) return;
    try {
      await api.styles.delete(styleToDelete.id);
      toast.success("Briefing style deleted");
      await fetchStyles();
    } catch (err) {
      toast.error("Failed to delete style");
    } finally {
      setStyleToDelete(null);
    }
  };

  if (authLoading || (isLoading && styles.length === 0)) {
    return <LoadingScreen message="Loading Briefing Styles..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 px-4 md:px-0">
      <PageHeader
        title="Briefing Styles"
        description="Customize instructions for briefings to summarize emails exactly how you want."
        action={
          <Button
            onClick={() => {
              setStyleToEdit(null);
              setIsModalOpen(true);
            }}
            size="brand"
            className="gap-2 border-2 border-black"
          >
            <Plus className="w-4 h-4" />
            <span>Create Style</span>
          </Button>
        }
      />

      {error && (
        <div className="p-4 border-2 border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-lg text-sm font-bold shadow-[3px_3px_0px_0px_rgba(239,68,68,0.2)]">
          {error}
        </div>
      )}

      {styles.length === 0 ? (
        <EmptyState
          icon={<Palette size={48} weight="duotone" />}
          title="No briefing styles yet"
          description="Create custom prompt instructions to control the narrative voice, detail level, and focus of your audio daily briefs."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {styles.map((style, index) => (
              <motion.div
                key={style.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05, ease: [0.23, 1, 0.32, 1] }}
                layout
              >
                <div
                  className={cn(
                    "border-2 border-black dark:border-zinc-700 rounded-xl p-5 flex flex-col justify-between gap-4 bg-white dark:bg-zinc-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(39,39,42,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all",
                    style.isDefault && "border-primary dark:border-primary ring-1 ring-primary/20"
                  )}
                >
                  {/* Style Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-base text-black dark:text-white truncate">
                          {style.name}
                        </h4>
                        {style.isDefault && (
                          <span className="bg-primary/10 text-primary border border-primary/25 px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider">
                            Default Style
                          </span>
                        )}
                      </div>
                      {style.description && (
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                          {style.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Prompt Preview */}
                  <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-black/5 dark:border-zinc-800">
                    <p className="font-mono text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400 line-clamp-3 select-all whitespace-pre-wrap">
                      {style.prompt}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-dashed border-black/10 dark:border-white/10 pt-3 mt-1">
                    <div>
                      {!style.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMakeDefault(style)}
                          className="text-xs text-zinc-500 hover:text-primary font-bold gap-1 p-0 h-auto"
                        >
                          <Star className="w-3.5 h-3.5" />
                          <span>Set as Default</span>
                        </Button>
                      )}
                      {style.isDefault && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" weight="fill" />
                          <span>Active Default</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon-xs"
                        onClick={() => {
                          setStyleToEdit(style);
                          setIsModalOpen(true);
                        }}
                        className="border-2 border-black dark:border-zinc-700 h-8 w-8 text-black dark:text-white"
                        title="Edit Style"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="icon-xs"
                        onClick={() => setStyleToDelete(style)}
                        className="border-2 border-black dark:border-zinc-700 h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                        title="Delete Style"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Style Modal */}
      <CreateStyleModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        styleToEdit={styleToEdit}
        onSave={fetchStyles}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={styleToDelete !== null}
        onOpenChange={(open) => !open && setStyleToDelete(null)}
        title="Delete Briefing Style"
        description="Are you sure you want to delete this custom briefing style? Schedules currently using this style will fallback to the system default voice instructions."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteStyle}
      />
    </div>
  );
}
