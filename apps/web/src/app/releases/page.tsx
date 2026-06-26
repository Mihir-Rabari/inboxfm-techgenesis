"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
    ArrowRight, 
    Lightning, 
    Shield, 
    Bug, 
    Sparkle, 
    Clock
} from '@phosphor-icons/react';
import { format } from 'date-fns';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { api, Release } from '@/lib/api';

const categoryIcons: Record<string, any> = {
    FEATURE: Sparkle,
    IMPROVEMENT: Lightning,
    FIX: Bug,
    SECURITY: Shield,
};

const categoryColors: Record<string, string> = {
    FEATURE: 'text-purple-500 bg-purple-500/10 border-purple-500/20 dark:text-purple-400 dark:bg-purple-400/10 dark:border-purple-500/20',
    IMPROVEMENT: 'text-blue-500 bg-blue-500/10 border-blue-500/20 dark:text-blue-400 dark:bg-blue-400/10 dark:border-blue-500/20',
    FIX: 'text-brand-orange bg-brand-orange/10 border-brand-orange/20 dark:text-orange-400 dark:bg-orange-400/10 dark:border-orange-500/20',
    SECURITY: 'text-red-500 bg-red-500/10 border-red-500/20 dark:text-red-400 dark:bg-red-400/10 dark:border-red-500/20',
};

export default function ReleasesPage() {
    const [releases, setReleases] = useState<Release[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.releases.getAll()
            .then(data => {
                setReleases(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load releases:", err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <main className="min-h-screen bg-background spotlight-bg grain-bg text-foreground overflow-hidden flex flex-col justify-center items-center">
                <div className="space-y-4 text-center">
                    <Sparkle size={48} className="animate-spin text-brand-orange mx-auto" />
                    <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Synchronizing releases...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background spotlight-bg grain-bg selection:bg-primary/30 selection:text-white overflow-hidden text-foreground">
            {/* Global Sticky Capsule Navbar */}
            <Navbar />

            <div className="relative max-w-5xl mx-auto px-6 pt-32 pb-24 space-y-20">
                {/* Header Masthead */}
                <section className="relative z-10 text-center max-w-3xl mx-auto space-y-6 pt-12">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/20 dark:bg-white/5 dark:border-white/10 backdrop-blur-xl text-[10px] font-mono font-bold text-primary shadow-sm tracking-[0.18em]">
                        <Sparkle weight="fill" className="animate-pulse text-primary" />
                        <span className="uppercase">System Evolution</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black leading-[0.9] tracking-tighter text-glow text-heading">
                        Every <span className="italic font-normal text-brand-orange">Update.</span>
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium pt-4">
                        Track the development of Inbox FM as we build the next generation of digital focus tools.
                    </p>
                </section>

                {/* Releases Container */}
                <div className="relative z-10 max-w-4xl mx-auto">
                    {releases.length === 0 ? (
                        <div className="text-center py-20 bg-card/20 border border-border/30 backdrop-blur-md rounded-[2.5rem]">
                            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">No updates logged yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {releases.map((release: any) => (
                                <div 
                                    key={release.id}
                                    className="group relative glass rounded-[2.5rem] p-8 md:p-12 overflow-hidden border border-border/30 hover:border-brand-orange/20 transition-all duration-300 shadow-[var(--ds-shadow-card)]"
                                >
                                    <div className="relative z-10 grid md:grid-cols-12 gap-10">
                                        <div className="md:col-span-4 space-y-6">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3 text-brand-orange font-archivo-black text-3xl tracking-tighter">
                                                    {release.version}
                                                </div>
                                                <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">
                                                    <Clock size={14} weight="bold" />
                                                    {format(new Date(release.createdAt), 'MMMM d, yyyy')}
                                                </div>
                                            </div>

                                            <Link href={`/releases/${release.slug}`}>
                                                <Button 
                                                    variant="secondary"
                                                    className="font-bold text-[10px] h-10 px-5 rounded-full bg-secondary/40 text-foreground hover:bg-secondary/60 hover:scale-[1.02] active:scale-[0.97] transition-all border border-border"
                                                >
                                                    Full Notes{" "}
                                                    <ArrowRight weight="bold" className="ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                                                </Button>
                                            </Link>
                                        </div>

                                        <div className="md:col-span-8 space-y-8 text-left">
                                            <div className="space-y-4">
                                                <h2 className="text-3xl font-black text-heading tracking-tight leading-none">
                                                    {release.title}
                                                </h2>
                                                <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                                                    {release.description}
                                                </p>
                                            </div>

                                            {release.changes && release.changes.length > 0 && (
                                                <div className="grid gap-3">
                                                    {release.changes.slice(0, 3).map((change: any, idx: number) => {
                                                        const Icon = categoryIcons[change.category] || Lightning;
                                                        return (
                                                            <div key={idx} className="flex gap-4 items-start group/item">
                                                                <div className={`mt-1 p-1.5 rounded-lg border ${categoryColors[change.category] || 'bg-secondary/40 border-border'}`}>
                                                                    <Icon size={14} weight="bold" />
                                                                </div>
                                                                <p className="text-sm font-medium text-muted-foreground group-hover/item:text-foreground transition-colors">
                                                                    {change.description}
                                                                </p>
                                                            </div>
                                                        );
                                                    })}
                                                    {release.changes.length > 3 && (
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 pl-11">
                                                            + {release.changes.length - 3} more updates
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="pt-24 border-t border-border/30 flex justify-center text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                    <span>© {new Date().getFullYear()} VEDLABS.</span>
                </footer>
            </div>
        </main>
    );
}
