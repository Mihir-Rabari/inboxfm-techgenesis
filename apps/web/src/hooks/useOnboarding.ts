"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api, { Integration } from "@/lib/api";

export function useOnboarding() {
  const { user, refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchIntegrations = useCallback(async () => {
    try {
      const data = await api.integrations.getAll();
      setIntegrations(data);
    } catch (err) {
      console.error("Failed to load integrations in onboarding", err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setCurrentStep(user.onboardingStep ?? 0);
      void fetchIntegrations();
      setIsLoading(false);
    }
  }, [user, fetchIntegrations]);

  const updateOnboardingStep = async (step: number) => {
    try {
      setCurrentStep(step);
      await api.users.updatePreferences({ onboardingStep: step });
      await refreshUser();
    } catch (err) {
      console.error("Failed to update onboarding step", err);
    }
  };

  const completeOnboarding = async () => {
    try {
      await api.users.updatePreferences({ onboardingComplete: true });
      await refreshUser();
    } catch (err) {
      console.error("Failed to complete onboarding", err);
    }
  };

  const isEmailConnected = integrations.some(
    (i) => (i.provider === "GMAIL" || i.provider === "OUTLOOK") && i.status === "CONNECTED"
  );

  const isCalendarConnected = integrations.some(
    (i) => i.provider === "GOOGLE_CALENDAR" && i.status === "CONNECTED"
  );

  return {
    user,
    currentStep,
    setCurrentStep: updateOnboardingStep,
    completeOnboarding,
    isEmailConnected,
    isCalendarConnected,
    integrations,
    refreshIntegrations: fetchIntegrations,
    isLoading,
  };
}
