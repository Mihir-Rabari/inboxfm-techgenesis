import { VoicePersona } from '@prisma/client';

export const DEFAULT_SUMMARY_NAME = 'Morning Summary';
export const DEFAULT_DELIVERY_TIME = '07:00';
export const DEFAULT_TIMEZONE = 'UTC';
export const DEFAULT_VOICE_PERSONA: VoicePersona = 'NEWSROOM';
export const DEFAULT_EMAILS_FROM = 'last_delivery';

// Regular expression for HH:MM time format
export const TIME_FORMAT_REGEX = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
