"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { EnvelopeSimple, ArrowLeft, CheckCircle } from "@phosphor-icons/react";
import { Spinner } from "@/components/shared/Spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import api from "@/lib/api";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.auth.forgotPassword(email);
      setIsSubmitted(true);
      toast.success("Reset link sent!");
    } catch (err) {
      toast.error("Failed to send reset link", {
        description:
          err instanceof Error ? err.message : "Internal server error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-block text-2xl font-black mb-4 group"
          >
            INBOX
            <span className="italic opacity-80 group-hover:opacity-100 transition-opacity">
              FM
            </span>
          </Link>
        </div>

        <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-3xl overflow-hidden">
          <CardHeader className="space-y-2 pb-2">
            <CardTitle className="text-2xl font-black text-center">
              Forgot Password?
            </CardTitle>
            <CardDescription className="text-center">
              Enter your email and we&apos;ll send you a recovery link.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <EnvelopeSimple
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={20}
                    />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      className="h-14 pl-12 rounded-2xl border-muted bg-muted/20 focus:bg-card transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-14 rounded-2xl font-black text-lg gap-2 mt-2 shadow-[0_10px_20px_rgba(var(--primary),0.2)]"
                  disabled={isLoading}
                >
                  {isLoading ? <Spinner size={20} /> : "Send Reset Link"}
                </Button>
              </form>
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="mx-auto w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                  <CheckCircle size={32} weight="fill" />
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-lg">Check your inbox</p>
                  <p className="text-sm text-muted-foreground">
                    We sent a password reset link to <strong>{email}</strong>
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl mt-4"
                  onClick={() => setIsSubmitted(false)}
                >
                  Try another email
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center pb-8 pt-0">
            <Link
              href="/login"
              className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
