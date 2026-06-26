"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, CheckCircle, ArrowRight } from "@phosphor-icons/react";
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

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-red-500 font-bold">
          Invalid or missing reset token.
        </p>
        <Link href="/forgot-password">
          <Button variant="outline">Request a new link</Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await api.auth.resetPassword(token!, password);
      setIsSuccess(true);
      toast.success("Password reset successful!");
    } catch (err) {
      toast.error("Reset failed", {
        description:
          err instanceof Error ? err.message : "Internal server error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-8 space-y-6">
        <div className="mx-auto w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
          <CheckCircle size={32} weight="fill" />
        </div>
        <div className="space-y-2">
          <p className="font-bold text-xl">Password Updated!</p>
          <p className="text-sm text-muted-foreground">
            Your password has been successfully reset. You can now sign in with
            your new password.
          </p>
        </div>
        <Button
          className="w-full h-14 rounded-2xl font-black text-lg gap-2 mt-4"
          onClick={() => router.push("/login")}
        >
          Sign In <ArrowRight size={20} weight="bold" />
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <div className="relative">
          <Lock
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={20}
          />
          <Input
            type="password"
            placeholder="New Password"
            className="h-14 pl-12 rounded-2xl border-muted bg-muted/20 focus:bg-card transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
      </div>
      <div className="space-y-2">
        <div className="relative">
          <Lock
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={20}
          />
          <Input
            type="password"
            placeholder="Confirm Password"
            className="h-14 pl-12 rounded-2xl border-muted bg-muted/20 focus:bg-card transition-all"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
      </div>
      <Button
        type="submit"
        className="w-full h-14 rounded-2xl font-black text-lg gap-2 mt-2 shadow-[0_10px_20px_rgba(var(--primary),0.2)]"
        disabled={isLoading}
      >
        {isLoading ? <Spinner size={20} /> : "Update Password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
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
              Set New Password
            </CardTitle>
            <CardDescription className="text-center">
              Please choose a strong password for your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="text-center py-8">
                  <Spinner size={32} className="mx-auto text-primary" />
                </div>
              }
            >
              <ResetPasswordForm />
            </Suspense>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
