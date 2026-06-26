import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata = {
    title: "Email Policy | Inbox FM",
    description: "Email Policy for Inbox FM — how we send digests, promotions, alerts, and transactional messages.",
};

export default function EmailPolicyPage() {
    return (
        <main className="min-h-screen bg-background spotlight-bg grain-bg selection:bg-brand-orange/30 selection:text-white overflow-hidden text-foreground">
            <Navbar />

            <div className="relative max-w-4xl mx-auto px-6 pt-32 pb-24 z-10">
                <div className="bg-[#FAF6F0] dark:bg-[#161519] border-2 border-black dark:border-zinc-800 rounded-[var(--ds-radius-card)] p-8 md:p-12 space-y-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.06)]">
                    <div className="space-y-3">
                        <h1 className="text-4xl font-black tracking-tight">Email Policy</h1>
                        <p className="text-muted-foreground font-medium">
                            Last updated: June 13, 2026
                        </p>
                    </div>

                    <Section title="1. Our Commitment to Zero Spam">
                        <p>
                            We hate spam as much as you do. Inbox FM only sends communication signals that are essential to delivering your audio briefs, securing your account, notifying you of waitlist approvals, or providing critical product changes.
                        </p>
                    </Section>

                    <Section title="2. Categories of Communication">
                        <p>
                            We group our emails into three distinct channels so you have full control over what arrives in your inbox:
                        </p>
                        <ul className="list-disc ml-6 mt-4 space-y-2">
                            <li><strong>Daily Spoken Digests:</strong> The core Morning and Evening audio briefing notifications containing your personalized recap URLs and metrics.</li>
                            <li><strong>Product Outreach & Updates:</strong> Feature releases, changelogs, and announcements from the engineering team.</li>
                            <li><strong>Security & System Alerts:</strong> Password resets, verification codes, device logins, and Gmail sync warning alerts.</li>
                        </ul>
                    </Section>

                    <Section title="3. Subscription Settings & Control">
                        <p>
                            All registered users have access to an **Email Preferences Console** linked to their account. You can toggle optional categories (daily digests, updates, alerts) on or off at any time. When you sign up, you are opted in to all categories by default to ensure a smooth onboarding setup.
                        </p>
                    </Section>

                    <Section title="4. List-Unsubscribe Headers">
                        <p>
                            All marketing and transactional briefs include standard, compliant `List-Unsubscribe` headers and direct footer links. Unsubscribing via these links uses high-security signed tokens that do not expire, ensuring your requests are instantly and reliably processed.
                        </p>
                    </Section>

                    <Section title="5. Contact Email Operations">
                        <p>
                            If you believe you have received unauthorized emails from our domain or have trouble saving your settings, please contact us:
                        </p>
                        <div className="mt-3 p-4 bg-muted/30 rounded-2xl font-medium text-sm">
                            Email: <a href="mailto:support@inboxfm.me" className="text-primary hover:underline">support@inboxfm.me</a>
                        </div>
                    </Section>
                </div>
            </div>

            <Footer />
        </main>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-3">
            <h2 className="text-lg font-black tracking-tight text-foreground">{title}</h2>
            <div className="text-muted-foreground font-medium leading-relaxed">
                {children}
            </div>
        </section>
    );
}
