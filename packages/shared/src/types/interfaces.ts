import { EmailCategory, VoicePersona, BriefStatus, SenderPriority } from './enums';

// User profile
export interface User {
    id: string;
    email: string;
    googleId: string;
    deliveryTime: string;
    timezone: string;
    voicePersona: VoicePersona;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Daily brief
export interface DailyBrief {
    id: string;
    userId: string;
    date: Date;
    textSummary: string;
    scriptJson: ScriptSegment[];
    audioUrl?: string;
    audioDuration?: number;
    emailsProcessed: number;
    categoryCounts: Record<EmailCategory, number>;
    status: BriefStatus;
    createdAt: Date;
}

// Script segment for audio generation
export interface ScriptSegment {
    type: 'intro' | 'category' | 'email' | 'outro' | 'transition';
    text: string;
    emphasis?: 'high' | 'medium' | 'low';
    pauseAfter?: number; // milliseconds
}

// Processed email from Gmail
export interface ProcessedEmail {
    id: string;
    threadId: string;
    from: string;
    fromEmail: string;
    subject: string;
    snippet: string;
    body: string;
    receivedAt: Date;
    category: EmailCategory;
    priority: number;
    sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
    actionRequired: boolean;
    deadline?: Date;
}

// Email analysis from AI
export interface EmailAnalysis {
    category: EmailCategory;
    priority: number; // 0-100
    sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
    actionRequired: boolean;
    deadline?: string;
    keyPoints: string[];
    suggestedSummary: string;
}

// User preferences update
export interface UpdatePreferencesDto {
    deliveryTime?: string;
    timezone?: string;
    voicePersona?: VoicePersona;
    isActive?: boolean;
}

// API responses
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
