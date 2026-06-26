"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
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
import { Spinner } from "@/components/shared/Spinner";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for error from OAuth callback
    const error = searchParams.get("error");
    if (error) {
      toast.error("Authentication failed", {
        description: "Please try again or use email/password.",
      });
    }
  }, [searchParams]);

  useEffect(() => {
    // Redirect if already authenticated
    if (!authLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
    } catch (err) {
      toast.error("Login failed", {
        description: err instanceof Error ? err.message : "Invalid credentials",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size={40} className="text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center spotlight-bg grain-bg px-4 py-12 relative overflow-hidden">
      {/* Spotlight accent */}
      <div className="absolute top-0 right-1/4 w-[350px] h-[350px] bg-brand-orange/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex justify-center mb-8">
          <Link href="/" className="transition-transform duration-300 hover:scale-105 active:scale-95">
            <Logo />
          </Link>
        </div>

        <Card className="border border-border/20 shadow-[var(--ds-shadow-card)] bg-card/65 backdrop-blur-md rounded-[var(--ds-radius-card)] overflow-hidden transition-spring-normal hover:shadow-[var(--ds-shadow-hover)]">
          <CardHeader className="space-y-2 text-center pt-8">
            <CardTitle className="text-3xl font-black tracking-tight text-foreground">Welcome back</CardTitle>
            <CardDescription className="text-sm font-medium text-muted-foreground max-w-xs mx-auto">
              Synthesize your daily Gmail feeds into a calm personal audio broadcast
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 px-8 pt-4 pb-6">
            <form onSubmit={handleSubmit} className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="font-bold rounded-[var(--ds-radius-inner)]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-black text-brand-orange hover:underline uppercase tracking-wide mr-1"
                  >
                    Forgot?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="font-bold rounded-[var(--ds-radius-inner)]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                size="brand"
                className="w-full mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner size={16} className="mr-2" />
                    Connecting...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground font-medium border-t border-border/10 py-5 bg-muted/5">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-black text-brand-orange hover:underline uppercase tracking-wide"
            >
              Sign up for free
            </Link>
          </CardFooter>
        </Card>

        <p className="mt-8 text-center text-[10px] text-muted-foreground/60 leading-relaxed max-w-xs mx-auto">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Spinner size={40} className="text-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
