"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api";

export function NotificationOptIn() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    const checkNotificationSupport = async () => {
      const supported =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      setIsSupported(supported);

      if (!supported) return;

      setPermission(Notification.permission);

      // Check if already subscribed
      if ("serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            setIsSubscribed(true);
          }
        } catch (error) {
          console.error("Error checking subscription:", error);
        }
      }
    };

    checkNotificationSupport();
  }, []);

  const handleSubscribe = async () => {
    if (!isSupported) {
      toast.error("Push notifications are not supported on this device");
      return;
    }

    setIsLoading(true);
    try {
      // Request permission
      if (Notification.permission === "default") {
        const result = await Notification.requestPermission();
        setPermission(result);

        if (result !== "granted") {
          toast.error("Notification permission denied");
          setIsLoading(false);
          return;
        }
      } else if (Notification.permission !== "granted") {
        toast.error("Notification permission not granted");
        setIsLoading(false);
        return;
      }

      // Get service worker and subscribe
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      // Send subscription to backend
      await api.notifications.subscribe(subscription.toJSON() as Record<string, unknown>);

      setIsSubscribed(true);
      toast.success("Notifications enabled successfully!");
    } catch (error) {
      console.error("Subscription error:", error);
      const message = error instanceof Error ? error.message : "Failed to enable notifications";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await api.notifications.unsubscribe(subscription.endpoint);

        await subscription.unsubscribe();
        setIsSubscribed(false);
        toast.success("Notifications disabled");
      }
    } catch (error) {
      console.error("Unsubscribe error:", error);
      toast.error("Failed to disable notifications");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  if (isSubscribed) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-sm">
          <Bell size={16} className="fill-current" />
          <span>Notifications enabled</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleUnsubscribe}
          disabled={isLoading}
          className="text-xs"
        >
          {isLoading ? "..." : "Disable"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm">
        <BellOff size={16} />
        <span>Notifications disabled</span>
      </div>
      <Button
        size="sm"
        onClick={handleSubscribe}
        disabled={isLoading}
        className="bg-amber-500 hover:bg-amber-600"
      >
        {isLoading ? "..." : "Enable"}
      </Button>
    </div>
  );
}
