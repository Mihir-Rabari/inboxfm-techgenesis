import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata = {
    title: "Privacy Policy | Inbox FM",
    description: "Read the Privacy Policy for Inbox FM — understand how we collect, use, and protect your data.",
};

export default function PrivacyPolicyPage() {
    return (
        <main className="min-h-screen bg-background spotlight-bg grain-bg selection:bg-brand-orange/30 selection:text-white overflow-hidden text-foreground">
            {/* Global Sticky Capsule Navbar */}
            <Navbar />

            <div className="relative max-w-4xl mx-auto px-6 pt-32 pb-24 z-10">
                <div className="bg-[#FAF6F0] dark:bg-[#161519] border-2 border-black dark:border-zinc-800 rounded-[var(--ds-radius-card)] p-8 md:p-12 space-y-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.06)]">
                    <div className="space-y-3">
                        <h1 className="text-4xl font-black tracking-tight">Privacy Policy</h1>
                        <p className="text-muted-foreground font-medium">
                            Last updated: May 6, 2025 &nbsp;·&nbsp; Your privacy is important to us.
                        </p>
                    </div>

                    <div className="p-5 bg-primary/5 border border-primary/10 rounded-2xl">
                        <p className="text-sm font-semibold text-primary/80 leading-relaxed">
                            <strong className="text-primary">TL;DR:</strong> We only read your Gmail to generate your audio briefing. We never sell your data. Your emails are never stored — only the generated summary is saved. You can delete everything at any time.
                        </p>
                    </div>

                    <Section title="1. Who We Are">
                        <p>
                            Inbox FM is an AI-powered email briefing service operated by <strong>Vedlabs</strong>. We are
                            accessible at <strong>inboxfm.me</strong>. For privacy inquiries, contact us at{" "}
                            <a href="mailto:contact@inboxfm.me" className="text-primary hover:underline font-semibold">
                                contact@inboxfm.me
                            </a>.
                        </p>
                    </Section>

                    <Section title="2. Information We Collect">
                        <p>We collect the following categories of information:</p>

                        <SubSection title="2a. Account Information">
                            <p>When you sign up, we collect your name, email address, and (if using Google Sign-In) your Google account profile picture and unique Google ID.</p>
                        </SubSection>

                        <SubSection title="2b. Gmail Access Tokens">
                            <p>
                                When you connect your Gmail account, we store OAuth access tokens and refresh tokens.
                                These tokens allow us to fetch your emails on your behalf to generate briefings. All tokens
                                are encrypted at rest using AES-256 encryption. We never store your Gmail password.
                            </p>
                        </SubSection>

                        <SubSection title="2c. Email Content (Transient)">
                            <p>
                                We temporarily access the content of your email messages to generate your daily briefing.
                                <strong> We do not store the raw content of your emails.</strong> The email text is processed
                                in-memory and discarded immediately after the brief is generated.
                            </p>
                        </SubSection>

                        <SubSection title="2d. Generated Briefs">
                            <p>
                                We store the AI-generated text summaries and audio files associated with your briefings.
                                These are linked to your account and are accessible only to you. Audio files are stored in
                                Amazon S3 (Asia Pacific — Mumbai region). You can delete individual briefs or all your data
                                at any time from your dashboard.
                            </p>
                        </SubSection>

                        <SubSection title="2e. Usage Data">
                            <p>
                                We collect basic usage data including login timestamps, last active date, and schedule
                                preferences. This helps us improve the service and detect abuse.
                            </p>
                        </SubSection>

                        <SubSection title="2f. Application Monitoring and Error Tracking">
                            <p>
                                To maintain the stability and reliability of Inbox FM, we use Sentry for error tracking and application monitoring.
                                When an error occurs or the application crashes, we collect telemetry data which may include your IP address, browser type,
                                operating system, and a stack trace of the error. This data is used solely to identify and fix technical issues.
                            </p>
                        </SubSection>
                    </Section>

                    <Section title="3. How We Use Your Information">
                        <p>We use the information we collect to:</p>
                        <ul className="list-disc ml-6 space-y-1 mt-2 text-muted-foreground font-medium">
                            <li>Authenticate you and provide access to your account.</li>
                            <li>Fetch your Gmail emails on your schedule to generate audio briefings.</li>
                            <li>Send you transactional emails (e.g., password resets, release notes).</li>
                            <li>Improve the quality and reliability of our service.</li>
                            <li>Detect, prevent, and respond to fraud or abuse.</li>
                        </ul>
                        <p className="mt-3">
                            <strong>We do not sell your data.</strong> We do not use your email content for advertising,
                            training AI models, or any purpose other than generating your personal briefing.
                        </p>
                    </Section>

                    <Section title="4. Google API Data Disclosure">
                        <p>
                            Inbox FM uses the Gmail API to read your email messages. Our use of data obtained through
                            Google APIs is governed by the{" "}
                            <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                                Google API Services User Data Policy
                            </a>
                            , including the Limited Use requirements. Specifically:
                        </p>
                        <ul className="list-disc ml-6 space-y-1 mt-2 text-muted-foreground font-medium">
                            <li>We only request the <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">gmail.readonly</code> scope — we cannot send emails, delete emails, or modify your inbox.</li>
                            <li>Data from Google APIs is not used to develop, improve, or train generalized AI/ML models.</li>
                            <li>We do not share your Gmail data with any third party except the advanced AI models used to generate your briefing.</li>
                            <li>You can revoke our Gmail access at any time from your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Google account settings</a>.</li>
                        </ul>
                    </Section>

                    <Section title="5. Third-Party Services">
                        <p>We use the following third-party services to operate Inbox FM:</p>
                        <div className="mt-3 overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-muted">
                                        <th className="text-left py-2 pr-4 font-black text-xs uppercase tracking-wider text-muted-foreground">Service</th>
                                        <th className="text-left py-2 pr-4 font-black text-xs uppercase tracking-wider text-muted-foreground">Purpose</th>
                                        <th className="text-left py-2 font-black text-xs uppercase tracking-wider text-muted-foreground">Data Shared</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-muted/50">
                                    <tr>
                                        <td className="py-3 pr-4 font-semibold">AI Infrastructure</td>
                                        <td className="py-3 pr-4 text-muted-foreground">Audio summary generation</td>
                                        <td className="py-3 text-muted-foreground">Email content (transient)</td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 pr-4 font-semibold">Secure Storage</td>
                                        <td className="py-3 pr-4 text-muted-foreground">Audio file storage</td>
                                        <td className="py-3 text-muted-foreground">Generated audio files</td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 pr-4 font-semibold">Resend</td>
                                        <td className="py-3 pr-4 text-muted-foreground">Transactional email delivery</td>
                                        <td className="py-3 text-muted-foreground">Your email address</td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 pr-4 font-semibold">Cloud Infrastructure</td>
                                        <td className="py-3 pr-4 text-muted-foreground">Server infrastructure & database</td>
                                        <td className="py-3 text-muted-foreground">All account data (secured)</td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 pr-4 font-semibold">Sentry</td>
                                        <td className="py-3 pr-4 text-muted-foreground">Application monitoring and error tracking</td>
                                        <td className="py-3 text-muted-foreground">IP address, browser data, error stack traces</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </Section>

                    <Section title="6. Data Retention">
                        <p>
                            We retain your account data for as long as your account is active. Generated briefs are retained
                            until you delete them or until your account is deleted. Encrypted OAuth tokens are deleted
                            immediately when you disconnect your Gmail account. Upon account deletion, all your personal
                            data is permanently removed within 30 days.
                        </p>
                    </Section>

                    <Section title="7. Your Rights">
                        <p>Depending on your location, you may have the right to:</p>
                        <ul className="list-disc ml-6 space-y-1 mt-2 text-muted-foreground font-medium">
                            <li><strong>Access</strong> the personal data we hold about you.</li>
                            <li><strong>Correct</strong> inaccurate personal data.</li>
                            <li><strong>Delete</strong> your account and all associated data.</li>
                            <li><strong>Withdraw consent</strong> for Gmail access at any time.</li>
                            <li><strong>Data portability</strong> — request a copy of your generated briefs.</li>
                        </ul>
                        <p className="mt-3">
                            To exercise any of these rights, please email us at{" "}
                            <a href="mailto:contact@inboxfm.me" className="text-primary hover:underline font-semibold">
                                contact@inboxfm.me
                            </a>
                            . We will respond within 30 days.
                        </p>
                    </Section>

                    <Section title="8. Security">
                        <p>
                            We take security seriously. We implement the following measures to protect your data:
                        </p>
                        <ul className="list-disc ml-6 space-y-1 mt-2 text-muted-foreground font-medium">
                            <li>All OAuth tokens are encrypted at rest using AES-256.</li>
                            <li>All data in transit is protected by HTTPS/TLS.</li>
                            <li>Our database is hosted on a private AWS network, not publicly accessible.</li>
                            <li>Passwords are hashed using bcrypt with a cost factor of 12.</li>
                            <li>JWT authentication tokens have a 30-day expiry.</li>
                        </ul>
                        <p className="mt-3">
                            However, no system is 100% secure. If you discover a security vulnerability, please disclose
                            it responsibly to us at{" "}
                            <a href="mailto:contact@inboxfm.me" className="text-primary hover:underline font-semibold">
                                contact@inboxfm.me
                            </a>.
                        </p>
                    </Section>

                    <Section title="9. Children's Privacy">
                        <p>
                            Inbox FM is not directed at children under the age of 13. We do not knowingly collect personal
                            data from children. If we become aware that a child under 13 has provided us with personal data,
                            we will delete that information promptly.
                        </p>
                    </Section>

                    <Section title="10. Changes to This Policy">
                        <p>
                            We may update this Privacy Policy from time to time. If we make material changes, we will notify
                            you via email or a prominent notice within the service at least 7 days before the changes take
                            effect. Your continued use of the service after the effective date constitutes acceptance of the
                            updated policy.
                        </p>
                    </Section>

                    <Section title="11. Contact Us">
                        <p>
                            If you have any questions, concerns, or requests regarding this Privacy Policy, please contact us:
                        </p>
                        <div className="mt-3 p-4 bg-muted/30 rounded-2xl font-medium text-sm space-y-1">
                            <p><strong>Inbox FM (Vedlabs)</strong></p>
                            <p>Email: <a href="mailto:contact@inboxfm.me" className="text-primary hover:underline">contact@inboxfm.me</a></p>
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

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5 mt-3">
            <h3 className="text-sm font-black text-foreground/80">{title}</h3>
            <div className="text-muted-foreground font-medium leading-relaxed">{children}</div>
        </div>
    );
}
