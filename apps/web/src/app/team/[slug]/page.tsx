import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { founders } from '@/data/founders';
import { InstagramLogo, LinkedinLogo, EnvelopeSimple, ArrowLeft, Quotes, CheckCircle } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const founder = founders.find((f) => f.slug === slug);

    if (!founder) return { title: 'Founder Not Found' };

    const canonical = `https://inboxfm.me/team/${slug}`;

    return {
        title: `${founder.name} | ${founder.role}`,
        description: founder.tagline,
        alternates: {
            canonical: canonical,
        },
        openGraph: {
            title: `${founder.name} | Inbox FM`,
            description: founder.tagline,
            type: 'profile',
            url: canonical,
            images: [
                {
                    url: `https://inboxfm.me/api/og?title=${encodeURIComponent(founder.name)}&subtitle=${encodeURIComponent(founder.role)}&type=founder`,
                    width: 1200,
                    height: 630,
                }
            ]
        }
    };
}

export default async function FounderDetailPage({ params }: Props) {
    const { slug } = await params;
    const founder = founders.find((f) => f.slug === slug);

    if (!founder) notFound();

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: founder.name,
        jobTitle: founder.role,
        description: founder.tagline,
        image: `https://inboxfm.me/api/og?title=${encodeURIComponent(founder.name)}&subtitle=${encodeURIComponent(founder.role)}&type=founder`,
        url: `https://inboxfm.me/team/${founder.slug}`,
        sameAs: [
            founder.socials.linkedin,
            founder.socials.instagram,
        ].filter(Boolean),
        worksFor: {
            '@type': 'Organization',
            name: 'Inbox FM',
            url: 'https://inboxfm.me'
        }
    };

    const isMihir = founder.slug === 'mihir-rabari';
    const accentColor = isMihir ? 'text-orange-500' : 'text-blue-400 dark:text-blue-400';
    const accentGradient = isMihir ? 'from-orange-500 to-amber-200' : 'from-blue-400 to-indigo-300';
    const accentBg = isMihir ? 'bg-orange-500/10' : 'bg-blue-500/10';

    return (
        <main className="min-h-screen bg-background spotlight-bg grain-bg text-muted-foreground font-sans selection:bg-orange-500/30 selection:text-white overflow-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            
            {/* Global Sticky Capsule Navbar */}
            <Navbar />
            
            {/* Background Orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] ${isMihir ? 'bg-orange-500/5' : 'bg-blue-500/5'} rounded-full blur-[120px]`} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
            </div>
            
            <div className="relative max-w-5xl mx-auto px-6 pt-32 pb-24 space-y-20 z-10">
                <header className="flex justify-between items-center">
                    <Link href="/team">
                        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group">
                            <ArrowLeft weight="bold" className="group-hover:-translate-x-1 transition-transform" />
                            Back to Team
                        </div>
                    </Link>
                </header>

                <div className="grid lg:grid-cols-12 gap-16 items-start">
                    {/* Left Column: Visual & Socials */}
                    <div className="lg:col-span-4 space-y-12 sticky top-32">
                        <div className="relative group">
                            <div className="relative aspect-square bg-[#FAF6F0] dark:bg-[#0B0B0B] border-2 border-black dark:border-zinc-800 rounded-[var(--ds-radius-card)] flex items-center justify-center overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.06)]">
                                <span className={`text-8xl font-black ${accentColor}`}>
                                    {founder.name.split(' ').map(n => n[0]).join('')}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-center gap-6">
                            {founder.socials.email && (
                                <a href={`mailto:${founder.socials.email}`} className="w-14 h-14 rounded-[var(--ds-radius-inner)] bg-[#FAF6F0] dark:bg-zinc-900 border-2 border-black dark:border-zinc-800 flex items-center justify-center text-muted-foreground hover:text-brand-orange hover:border-brand-orange transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.06)]">
                                    <EnvelopeSimple size={24} weight="bold" />
                                </a>
                            )}
                            {founder.socials.instagram && (
                                <a href={founder.socials.instagram} target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-[var(--ds-radius-inner)] bg-[#FAF6F0] dark:bg-zinc-900 border-2 border-black dark:border-zinc-800 flex items-center justify-center text-muted-foreground hover:text-brand-orange hover:border-brand-orange transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.06)]">
                                    <InstagramLogo size={24} weight="bold" />
                                </a>
                            )}
                            {founder.socials.linkedin && (
                                <a href={founder.socials.linkedin} target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-[var(--ds-radius-inner)] bg-[#FAF6F0] dark:bg-zinc-900 border-2 border-black dark:border-zinc-800 flex items-center justify-center text-muted-foreground hover:text-brand-orange hover:border-brand-orange transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.06)]">
                                    <LinkedinLogo size={24} weight="bold" />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Bio & Content */}
                    <div className="lg:col-span-8 space-y-16">
                        <section className="space-y-6">
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-[var(--ds-radius-pill)] ${accentBg} border border-black/10 dark:border-zinc-800 backdrop-blur-xl text-xs font-bold ${accentColor} uppercase tracking-widest`}>
                                {founder.role}
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-foreground tracking-tighter leading-none">
                                {founder.name.split(' ')[0]} <br/>
                                <span className={accentColor}>
                                    {founder.name.split(' ')[1]}
                                </span>
                            </h1>
                            <p className="text-2xl text-foreground font-medium leading-tight max-w-2xl">
                                {founder.tagline}
                            </p>
                        </section>

                        <section className="relative p-10 bg-[#FAF6F0] dark:bg-[#161519] border-2 border-black dark:border-zinc-800 rounded-[var(--ds-radius-card)] overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.06)]">
                            <div className={`absolute top-0 right-0 p-8 opacity-10 ${accentColor}`}>
                                <Quotes size={64} weight="fill" />
                            </div>
                            <p className="text-2xl md:text-3xl font-bold text-foreground italic leading-snug">
                                &ldquo;{founder.quote}&rdquo;
                            </p>
                        </section>

                        <div className="grid md:grid-cols-2 gap-12">
                            <section className="space-y-8">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Profile</h2>
                                <div className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap font-medium">
                                    {founder.bio}
                                </div>
                            </section>

                            <div className="space-y-12">
                                <section className="space-y-6">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Expertise</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {founder.specialties.map((spec, i) => (
                                            <span key={i} className="px-4 py-2 bg-secondary border-2 border-black dark:border-zinc-800 rounded-[var(--ds-radius-inner)] text-xs font-bold uppercase tracking-widest text-foreground shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1px_1px_0px_0px_var(--ds-border-brutalist)]">
                                                {spec}
                                            </span>
                                        ))}
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Core Impact</h2>
                                    <div className="space-y-4">
                                        {founder.highlights.map((highlight, i) => (
                                            <div key={i} className="flex gap-3 items-start group">
                                                <div className={`p-1.5 rounded-lg ${accentBg} border border-black/10 dark:border-zinc-800 mt-1`}>
                                                    <CheckCircle size={14} weight="bold" className={accentColor} />
                                                </div>
                                                <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                                                    {highlight}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Shared Footer */}
            <Footer />
        </main>
    );
}
