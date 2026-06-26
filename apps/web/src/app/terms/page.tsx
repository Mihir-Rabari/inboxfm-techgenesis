import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata = {
    title: "Terms of Service | Inbox FM",
    description: "Read the Terms of Service for Inbox FM — the AI-powered email briefing service.",
};

export default function TermsOfServicePage() {
    return (
        <main className="min-h-screen bg-background spotlight-bg grain-bg selection:bg-brand-orange/30 selection:text-white overflow-hidden text-foreground">
            {/* Global Sticky Capsule Navbar */}
            <Navbar />

            <div className="relative max-w-4xl mx-auto px-6 pt-32 pb-24 z-10">
                <div className="bg-[#FAF6F0] dark:bg-[#161519] border-2 border-black dark:border-zinc-800 rounded-[var(--ds-radius-card)] p-8 md:p-12 space-y-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.06)]">
                    <div className="space-y-3">
                        <h1 className="text-4xl font-black tracking-tight">Terms of Service</h1>
                        <p className="text-muted-foreground font-medium">
                            Last updated: May 6, 2025 &nbsp;·&nbsp; Effective immediately upon account creation.
                        </p>
                    </div>

                    <Section title="1. Introduction">
                        <p>
                            Welcome to <strong>Inbox FM</strong> &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;. By creating an account and using
                            our service at <strong>inboxfm.me</strong>, you agree to be bound by these Terms of Service
                            (&ldquo;Terms&rdquo;). Please read them carefully. If you do not agree with these Terms, do not use our service.
                        </p>
                    </Section>

                    <Section title="2. Description of Service">
                        <p>
                            Inbox FM is an AI-powered email briefing service. When you connect your Gmail account, we
                            read your inbox emails on your behalf, process them using advanced artificial intelligence,
                            and generate a personalized audio and text summary &mdash; your &ldquo;daily brief.&rdquo; You may schedule briefs
                            to be delivered at specific times according to your preferences.
                        </p>
                    </Section>

                    <Section title="3. Eligibility">
                        <p>
                            You must be at least 13 years old to use Inbox FM. By using the service, you represent that you
                            are of legal age to form a binding contract and are not barred from receiving services under the
                            laws of any jurisdiction. If you are using the service on behalf of an organization, you represent
                            that you have the authority to bind that organization to these Terms.
                        </p>
                    </Section>

                    <Section title="4. Account Registration">
                        <p>
                            You may register using your email address and a password, or via Google OAuth (&ldquo;Continue with
                            Google&rdquo;). You are responsible for maintaining the confidentiality of your login credentials and
                            for all activity that occurs under your account. Notify us immediately at{" "}
                            <a href="mailto:support@inboxfm.me" className="text-primary hover:underline font-semibold">
                                support@inboxfm.me
                            </a>{" "}
                            if you suspect unauthorized use of your account.
                        </p>
                    </Section>

                    <Section title="5. Gmail Access and Permissions">
                        <p>
                            To generate your daily briefings, Inbox FM requires read-only access to your Gmail inbox via
                            Google OAuth. Specifically, we request the following Google API scope:
                        </p>
                        <ul className="list-disc ml-6 space-y-1 mt-2 text-muted-foreground font-medium">
                            <li><code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">https://www.googleapis.com/auth/gmail.readonly</code> — Read-only access to your Gmail messages and metadata.</li>
                        </ul>
                        <p className="mt-3">
                            We do not store the raw content of your emails. We only process email text temporarily to
                            generate your brief. Your OAuth tokens (used to fetch emails) are encrypted at rest using
                            AES-256 encryption. You may revoke our access at any time from your{" "}
                            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                                Google account permissions page
                            </a>{" "}
                            or from your Inbox FM profile settings.
                        </p>
                        <p className="mt-3">
                            Inbox FM&apos;s use and transfer of information received from Google APIs adheres to the{" "}
                            <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                                Google API Services User Data Policy
                            </a>
                            , including the Limited Use requirements.
                        </p>
                    </Section>

                    <Section title="6. AI Processing">
                        <p>
                            Your email content is processed by advanced large language models solely for the purpose
                            of generating your personalized briefing. We do not use your email content to train any AI
                            models. Generated audio summaries are stored securely and associated
                            with your account. You may delete your briefs at any time from your dashboard.
                        </p>
                    </Section>

                    <Section title="7. Acceptable Use">
                        <p>You agree not to:</p>
                        <ul className="list-disc ml-6 space-y-1 mt-2 text-muted-foreground font-medium">
                            <li>Use the service for any illegal or unauthorized purpose.</li>
                            <li>Attempt to reverse-engineer, decompile, or disassemble any part of the service.</li>
                            <li>Use automated bots or scripts to abuse the service beyond its intended use.</li>
                            <li>Share, sell, or transfer your account to another party.</li>
                            <li>Attempt to access another user&apos;s account or data.</li>
                        </ul>
                    </Section>

                    <Section title="8. Application Monitoring">
                        <p>
                            To ensure the stability, security, and performance of Inbox FM, we employ application monitoring tools,
                            including Sentry, to track errors, crashes, and system performance. By using the service, you acknowledge
                            and agree that we may collect diagnostic and telemetry data&mdash;such as IP addresses, device information,
                            and error stack traces&mdash;for the sole purpose of identifying and resolving technical issues.
                        </p>
                    </Section>

                    <Section title="9. Termination">
                        <p>
                            We reserve the right to suspend or terminate your account at our sole discretion if you violate
                            these Terms or if we reasonably believe your account is being used fraudulently. You may delete
                            your account at any time from your Account Settings page. Upon deletion, your personal data will
                            be removed within 30 days, except where we are required to retain it by law.
                        </p>
                    </Section>

                    <Section title="10. Disclaimer of Warranties">
                        <p>
                            Inbox FM is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, either express
                            or implied. We do not guarantee that the service will be uninterrupted, error-free, or that the
                            AI-generated summaries will be 100% accurate. The service is intended to assist you in staying
                            informed &mdash; always verify critical information directly from your email.
                        </p>
                    </Section>

                    <Section title="11. Limitation of Liability">
                        <p>
                            To the maximum extent permitted by applicable law, Inbox FM and its operators shall not be liable
                            for any indirect, incidental, special, consequential, or punitive damages arising out of your use
                            of or inability to use the service, even if we have been advised of the possibility of such damages.
                        </p>
                    </Section>

                    <Section title="12. Changes to These Terms">
                        <p>
                            We may update these Terms from time to time. If we make material changes, we will notify you
                            by email or through the service at least 7 days before the changes take effect. Your continued
                            use of the service after the effective date constitutes acceptance of the updated Terms.
                        </p>
                    </Section>

                    <Section title="13. Governing Law">
                        <p>
                            These Terms are governed by and construed in accordance with the laws of India, without regard
                            to its conflict of law provisions. Any disputes arising under these Terms shall be subject to
                            the exclusive jurisdiction of the courts located in India.
                        </p>
                    </Section>

                    <Section title="14. Contact Us">
                        <p>
                            If you have any questions about these Terms, please contact us at:
                        </p>
                        <div className="mt-3 p-4 bg-muted/30 rounded-2xl font-medium text-sm space-y-1">
                            <p><strong>Inbox FM (VedLabs)</strong></p>
                            <p>Email: <a href="mailto:support@inboxfm.me" className="text-primary hover:underline">support@inboxfm.me</a></p>
                            <p>Website: <a href="https://inboxfm.me" className="text-primary hover:underline">inboxfm.me</a></p>
                        </div>
                    </Section>
                </div>
            </div>

            {/* Shared Footer */}
            <Footer />
        </main>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-3">
            <h2 className="text-lg font-black tracking-tight text-foreground">{title}</h2>
            <div className="text-muted-foreground font-medium leading-relaxed space-y-3">
                {children}
            </div>
        </section>
    );
}
