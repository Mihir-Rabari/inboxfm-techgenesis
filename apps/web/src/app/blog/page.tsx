"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Clock, Tag, ArrowLeft } from "@phosphor-icons/react";
import { Navbar } from "@/components/layout/Navbar";
import { blogPosts } from "@/data/blog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/shared/Spinner";
import { toast } from "sonner";
import api from "@/lib/api";

function BlogWaitlistForm() {
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await api.waitlist.join({ email });
      setIsSubmitted(true);
      toast.success("Welcome aboard!", {
        description: "You've been added to the waitlist.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Please try again.";
      toast.error("Could not join waitlist", { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto pt-4">
      {isSubmitted ? (
        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-sm font-semibold text-center text-foreground">
          ✓ Added to waitlist! We will contact you soon.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2 p-1.5 rounded-xl bg-secondary/35 border border-border/40 backdrop-blur-md">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-transparent border-0 h-10 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/50 font-bold"
          />
          <Button type="submit" disabled={isLoading} className="h-10 px-5 font-bold rounded-lg bg-primary hover:bg-primary/95 text-white active:scale-95 transition-transform cursor-pointer">
            {isLoading ? <Spinner size={14} /> : "Join Waitlist"}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function BlogListingPage() {
  return (
    <main className="min-h-screen bg-background spotlight-bg grain-bg text-foreground overflow-hidden">
      <Navbar />

      <div className="relative max-w-5xl mx-auto px-6 pt-32 pb-24 space-y-16">
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground/60 hover:text-brand-orange transition-colors group">
          <ArrowLeft className="mr-1.5 group-hover:-translate-x-0.5 transition-transform" /> Back to Home
        </Link>

        {/* Masthead */}
        <section className="text-left max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-[10px] font-mono font-bold text-brand-orange uppercase tracking-widest">
            <BookOpen weight="fill" />
            <span>Digital Focus &amp; Context</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
            The Inbox FM <br />
            <span className="italic font-normal text-brand-orange">Journal.</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground font-semibold leading-relaxed pt-2">
            Insights on morning focus preservation, cognitive stress reduction, eye fatigue, and the engineering behind our context extraction pipelines.
          </p>
        </section>

        {/* Blog Post Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {blogPosts.map((post, idx) => (
            <motion.article
              key={post.slug}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              className="group glass border border-border/30 rounded-[var(--ds-radius-card)] p-8 flex flex-col justify-between hover:border-brand-orange/20 transition-all duration-300 bg-card/40 relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground/65">
                    <Clock size={12} />
                    <span>{post.readTime}</span>
                  </div>
                  <span className="text-muted-foreground/35 text-xs">•</span>
                  <div className="flex gap-1">
                    {post.tags.slice(0, 2).map(t => (
                      <span key={t} className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 bg-secondary rounded-md text-foreground/80 border border-border/40">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <h3 className="text-2xl font-black tracking-tight leading-tight group-hover:text-brand-orange transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground font-semibold leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border/20 pt-6 mt-8">
                <span className="text-[10px] font-mono text-muted-foreground/60 uppercase">{post.date}</span>
                <Link href={`/blog/${post.slug}`} className="text-xs font-mono font-bold text-foreground group-hover:text-brand-orange transition-colors flex items-center gap-1.5 uppercase tracking-widest">
                  Read Article <ArrowRight className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Bottom waitlist capture */}
        <section className="glass rounded-[var(--ds-radius-card)] border border-border/40 p-8 md:p-12 text-center space-y-6 max-w-3xl mx-auto bg-card/25 mt-16 relative overflow-hidden">
          <div className="space-y-2">
            <h3 className="text-2xl md:text-3xl font-black tracking-tight">Protect your focus.</h3>
            <p className="text-sm text-muted-foreground font-semibold max-w-md mx-auto">
              Inbox FM turns messy overnight emails into a natural voice broadcast. Reserve access in our next onboarding batch.
            </p>
          </div>
          <BlogWaitlistForm />
        </section>

      </div>
    </main>
  );
}
