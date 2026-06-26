"use client";

import { motion } from "framer-motion";
import {
    Clock,
    Trash,
    PencilSimple,
    Microphone,
    Pause,
    Play,
    CalendarBlank
} from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ScheduleCardProps {
    schedule: {
        id: string | number;
        name: string;
        time: string;
        days: string;
        voice: string;
        active: boolean;
        nextRun?: string;
        styleName?: string;
    };
    onToggle?: () => void;
    onDelete?: () => void;
    onEdit?: () => void;
}

export const ScheduleCard = ({ schedule, onToggle, onDelete, onEdit }: ScheduleCardProps) => {
    return (
        <Card variant="glass" className={`group overflow-hidden transition-all duration-300 ${schedule.active ? '' : 'opacity-85'}`}>
            <CardContent className="p-0">
                <div className="p-5 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-[var(--ds-radius-inner)] border-2 border-[var(--ds-border-brutalist)] flex items-center justify-center transition-colors ${schedule.active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                <Clock size={24} weight="duotone" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                    <h4 className="text-base font-black capitalize tracking-tight">{schedule.name}</h4>
                                    <Badge
                                        variant={schedule.active ? "default" : "secondary"}
                                        className={`px-2 py-0 text-[9px] font-black uppercase tracking-wider rounded-[var(--ds-radius-pill)] border border-[var(--ds-border-brutalist)] ${schedule.active ? 'bg-green-500 hover:bg-green-500 text-white' : ''}`}
                                    >
                                        {schedule.active ? 'Active' : 'Paused'}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                    <span className="text-foreground">{schedule.time}</span>
                                    <span className="opacity-30">•</span>
                                    <span className="flex items-center gap-1">
                                        <CalendarBlank size={12} weight="bold" />
                                        {schedule.days}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Voice Persona & Style - Premium Styling */}
                        <div className="flex flex-col items-end gap-1">
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--ds-radius-pill)] border-2 border-[var(--ds-border-brutalist)] text-[11px] font-black uppercase tracking-tight transition-all duration-300 ${schedule.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                <Microphone size={14} weight="fill" />
                                {schedule.voice}
                            </div>
                            {schedule.styleName && (
                                <span className="text-[10px] font-mono text-zinc-500 font-bold">
                                    Style: {schedule.styleName}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Trust Signal / Next Run */}
                    {schedule.active && (
                        <div className="text-[10px] font-black text-green-600 dark:text-green-400 flex items-center gap-1.5 px-1 uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse border border-black dark:border-zinc-900" />
                            Next briefing: Tomorrow at {schedule.time}
                        </div>
                    )}

                    <div className="pt-3 border-t-2 border-dashed border-black/10 dark:border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className={`font-black text-xs gap-1.5`}
                                onClick={onToggle}
                            >
                                {schedule.active ? (
                                    <><Pause size={14} weight="bold" /> Pause</>
                                ) : (
                                    <><Play size={14} weight="bold" /> Resume</>
                                )}
                            </Button>
                            {onEdit && (
                                <Button variant="outline" size="sm" className="font-black text-xs gap-1.5" onClick={onEdit}>
                                    <PencilSimple size={14} weight="bold" /> Edit
                                </Button>
                            )}
                        </div>

                        <Button
                            variant="danger"
                            size="sm"
                            className="font-black text-xs gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
                            onClick={onDelete}
                        >
                            <Trash size={14} weight="bold" /> Delete
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
