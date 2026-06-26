export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
export const SERVER_URL = API_BASE_URL?.replace(/\/api\/?$/, "") || "";
export function getApiBaseUrl(): string {
  return API_BASE_URL || "";
}
// Types
export interface User {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  gmailConnected: boolean;
  timezone: string;
  isActive: boolean;
  isAdmin?: boolean;
  onboardingComplete: boolean;
  onboardingStep: number;
  createdAt: string;
  lastActiveAt?: string;
}

export interface ActionItem {
  id: string;
  userId: string;
  briefId: string | null;
  type: "MEETING" | "TASK" | "REPLY" | "FOLLOW_UP" | "REVIEW" | "APPROVAL";
  title: string;
  description: string | null;
  priority: number;
  status: "PENDING" | "APPROVED" | "IGNORED" | "COMPLETED" | "EDITED" | "SNOOZED";
  sourceType: string | null;
  sourceId: string | null;
  sourceSubject: string | null;
  sourceSender: string | null;
  sourceUrl: string | null;
  sourcePreview: string | null;
  startsAt: string | null;
  endsAt: string | null;
  allDay: boolean;
  participants: string[];
  location: string | null;
  includeMeet: boolean;
  replyIndicator: boolean;
  suggestedReply: string | null;
  editedContent: string | null;
  sentMailId: string | null;
  sentAt: string | null;
  googleEventId: string | null;
  googleEventUrl: string | null;
  meetLink: string | null;
  links: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BriefAction {
  id: string;
  sourceId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  googleEventId?: string | null;
  googleEventUrl?: string | null;
  meetLink?: string | null;
  errorMessage?: string | null;
  completedAt?: string | null;
  updatedAt?: string;
}

export interface BriefActionHistoryEntry {
  id: string;
  sourceId: string;
  title: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export interface ScriptSegment {
  type: string;
  text: string;
  emphasis?: string | boolean;
}

export interface Brief {
  id: string;
  userId: string;
  date: string;
  textSummary: string;
  audioUrl: string | null;
  audioDuration: number | null;
  emailsProcessed: number;
  status:
    | "PENDING"
    | "FETCHING"
    | "PROCESSING"
    | "GENERATING_AUDIO"
    | "DELIVERING"
    | "DELIVERED"
    | "FAILED";
  errorMessage?: string | null;
  processingTime?: number | null;
  actions?: BriefAction[];
  scriptJson?: ScriptSegment[];
  summarySchedule?: {
    name: string;
    deliveryTime: string;
    timezone: string;
    voicePersona: string;
    customPrompt?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  userId: string;
  name: string;
  deliveryTime: string;
  timezone: string;
  isActive: boolean;
  voicePersona: string;
  emailsFrom: string;
  customPrompt?: string | null;
  styleId?: string | null;
  style?: BriefingStyle | null;
  includeGmail: boolean;
  includeOutlook: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Lightweight shape kept for backward compat — prefer AdminAnalytics for admin pages. */
export interface Analytics {
  totalUsers: number;
  activeUsers: number;
  totalBriefs: number;
  processingQueue: number;
}

export interface AdminAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisWeek: number;
  totalBriefs: number;
  briefsToday: number;
  averageDuration: number;
  processingQueue: number;
  queue: { active: number; waiting: number; completed: number; failed: number };
  totalEmailsProcessed: number;
  totalSummaries: number;
  totalPushSubscriptions: number;
  activeGmailUsers: number;
  scheduleHeatmap: Record<number, number>;
  userGrowth: Record<string, number>;
  pushSubscriptionGrowth: Record<string, number>;
}

export interface SupportTicket {
  id: string;
  userId: string | null;
  email: string;
  subject: string;
  message: string;
  category: "BUG" | "FEATURE" | "BILLING" | "ACCOUNT" | "OTHER";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface FeedbackEntry {
  id: string;
  userId: string | null;
  email: string;
  rating: number;
  message: string;
  page: string | null;
  createdAt: string;
}

export interface FeedbackStats {
  total: number;
  averageRating: number;
  distribution: Record<number, number>;
}

export interface ReleaseChange {
  category: "FEATURE" | "IMPROVEMENT" | "FIX" | "SECURITY";
  description: string;
}

export interface Release {
  id: string;
  version: string;
  title: string;
  slug: string;
  description: string | null;
  content: string;
  changes: ReleaseChange[];
  isPublished: boolean;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SenderPriority = "CRITICAL" | "HIGH" | "NORMAL" | "LOW" | "IGNORE";

export interface SenderPreference {
  id: string;
  userId: string;
  senderEmail: string;
  senderName: string | null;
  priority: SenderPriority;
  alwaysInclude: boolean;
  neverInclude: boolean;
  interactionCount: number;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
  emailVolume: string | null;
  biggestPain: string | null;
  whyInboxfm: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "WAITLISTED";
  accessCode: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type IntegrationStatus = "CONNECTED" | "DISCONNECTED" | "ERROR" | "PENDING";
export type IntegrationCategory = "email" | "productivity" | "communication" | "content";

export interface Integration {
  provider: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  authType: "oauth2" | "api_key" | "config" | "none";
  isAvailable: boolean;
  id: string | null;
  status: IntegrationStatus;
  connectedAt: string | null;
  metadata: Record<string, unknown>;
}

export interface StyleProfile {
  content: string;
}

export interface BriefingStyle {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  prompt: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Client Class
class ApiClient {
  private token: string | null = null;

  private get baseUrl(): string {
    if (!API_BASE_URL) {
      throw new Error(
        "NEXT_PUBLIC_API_URL environment variable is not defined",
      );
    }
    return API_BASE_URL;
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("token", token);
        sessionStorage.setItem("token", token);
      } else {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
      }
    }
  }

  getToken(): string | null {
    if (typeof window !== "undefined") {
      // Prefer sessionStorage (current tab), fall back to localStorage (cross-tab persistence)
      return sessionStorage.getItem("token") ?? localStorage.getItem("token");
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & { timeoutMs?: number } = {},
    retries = 0,
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    const { timeoutMs = 10000, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...fetchOptions,
        headers,
        credentials: "include",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: `HTTP ${response.status}` }));
        // Only retry on 5xx server errors, never on 4xx client errors
        if (response.status >= 500 && retries > 0) {
          const backoffMs = 500 * (3 - retries); // 500ms, 1000ms
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          return this.request<T>(endpoint, options, retries - 1);
        }
        // Mark as an API error so the catch block doesn't retry it
        const apiError = new Error(
          (error as Error).message || `HTTP ${response.status}`,
        ) as Error & { isApiError: boolean; status?: number };
        apiError.isApiError = true;
        apiError.status = response.status;
        throw apiError;
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timed out");
      }
      // Don't retry API errors (already handled above) — only retry genuine network errors
      if ((error as Error & { isApiError?: boolean }).isApiError) {
        throw error;
      }
      if (retries > 0) {
        const backoffMs = 500 * (3 - retries);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        return this.request<T>(endpoint, options, retries - 1);
      }
      throw error;
    }
  }

  // Auth endpoints
  // Waitlist (public)
  waitlist = {
    join: (data: {
      email: string;
      name?: string;
      role?: string;
      emailVolume?: string;
      biggestPain?: string;
      whyInboxfm?: string;
      notes?: string;
    }) =>
      this.request<{ success: boolean; id: string; message: string }>(
        "/waitlist/join",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      ),
    signupCheck: (data: { email: string; name?: string }) =>
      this.request<{
        status: "REGISTERED" | "APPROVED" | "WAITLISTED" | "NEW_WAITLISTED";
        message: string;
      }>("/waitlist/signup-check", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  };

  auth = {
    login: (email: string, password: string) =>
      this.request<{ user: User; token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),

    signup: (data: {
      email: string;
      password: string;
      name?: string;
      accessCode?: string;
    }) =>
      this.request<{ user: User; token: string }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    getMe: () => this.request<User>("/auth/me"),

    generateGoogleAuthTicket: () =>
      this.request<{ ticket: string }>("/auth/google/init", { method: "POST" }),

    googleAuthUrl: (ticket?: string) =>
      `${this.baseUrl}/auth/google${ticket ? `?ticket=${encodeURIComponent(ticket)}` : ""}`,

    disconnectGmail: () =>
      this.request<{ success: boolean; gmailConnected: boolean }>(
        "/auth/disconnect-gmail",
        {
          method: "POST",
        },
      ),

    forgotPassword: (email: string) =>
      this.request<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),

    resetPassword: (token: string, password: string) =>
      this.request<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      }),

    exchangeToken: () =>
      this.request<{ token: string }>("/auth/token-exchange", {
        method: "POST",
        credentials: "include",
      }),

    googleComplete: (accessCode: string) =>
      this.request<{ user: User; token: string }>("/auth/google/complete", {
        method: "POST",
        body: JSON.stringify({ accessCode }),
        credentials: "include",
      }),

    unsubscribe: (token: string) =>
      this.request<{ success: boolean; message: string }>("/auth/unsubscribe", {
        method: "POST",
        body: JSON.stringify({ token }),
      }),

    verifyUnsubscribeToken: (token: string) =>
      this.request<{
        success: boolean;
        type: "waitlist" | "registered";
        email: string;
        preferences?: {
          subscribePromo: boolean;
          subscribeDailyBrief: boolean;
          subscribeAlerts: boolean;
        };
      }>(`/auth/unsubscribe/verify?token=${encodeURIComponent(token)}`),

    updateEmailPreferences: (
      token: string,
      preferences: {
        subscribePromo?: boolean;
        subscribeDailyBrief?: boolean;
        subscribeAlerts?: boolean;
        optOutWaitlist?: boolean;
      }
    ) =>
      this.request<{ success: boolean; message: string }>("/auth/unsubscribe/preferences", {
        method: "POST",
        body: JSON.stringify({ token, preferences }),
      }),
  };

  // Briefs endpoints
  briefs = {
    getAll: () => this.request<Brief[]>("/briefs"),

    getById: (id: string) => this.request<Brief>(`/briefs/${id}`),

    getStats: () =>
      this.request<{
        totalBriefs: number;
        deliveredBriefs: number;
        successRate: number;
        totalEmails: number;
        estimatedMinutesSaved: number;
        averageAudioDurationSec: number;
        emailsByDay: Record<string, number>;
        categoryTotals: Record<string, number>;
      }>("/briefs/stats"),

    getActionHistory: (id: string) =>
      this.request<{
        success: boolean;
        history: BriefActionHistoryEntry[];
      }>(`/briefs/${id}/actions-history`),

    generate: () =>
      this.request<{ briefId: string; message: string }>("/briefs/generate", {
        method: "POST",
      }),

    createCalendarEvent: (
      id: string,
      data: {
        sourceId?: string;
        type?: "event" | "reminder" | "meeting" | "task";
        title: string;
        details?: string;
        startsAt: string;
        endsAt?: string | null;
        allDay?: boolean;
        participants?: string[];
        includeMeet?: boolean;
        location?: string;
      },
    ) =>
      this.request<{
        success: boolean;
        event: {
          id?: string;
          htmlLink?: string | null;
          meetLink?: string | null;
        };
        action?: {
          id: string;
          sourceId: string;
          status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
        };
      }>(`/briefs/${id}/calendar-events`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      this.request<{ success: boolean; message: string }>(`/briefs/${id}`, {
        method: "DELETE",
      }),
  };

  notifications = {
    subscribe: (subscription: PushSubscriptionJSON) =>
      this.request<{ success: boolean }>("/notifications/subscribe", {
        method: "POST",
        body: JSON.stringify({ subscription }),
      }),

    unsubscribe: (endpoint: string) =>
      this.request<{ success: boolean }>("/notifications/unsubscribe", {
        method: "DELETE",
        body: JSON.stringify({ endpoint }),
      }),

    sendTest: () =>
      this.request<{ success: boolean }>("/notifications/send-test", {
        method: "POST",
      }),
  };

  // User endpoints
  users = {
    getProfile: () => this.request<User>("/users/me"),

    getBriefs: () =>
      this.request<{ user: User; briefs: Brief[] }>("/users/me/briefs"),

    updatePreferences: (data: {
      name?: string;
      timezone?: string;
      onboardingComplete?: boolean;
      onboardingStep?: number;
    }) =>
      this.request<User>("/users/me/preferences", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    getSenderPreferences: () =>
      this.request<SenderPreference[]>("/users/me/sender-preferences"),

    upsertSenderPreference: (data: {
      senderEmail: string;
      senderName?: string;
      priority?: SenderPriority;
      alwaysInclude?: boolean;
      neverInclude?: boolean;
    }) =>
      this.request<SenderPreference>("/users/me/sender-preferences", {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    deleteSenderPreference: (senderEmail: string) =>
      this.request<{ success: boolean }>(
        `/users/me/sender-preferences/${encodeURIComponent(senderEmail)}`,
        {
          method: "DELETE",
        },
      ),
  };

  // Schedule endpoints
  schedules = {
    getAll: () => this.request<Schedule[]>("/summary/schedules"),

    getById: (id: string) => this.request<Schedule>(`/summary/schedules/${id}`),

    create: (data: {
      name: string;
      deliveryTime: string;
      timezone?: string;
      voicePersona?: string;
      emailsFrom?: string;
      customPrompt?: string;
      styleId?: string | null;
      includeGmail?: boolean;
      includeOutlook?: boolean;
    }) =>
      this.request<Schedule>("/summary/schedules", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (
      id: string,
      data: {
        name?: string;
        deliveryTime?: string;
        timezone?: string;
        voicePersona?: string;
        emailsFrom?: string;
        customPrompt?: string;
        styleId?: string | null;
        isActive?: boolean;
        includeGmail?: boolean;
        includeOutlook?: boolean;
      },
    ) =>
      this.request<Schedule>(`/summary/schedules/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      this.request<{ success: boolean }>(`/summary/schedules/${id}`, {
        method: "DELETE",
      }),

    toggle: (id: string) =>
      this.request<Schedule>(`/summary/schedules/${id}/toggle`, {
        method: "POST",
      }),
  };

  // Admin endpoints
  admin = {
    getUsers: () => this.request<User[]>("/admin/users"),

    revokeUser: (id: string) =>
      this.request<{ success: boolean }>(`/admin/users/${id}/revoke`, {
        method: "DELETE",
      }),

    getAnalytics: () => this.request<AdminAnalytics>("/admin/analytics"),

    sendEmail: (data: {
      userIds: string[];
      subject: string;
      message: string;
    }) =>
      this.request<{ success: boolean; count: number }>("/admin/mail/send", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    sendCustomEmail: (data: {
      to: string;
      fromEmail: string;
      subject: string;
      message: string;
    }) =>
      this.request<{ success: boolean }>("/admin/mail/send-custom", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    // Support tickets
    getTickets: (status?: string, category?: string) =>
      this.request<SupportTicket[]>(
        `/support/tickets${status || category ? `?${status ? `status=${status}&` : ""}${category ? `category=${category}` : ""}` : ""}`,
      ),

    updateTicket: (
      id: string,
      data: { status?: string; priority?: string; adminNotes?: string },
    ) =>
      this.request<SupportTicket>(`/support/tickets/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    // Feedback
    getFeedback: () => this.request<FeedbackEntry[]>("/feedback"),
    getFeedbackStats: () => this.request<FeedbackStats>("/feedback/stats"),

    // Releases
    getReleases: () => this.request<Release[]>("/admin/releases"),
    createRelease: (data: {
      version: string;
      title: string;
      slug?: string;
      description?: string;
      content: string;
      changes?: ReleaseChange[];
    }) =>
      this.request<Release>("/admin/releases", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateRelease: (id: string, data: Partial<Release>) =>
      this.request<Release>(`/admin/releases/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    deleteRelease: (id: string) =>
      this.request<{ success: boolean }>(`/admin/releases/${id}`, {
        method: "DELETE",
      }),
    broadcastRelease: (id: string) =>
      this.request<{ success: boolean; sentCount: number }>(
        `/admin/releases/${id}/broadcast`,
        { method: "POST" },
      ),

    // Waitlist management
    getWaitlist: () => this.request<WaitlistEntry[]>("/admin/waitlist"),
    approveWaitlist: (id: string) =>
      this.request<WaitlistEntry>(`/admin/waitlist/${id}/approve`, {
        method: "POST",
      }),
    rejectWaitlist: (id: string) =>
      this.request<WaitlistEntry>(`/admin/waitlist/${id}/reject`, {
        method: "POST",
      }),
    waitlistWaitlist: (id: string) =>
      this.request<WaitlistEntry>(`/admin/waitlist/${id}/waitlist`, {
        method: "POST",
      }),
    deleteWaitlist: (id: string) =>
      this.request<{ success: boolean }>(`/admin/waitlist/${id}`, {
        method: "DELETE",
      }),
  };

  // Public Releases
  releases = {
    getAll: () => this.request<Release[]>("/releases"),
    getBySlug: (slug: string) => this.request<Release>(`/releases/${slug}`),
  };

  // Support (public)
  support = {
    createTicket: (data: {
      email: string;
      subject: string;
      message: string;
      category?: string;
    }) =>
      this.request<{ id: string }>("/support/tickets", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  };

  // Feedback (public)
  feedback = {
    submit: (data: { email: string; rating: number; message?: string }) =>
      this.request<{ id: string }>("/feedback", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  };

  // Integrations
  integrations = {
    getAll: () => this.request<Integration[]>("/integrations"),

    initOAuth: (provider: string) =>
      this.request<{ ticket: string }>(`/integrations/${provider}/init`, {
        method: "POST",
      }),

    connect: (
      provider: string,
      data?: {
        accessToken?: string;
        refreshToken?: string;
        metadata?: Record<string, unknown>;
      },
    ) =>
      this.request<Integration>(`/integrations/${provider}/connect`, {
        method: "POST",
        body: JSON.stringify(data || {}),
      }),

    disconnect: (provider: string) =>
      this.request<{ success: boolean }>(`/integrations/${provider}/disconnect`, {
        method: "POST",
      }),

    getStyleProfile: () =>
      this.request<StyleProfile>("/integrations/style-profile"),

    updateStyleProfile: (content: string) =>
      this.request<{ success: boolean }>("/integrations/style-profile", {
        method: "PUT",
        body: JSON.stringify({ content }),
      }),
  };

  // Action Items endpoints
  actionItems = {
    getAll: (filters?: { status?: string; type?: string; briefId?: string; limit?: number }) => {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.type) params.append("type", filters.type);
      if (filters?.briefId) params.append("briefId", filters.briefId);
      if (filters?.limit) params.append("limit", filters.limit.toString());
      const query = params.toString();
      return this.request<ActionItem[]>(`/action-items${query ? `?${query}` : ""}`);
    },

    getCounts: () => this.request<Record<string, number>>("/action-items/counts"),

    getOne: (id: string) => this.request<ActionItem>(`/action-items/${id}`),

    updateStatus: (id: string, status: string) =>
      this.request<ActionItem>(`/action-items/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),

    update: (id: string, data: Partial<ActionItem>) =>
      this.request<ActionItem>(`/action-items/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    generateReply: (id: string, promptDraft?: string) =>
      this.request<{ suggestedReply: string }>(`/action-items/${id}/generate-reply`, {
        method: "POST",
        body: JSON.stringify({ promptDraft }),
      }),

    sendMail: (id: string) =>
      this.request<{ success: boolean; sentMailId: string }>(`/action-items/${id}/send-mail`, {
        method: "POST",
      }),

    calendarSync: (id: string) =>
      this.request<{ success: boolean; event: any }>(`/action-items/${id}/calendar-sync`, {
        method: "POST",
      }),

    delete: (id: string) =>
      this.request<{ success: boolean }>(`/action-items/${id}`, {
        method: "DELETE",
      }),
  };

  // Styles endpoints
  styles = {
    getAll: () => this.request<BriefingStyle[]>("/styles"),
    getOne: (id: string) => this.request<BriefingStyle>(`/styles/${id}`),
    create: (data: { name: string; description?: string; prompt: string; isDefault?: boolean }) =>
      this.request<BriefingStyle>("/styles", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (
      id: string,
      data: { name?: string; description?: string; prompt?: string; isDefault?: boolean }
    ) =>
      this.request<BriefingStyle>(`/styles/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    setDefault: (id: string) =>
      this.request<BriefingStyle>(`/styles/${id}/default`, {
        method: "POST",
      }),
    delete: (id: string) =>
      this.request<{ success: boolean }>(`/styles/${id}`, {
        method: "DELETE",
      }),
  };

  workspace = {
    getFeed: () =>
      this.request<{
        tasks: ActionItem[];
        meetings: ActionItem[];
        replies: ActionItem[];
        followUps: ActionItem[];
        recentActivity: ActionItem[];
        counts: Record<string, number>;
      }>("/workspace/feed"),

    getCalendar: () =>
      this.request<any[]>("/workspace/calendar"),
  };
}

export const api = new ApiClient();
export default api;
