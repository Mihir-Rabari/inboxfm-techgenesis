"use client";

import React, { useEffect, useState } from 'react';
import { 
    ArrowLeft, 
    Sparkle, 
    Lightning, 
    Bug, 
    Shield, 
    Clock,
    RocketLaunch
} from '@phosphor-icons/react';
import Link from 'next/link';
import { format } from 'date-fns';
import { api, Release } from '@/lib/api';
import { Button } from '@/components/ui/button';

const categoryIcons: Record<string, any> = {
    FEATURE: Sparkle,
    IMPROVEMENT: Lightning,
    FIX: Bug,
    SECURITY: Shield,
};

const categoryColors: Record<string, string> = {
    FEATURE: 'text-purple-400 bg-purple-400/10 border-purple-500/20',
    IMPROVEMENT: 'text-blue-400 bg-blue-400/10 border-blue-500/20',
    FIX: 'text-orange-400 bg-orange-400/10 border-orange-500/20',
    SECURITY: 'text-red-400 bg-red-400/10 border-red-500/20',
};

type Props = {
    params: Promise<{ slug: string }>;
};

function renderMarkdownToHtml(markdown: string): string {
    if (!markdown) return "";
    
    let html = markdown;

    // 1. Headers (e.g. ### Heading 3, ## Heading 2, # Heading 1)
    html = html.replace(/^### (.*?)$/gm, '<h3 class="text-xl font-bold text-white mt-8 mb-4">$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2 class="text-3xl font-black tracking-tight text-white mt-12 mb-6 border-b border-zinc-800 pb-2">$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1 class="text-4xl font-black tracking-tighter text-white mt-16 mb-8">$1</h1>');

    // 2. Bold (**text** or __text__)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong class="text-white font-bold">$1</strong>');

    // 3. Italic (*text* or _text_)
    html = html.replace(/\*(.*?)\*/g, '<em class="text-zinc-300 italic">$1</em>');
    html = html.replace(/_(.*?)_/g, '<em class="text-zinc-300 italic">$1</em>');

    // 4. Code block (```code```)
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl font-mono text-sm text-orange-400 overflow-x-auto my-6">$1</pre>');

    // 5. Inline Code (`code`)
    html = html.replace(/`(.*?)`/g, '<code class="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded font-mono text-sm text-orange-400">$1</code>');

    // 6. Horizontal Rules (---)
    html = html.replace(/^---$/gm, '<div class="h-px bg-zinc-800 my-8"></div>');

    // 7. Unordered Lists (- item or * item)
    const lines = html.split("\n");
    let inList = false;
    const processedLines = lines.map(line => {
      const match = line.match(/^[-*+]\s+(.*)$/);
      if (match) {
        let prefix = "";
        if (!inList) {
          inList = true;
          prefix = '<ul class="list-disc pl-6 space-y-2 my-6 text-zinc-300">';
        }
        return prefix + `<li class="leading-relaxed">${match[1]}</li>`;
      } else {
        if (inList) {
          inList = false;
          return '</ul>' + line;
        }
        return line;
      }
    });
    if (inList) {
      processedLines.push('</ul>');
    }
    html = processedLines.join("\n");

    // 8. Paragraphs & Line breaks
    const blocks = html.split(/\n\s*\n/);
    const wrappedBlocks = blocks.map(block => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      
      if (trimmed.startsWith("<h") || trimmed.startsWith("<ul") || trimmed.startsWith("<li") || trimmed.startsWith("<pre") || trimmed.startsWith("<div") || trimmed.startsWith("</ul")) {
        return trimmed;
      }
      
      return `<p class="leading-relaxed mb-4 text-zinc-300 text-lg">${trimmed.replace(/\n/g, "<br>")}</p>`;
    });

    return wrappedBlocks.join("\n").trim();
}

export default function ReleaseDetailPage({ params }: Props) {
    const resolvedParams = React.use(params) as { slug: string };
    const slug = resolvedParams?.slug;

    const [release, setRelease] = useState<Release | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) return;
        api.releases.getBySlug(slug)
            .then(data => {
                setRelease(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load release detail:", err);
                setLoading(false);
            });
    }, [slug]);

    if (loading) {
        return (
            <main className="min-h-screen bg-[#050505] text-zinc-400 font-sans flex flex-col justify-center items-center overflow-hidden">
                <div className="space-y-4 text-center">
                    <Sparkle size={48} className="animate-spin text-brand-orange mx-auto" />
                    <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Retrieving release details...</p>
                </div>
            </main>
        );
    }

    if (!release) {
        return (
            <main className="min-h-screen bg-[#050505] text-zinc-400 font-sans flex flex-col justify-center items-center overflow-hidden">
                <div className="space-y-6 text-center max-w-sm px-6">
                    <p className="text-base font-bold uppercase tracking-widest text-brand-orange">Release Not Found</p>
                    <Link href="/releases">
                        <Button 
                            variant="secondary"
                            className="font-bold text-[10px] h-10 px-5 rounded-full bg-secondary/40 text-foreground hover:bg-secondary/60 hover:scale-[1.02] active:scale-[0.97] transition-all border border-border"
                        >
                            Return to Releases
                        </Button>
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#050505] text-zinc-400 font-sans selection:bg-orange-500/30 selection:text-white overflow-hidden">
            {/* Background Orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/5 rounded-full blur-[120px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
            </div>

            <div className="relative max-w-4xl mx-auto px-6 py-12 md:py-24 space-y-16">
                <header className="flex justify-between items-center">
                    <Link href="/releases">
                        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors group">
                            <ArrowLeft weight="bold" className="group-hover:-translate-x-1 transition-transform" />
                            All Releases
                        </div>
                    </Link>
                </header>

                <article className="space-y-16">
                    {/* Hero Section */}
                    <section className="space-y-8">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-black text-orange-500 uppercase tracking-widest">
                                <RocketLaunch size={14} weight="bold" />
                                {release.version}
                            </div>
                            <div className="inline-flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                <Clock size={14} weight="bold" />
                                {format(new Date(release.createdAt), 'MMMM d, yyyy')}
                            </div>
                        </div>

                        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9]">
                            {release.title}
                        </h1>

                        <p className="text-2xl text-zinc-300 font-medium leading-tight max-w-2xl">
                            {release.description}
                        </p>
                    </section>

                    {/* Content Section */}
                    <section className="bg-[#0A0A0A] border border-zinc-800 rounded-[2.5rem] p-8 md:p-12 space-y-12">
                        {release.changes && release.changes.length > 0 && (
                            <div className="space-y-10">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Change Log</h2>
                                <div className="grid gap-8">
                                    {release.changes.map((change: any, i: number) => {
                                        const Icon = categoryIcons[change.category] || Lightning;
                                        return (
                                            <div key={i} className="flex gap-6 items-start group">
                                                <div className={`mt-1 p-2 rounded-xl border ${categoryColors[change.category] || 'bg-zinc-900 border-zinc-800'}`}>
                                                    <Icon size={20} weight="bold" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className={`text-[10px] font-black uppercase tracking-widest ${categoryColors[change.category]?.split(' ')[0] || 'text-zinc-500'}`}>
                                                        {change.category}
                                                    </div>
                                                    <p className="text-xl font-medium text-zinc-300 group-hover:text-white transition-colors leading-relaxed">
                                                        {change.description}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Detailed Release Notes */}
                        {release.content && (
                            <div className="space-y-8 border-t border-zinc-900 pt-12">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Detailed Notes</h2>
                                <div 
                                    className="prose prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tighter prose-headings:text-white prose-a:text-orange-500 hover:prose-a:underline text-zinc-300 text-lg leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(release.content) }}
                                />
                            </div>
                        )}
                    </section>
                </article>

                <footer className="pt-24 border-t border-zinc-900 flex justify-center text-[10px] font-black uppercase tracking-[0.3em]">
                    <span>© {new Date().getFullYear()} VEDLABS.</span>
                </footer>
            </div>
        </main>
    );
}
