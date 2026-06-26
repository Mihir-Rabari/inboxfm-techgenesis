// Voice persona options for audio briefing style
export enum VoicePersona {
    NEWSROOM = 'NEWSROOM',   // Professional anchor tone
    FRIEND = 'FRIEND',       // Casual, conversational
    SPEEDSTER = 'SPEEDSTER', // Fast-paced, action-oriented
}

// Brief processing status
export enum BriefStatus {
    PENDING = 'PENDING',
    FETCHING = 'FETCHING',
    PROCESSING = 'PROCESSING',
    GENERATING_AUDIO = 'GENERATING_AUDIO',
    DELIVERING = 'DELIVERING',
    DELIVERED = 'DELIVERED',
    FAILED = 'FAILED',
}

// Email categories for smart grouping
export enum EmailCategory {
    URGENT = 'URGENT',
    ACTION_REQUIRED = 'ACTION_REQUIRED',
    DEADLINES = 'DEADLINES',
    MEETINGS = 'MEETINGS',
    IMPORTANT = 'IMPORTANT',
    PERSONAL = 'PERSONAL',
    NEWSLETTERS = 'NEWSLETTERS',
    PROMOTIONS = 'PROMOTIONS',
    NOISE = 'NOISE',
}

// Sender priority levels
export enum SenderPriority {
    CRITICAL = 'CRITICAL',   // Boss, VIPs
    HIGH = 'HIGH',           // Important contacts
    NORMAL = 'NORMAL',       // Regular
    LOW = 'LOW',             // Newsletters
    IGNORE = 'IGNORE',       // Spam-like
}
