"use client";

export const SocialProof = () => {
  return (
    <section className="py-12 border-b bg-card/10 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
            Early Access Product
          </p>
          <h3 className="text-2xl md:text-3xl font-black tracking-tight">
            Built in public with our founding users.
          </h3>
          <p className="text-sm md:text-base text-muted-foreground font-medium leading-relaxed">
            We do not publish inflated usage numbers or unverified press logos.
            Inbox FM is currently in active rollout, and we share product
            progress through release notes and direct user feedback.
          </p>
        </div>
      </div>
    </section>
  );
};
