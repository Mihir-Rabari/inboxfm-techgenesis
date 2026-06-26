"use client";

import React, { useState, useEffect } from "react";
import { api, Release, ReleaseChange } from "@/lib/api";
import {
  Plus,
  Trash2,
  Send,
  Eye,
  EyeOff,
  Edit2,
  Save,
  X,
  Check,
  AlertCircle,
  Loader2,
  Zap,
  Sparkles,
  Bug,
  Shield,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

const categories = ["FEATURE", "IMPROVEMENT", "FIX", "SECURITY"];

export default function AdminReleasesPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRelease, setEditingRelease] = useState<Partial<Release> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReleases();
  }, []);

  const fetchReleases = async () => {
    try {
      const data = await api.admin.getReleases();
      setReleases(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingRelease({
      version: "",
      title: "",
      description: "",
      content: "",
      changes: [],
      isPublished: false,
    });
  };

  const handleSave = async () => {
    if (!editingRelease) return;
    setIsSaving(true);
    setError(null);

    try {
      if (editingRelease.id) {
        await api.admin.updateRelease(editingRelease.id, editingRelease);
      } else {
        await api.admin.createRelease(editingRelease as any);
      }
      await fetchReleases();
      setEditingRelease(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this release?")) return;
    try {
      await api.admin.deleteRelease(id);
      await fetchReleases();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleTogglePublish = async (release: Release) => {
    try {
      await api.admin.updateRelease(release.id, {
        isPublished: !release.isPublished,
      });
      await fetchReleases();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBroadcast = async (id: string) => {
    if (!confirm("This will send an email to ALL active users. Proceed?"))
      return;
    try {
      const res = await api.admin.broadcastRelease(id);
      alert(`Broadcast successful! Sent to ${res.sentCount} users.`);
      await fetchReleases();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const addChange = () => {
    if (!editingRelease) return;
    const changes = [
      ...(editingRelease.changes || []),
      { category: "IMPROVEMENT", description: "" },
    ];
    setEditingRelease({
      ...editingRelease,
      changes: changes as ReleaseChange[],
    });
  };

  const removeChange = (index: number) => {
    if (!editingRelease) return;
    const changes = [...(editingRelease.changes || [])];
    changes.splice(index, 1);
    setEditingRelease({ ...editingRelease, changes });
  };

  const updateChange = (index: number, field: string, value: string) => {
    if (!editingRelease) return;
    const changes = [...(editingRelease.changes || [])];
    changes[index] = { ...changes[index], [field]: value };
    setEditingRelease({ ...editingRelease, changes });
  };

  if (isLoading)
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );

  return (
    <div className="w-full h-full overflow-y-auto p-8 bg-muted/10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black">Release Management</h1>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus size={18} /> New Release
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {editingRelease && (
        <div className="bg-white border rounded-3xl p-8 shadow-xl space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">
              {editingRelease.id ? "Edit" : "Create"} Release
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingRelease(null)}
            >
              <X size={20} />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Version
              </label>
              <input
                className="w-full p-3 border rounded-xl"
                value={editingRelease.version}
                onChange={(e) =>
                  setEditingRelease({
                    ...editingRelease,
                    version: e.target.value,
                  })
                }
                placeholder="v1.2.0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Title
              </label>
              <input
                className="w-full p-3 border rounded-xl"
                value={editingRelease.title}
                onChange={(e) =>
                  setEditingRelease({
                    ...editingRelease,
                    title: e.target.value,
                  })
                }
                placeholder="The Big Update"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Short Description (Intro)
            </label>
            <textarea
              className="w-full p-3 border rounded-xl h-24"
              value={editingRelease.description || ""}
              onChange={(e) =>
                setEditingRelease({
                  ...editingRelease,
                  description: e.target.value,
                })
              }
              placeholder="A brief overview of this release..."
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Changes Grouping
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={addChange}
                className="gap-2"
              >
                <Plus size={14} /> Add Change
              </Button>
            </div>
            <div className="space-y-3">
              {editingRelease.changes?.map((change, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <select
                    className="p-2 border rounded-lg text-sm bg-muted"
                    value={change.category}
                    onChange={(e) =>
                      updateChange(i, "category", e.target.value)
                    }
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <input
                    className="flex-1 p-2 border rounded-lg text-sm"
                    value={change.description}
                    onChange={(e) =>
                      updateChange(i, "description", e.target.value)
                    }
                    placeholder="Description of the change..."
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeChange(i)}
                    className="text-destructive"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Full Content (Markdown)
            </label>
            <textarea
              className="w-full p-3 border rounded-xl h-40 font-mono text-sm"
              value={editingRelease.content}
              onChange={(e) =>
                setEditingRelease({
                  ...editingRelease,
                  content: e.target.value,
                })
              }
              placeholder="Detailed technical notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setEditingRelease(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Save className="mr-2" size={18} />
              )}
              Save Release
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Version
              </th>
              <th className="p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Title
              </th>
              <th className="p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Status
              </th>
              <th className="p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Created
              </th>
              <th className="p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {releases.map((release) => (
              <tr
                key={release.id}
                className="hover:bg-muted/20 transition-colors"
              >
                <td className="p-4 font-mono font-bold text-primary">
                  {release.version}
                </td>
                <td className="p-4">
                  <div className="font-bold">{release.title}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-xs">
                    {release.description}
                  </div>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${release.isPublished ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}
                  >
                    {release.isPublished ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  {format(new Date(release.createdAt), "MMM d, yyyy")}
                </td>
                <td className="p-4 text-right space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTogglePublish(release)}
                    title={release.isPublished ? "Unpublish" : "Publish"}
                  >
                    {release.isPublished ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingRelease(release)}
                  >
                    <Edit2 size={18} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBroadcast(release.id)}
                    disabled={!!release.sentAt}
                    className={
                      release.sentAt ? "text-muted-foreground" : "text-blue-600"
                    }
                    title="Broadcast to Users"
                  >
                    <Send size={18} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(release.id)}
                    className="text-destructive"
                  >
                    <Trash2 size={18} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
