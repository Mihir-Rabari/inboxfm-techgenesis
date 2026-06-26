"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/shared/Spinner";
import api from "@/lib/api";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      let token = searchParams.get("token");

      if (!token) {
        try {
          const response = await api.auth.exchangeToken();
          token = response.token;
        } catch (error) {
          console.error("Auth callback error:", error);
        }
      }

      if (token) {
        api.setToken(token);
        try {
          // Attempt to fetch user (works with token or cookie)
          const user = await refreshUser();

          if (user) {
            // Use replace to prevent back-navigation to the token URL
            router.replace("/dashboard");
          } else {
            router.replace("/login?error=auth_failed");
          }
        } catch (error) {
          console.error("Failed to refresh user:", error);
          router.replace("/login?error=auth_failed");
        }
      } else {
        router.replace("/login?error=auth_failed");
      }
    };

    handleCallback();
  }, [searchParams, router, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto mb-4">
          <Spinner size={48} className="text-primary" />
        </div>
        <p className="text-muted-foreground font-medium">
          Completing authentication...
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="mx-auto mb-4">
              <Spinner size={48} className="text-primary" />
            </div>
            <p className="text-muted-foreground font-medium">Loading...</p>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
