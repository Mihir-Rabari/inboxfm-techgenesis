"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GoogleLogo, Key } from "@phosphor-icons/react";
import { Spinner } from "@/components/shared/Spinner";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import api from "@/lib/api";

function GoogleCompleteContent() {
  const [accessCode, setAccessCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode) return;

    setIsLoading(true);
    try {
      const { token } = await api.auth.googleComplete(accessCode);
      api.setToken(token);
      await refreshUser();
      toast.success("Welcome to Inbox FM!");
      router.push("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Please check your code and try again.";
      toast.error("Access denied", { description: message });
      if (
        message.toLowerCase().includes("expired") ||
        message.toLowerCase().includes("session")
      ) {
        // Session expired — send them back to try Google sign-in again
        setTimeout(() => router.push("/login"), 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-sm overflow-hidden">
          <CardHeader className="text-center space-y-3 pt-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <GoogleLogo size={22} weight="bold" className="text-blue-600" />
              </div>
              <div className="text-muted-foreground text-xl font-black">+</div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Key size={22} weight="bold" className="text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black">One last step</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Google verified your identity. Enter your invitation access code
              to complete your Inbox FM account.
            </CardDescription>
            {email && (
              <div className="inline-flex items-center gap-2 bg-muted/60 rounded-full px-4 py-1.5 text-sm text-muted-foreground mx-auto">
                <GoogleLogo size={14} className="text-blue-500" />
                <span className="font-medium">{email}</span>
              </div>
            )}
          </CardHeader>

          <CardContent className="pt-4 pb-2">
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Access code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="IFM-XXXXXXXX"
                  className="h-12 font-mono tracking-widest text-center text-lg"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  required
                  autoFocus
                />
                <p className="text-[10px] text-muted-foreground text-center">
                  Check your inbox for an invitation email.{" "}
                  <Link
                    href="/waitlist"
                    className="text-primary hover:underline"
                  >
                    Don&apos;t have one? Join the waitlist.
                  </Link>
                </p>
              </div>

              <Button
                type="submit"
                className="h-12 w-full font-bold text-base mt-2"
                disabled={isLoading || !accessCode}
              >
                {isLoading ? (
                  <>
                    <Spinner size={18} className="mr-2" />
                    Verifying...
                  </>
                ) : (
                  "Complete Sign Up"
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 items-center justify-center text-sm text-muted-foreground border-t pt-5 pb-5 bg-muted/10">
            <p>
              Wrong Google account?{" "}
              <Link
                href="/login"
                className="font-bold text-primary hover:underline"
              >
                Try again
              </Link>
            </p>
            <p className="text-xs">This session expires in 10 minutes.</p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

export default function GoogleCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size={48} className="text-primary" />
        </div>
      }
    >
      <GoogleCompleteContent />
    </Suspense>
  );
}
