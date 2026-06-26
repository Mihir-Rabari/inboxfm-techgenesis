import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata = {
    title: "Waitlist Policy | Inbox FM",
    description: "Waitlist Policy for Inbox FM — details about wave entries, spot reservations, and access codes.",
};

export default function WaitlistPolicyPage() {
    return (
        <main className="min-h-screen bg-background spotlight-bg grain-bg selection:bg-brand-orange/30 selection:text-white overflow-hidden text-foreground">
            <Navbar />

            <div className="relative max-w-4xl mx-auto px-6 pt-32 pb-24 z-10">
                <div className="bg-[#FAF6F0] dark:bg-[#161519] border-2 border-black dark:border-zinc-800 rounded-[var(--ds-radius-card)] p-8 md:p-12 space-y-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.06)]">
                    <div className="space-y-3">
                        <h1 className="text-4xl font-black tracking-tight">Waitlist Policy</h1>
                        <p className="text-muted-foreground font-medium">
                            Last updated: June 13, 2026
                        </p>
                    </div>

                    <Section title="1. Wave Invitations">
                        <p>
                            Inbox FM is currently in a closed-beta wave invite system. Joining the waitlist reserves your place in line. We review and approve waitlist applications in batches based on processing capacity and invite codes.
                        </p>
                    </Section>

                    <Section title="2. Access Code Consumption">
                        <p>
                            Upon approval, an exclusive access code is emailed to the registered email address. Access codes are unique, single-use keys. Creating an account consumes the access code, linking it permanently to your credentials.
                        </p>
                    </Section>

                    <Section title="3. Waitlist Opt-Out and Deletion">
                        <p>
                            If you no longer wish to join or remain on the waitlist, you can opt out at any time. Opting out will mark your waitlist record as rejected and permanently unsubscribe you from launch notifications, updates, and reminders. You will forfeit your place in line.
                        </p>
                    </Section>

                    <Section title="4. Fair Queue System">
                        <p>
                            To prevent queue manipulation, we reserve the right to flag or remove duplicate, fake, or temporary email sign-ups. Any attempt to abuse the referral or waitlist queue will result in an immediate block of all associated emails.
                        </p>
                    </Section>

                    <Section title="5. Contact Waitlist Support">
                        <p>
                            For inquiries regarding your queue position or access code issues, reach out to us:
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
