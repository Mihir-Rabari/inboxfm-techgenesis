"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "@phosphor-icons/react";
import Link from "next/link";

export const CookieConsent = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem("cookie-consent");
        if (!consent) {
            const timer = setTimeout(() => setIsVisible(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const acceptCookies = () => {
        localStorage.setItem("cookie-consent", "true");
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-[100]"
            >
                <div className="bg-white dark:bg-zinc-900 border shadow-2xl rounded-[2rem] p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
                    
                    <div className="flex items-start justify-between">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                            <Cookie size={28} weight="fill" />
                        </div>
                        <button 
                            onClick={() => setIsVisible(false)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X size={20} weight="bold" />
                        </button>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-black tracking-tight">We use cookies</h3>
                        <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                            We use cookies to enhance your experience and analyze our traffic. By clicking &ldquo;Accept&rdquo;, you consent to our use of cookies. Read our{" "}
                            <Link href="/cookies" className="text-primary hover:underline font-bold">
                                Cookie Policy
                            </Link>
                            .
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={acceptCookies}
                            className="flex-1 bg-primary text-black font-black py-3 rounded-2xl hover:scale-[1.02] transition-all active:scale-95 text-sm uppercase tracking-widest"
                        >
                            Accept All
                        </button>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="px-6 py-3 bg-secondary border font-bold rounded-2xl hover:bg-muted transition-all text-sm uppercase tracking-widest"
                        >
                            Decline
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
