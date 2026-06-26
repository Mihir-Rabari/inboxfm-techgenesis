import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata = {
    title: "Cookie Policy | Inbox FM",
    description: "Cookie Policy for Inbox FM — how we use cookies to improve your experience.",
};

export default function CookiePolicyPage() {
    return (
        <main className="min-h-screen bg-background spotlight-bg grain-bg selection:bg-brand-orange/30 selection:text-white overflow-hidden text-foreground">
            {/* Global Sticky Capsule Navbar */}
            <Navbar />

            <div className="relative max-w-4xl mx-auto px-6 pt-32 pb-24 z-10">
                <div className="bg-[#FAF6F0] dark:bg-[#161519] border-2 border-black dark:border-zinc-800 rounded-[var(--ds-radius-card)] p-8 md:p-12 space-y-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.06)]">
                    <div className="space-y-3">
                        <h1 className="text-4xl font-black tracking-tight">Cookie Policy</h1>
                        <p className="text-muted-foreground font-medium">
                            Last updated: May 7, 2024
                        </p>
                    </div>

                    <Section title="1. What Are Cookies">
                        <p>
                            Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the owners of the site.
                        </p>
                    </Section>

                    <Section title="2. How We Use Cookies">
                        <p>
                            We use cookies for several reasons:
                        </p>
                        <ul className="list-disc ml-6 mt-4 space-y-2">
                            <li><strong>Essential Cookies:</strong> These are necessary for the website to function properly, such as for authentication and security.</li>
                            <li><strong>Preference Cookies:</strong> These allow us to remember your settings and preferences, such as your theme choice or language.</li>
                            <li><strong>Analytics Cookies:</strong> These help us understand how visitors interact with our website by collecting and reporting information anonymously.</li>
                        </ul>
                    </Section>

                    <Section title="3. Managing Cookies">
                        <p>
                            Most web browsers allow you to control cookies through their settings. You can choose to block or delete cookies, but this may affect your ability to use certain features of our website.
                        </p>
                    </Section>

                    <Section title="4. Changes to This Policy">
                        <p>
                            We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons.
                        </p>
                    </Section>

                    <Section title="5. Contact Us">
                        <p>
                            If you have any questions about our use of cookies, please contact us at:
                        </p>
                        <div className="mt-3 p-4 bg-muted/30 rounded-2xl font-medium text-sm">
                            Email: <a href="mailto:contact@inboxfm.me" className="text-primary hover:underline">contact@inboxfm.me</a>
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
            <div className="text-muted-foreground font-medium leading-relaxed">
                {children}
            </div>
        </section>
    );
}
