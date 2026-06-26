export interface IntegrationDefinition {
  provider: string;
  name: string;
  description: string;
  category: 'email' | 'productivity' | 'communication' | 'content';
  authType: 'oauth2' | 'api_key' | 'config' | 'none';
  isAvailable: boolean; // false = coming soon
}

export const INTEGRATION_REGISTRY: IntegrationDefinition[] = [
  {
    provider: 'GMAIL',
    name: 'Gmail',
    description: 'Read emails for daily audio briefings',
    category: 'email',
    authType: 'oauth2',
    isAvailable: true,
  },
  {
    provider: 'GOOGLE_CALENDAR',
    name: 'Google Calendar',
    description: 'Sync action items and events from briefings',
    category: 'productivity',
    authType: 'oauth2',
    isAvailable: true,
  },
  {
    provider: 'SLACK',
    name: 'Slack',
    description: 'Pull highlights from DMs and channels into briefings',
    category: 'communication',
    authType: 'oauth2',
    isAvailable: false,
  },
  {
    provider: 'NOTION',
    name: 'Notion',
    description: 'Include task and document updates in briefings',
    category: 'productivity',
    authType: 'oauth2',
    isAvailable: false,
  },
  {
    provider: 'OUTLOOK',
    name: 'Outlook Mail & Calendar',
    description: 'Read Microsoft 365 emails and calendar events for briefings',
    category: 'email',
    authType: 'oauth2',
    isAvailable: true,
  },
  {
    provider: 'RSS_FEED',
    name: 'RSS Feeds',
    description: 'Subscribe to RSS feeds to include articles in briefings',
    category: 'content',
    authType: 'config',
    isAvailable: true,
  },
  {
    provider: 'GITHUB',
    name: 'GitHub',
    description: 'Pull notifications, issues, and PR reviews into briefings',
    category: 'communication',
    authType: 'api_key',
    isAvailable: true,
  },
];
