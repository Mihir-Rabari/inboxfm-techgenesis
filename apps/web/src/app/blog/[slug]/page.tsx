import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, Tag, BookOpen, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { Navbar } from "@/components/layout/Navbar";
import { blogPosts } from "@/data/blog";
import { Button } from "@/components/ui/button";

type Props = {
  params: Promise<{ slug: string }>;
};

async function getPost(slug: string) {
  return blogPosts.find(p => p.slug === slug) || null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) return { title: "Post Not Found" };

  const canonical = `https://inboxfm.me/blog/${slug}`;

  return {
    title: `${post.title} | Inbox FM Blog`,
    description: post.excerpt,
    alternates: {
      canonical: canonical,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url: canonical,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "datePublished": "2026-06-05T08:00:00Z",
    "author": {
      "@type": "Organization",
      "name": "Inbox FM Team",
      "url": "https://inboxfm.me"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Inbox FM",
      "logo": {
        "@type": "ImageObject",
        "url": "https://inboxfm.me/logo.png"
      }
    }
  };

  return (
    <main className="min-h-screen bg-background spotlight-bg grain-bg text-foreground overflow-x-hidden">
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24 space-y-10">
        
        {/* Back navigation */}
        <Link
          href="/blog"
          className="inline-flex items-center text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground/60 hover:text-brand-orange transition-colors group text-left"
        >
          <ArrowLeft className="mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Journal
        </Link>

        {/* Masthead */}
        <div className="space-y-6 text-left border-b border-border/20 pb-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-widest text-brand-orange">
              <Clock size={12} />
              {post.readTime}
            </span>
            <span className="text-muted-foreground/30 text-xs">•</span>
            <span className="text-xs font-mono text-muted-foreground/60 font-semibold">{post.date}</span>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap gap-2 pt-2">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-secondary text-foreground/80 border border-border/40"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Article Content */}
        <article className="prose prose-invert max-w-none text-left leading-relaxed text-muted-foreground/90 font-medium space-y-6 text-base md:text-lg">
          <div className="whitespace-pre-wrap">
            {post.content.trim()}
          </div>
        </article>

        {/* Action Call footer */}
        <section className="glass rounded-[var(--ds-radius-card)] border border-border/40 p-8 md:p-12 text-center bg-card/25 mt-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/5 rounded-full blur-[32px] pointer-events-none" />
          <div className="space-y-4 max-w-lg mx-auto">
            <div className="w-10 h-10 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-brand-orange mx-auto">
              <Sparkle weight="fill" />
            </div>
            <h3 className="text-2xl font-black tracking-tight">Hear outcomes, not inbox noise.</h3>
            <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
              Ditch early morning screens. Get personalized, high-fidelity spoken digests from Gmail overnight updates. Join our beta queue.
            </p>
            <div className="pt-2">
              <Link href="/">
                <Button size="brand" className="w-full bg-brand-orange text-black hover:bg-brand-orange/95 border-0 rounded-xl font-bold">
                  Request Invite Access
                </Button>
              </Link>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
