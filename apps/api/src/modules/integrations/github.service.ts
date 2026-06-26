import { Injectable, Logger } from '@nestjs/common';
import { RawEmail } from '../gmail/gmail.service';

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);

  /**
   * Fetch recent GitHub notifications
   */
  async fetchRecentNotifications(
    accessToken: string,
    sinceTimestamp?: number,
  ): Promise<RawEmail[]> {
    const sinceDate = sinceTimestamp
      ? new Date(sinceTimestamp * 1000)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);

    this.logger.log(`Fetching GitHub notifications since ${sinceDate.toISOString()}`);



    try {
      const url = `https://api.github.com/notifications?since=${sinceDate.toISOString()}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'InboxFM-App',
        },
      });

      if (!res.ok) {
        throw new Error(`GitHub API returned ${res.status}: ${res.statusText}`);
      }

      const notifications = await res.json() as any[];

      return notifications.map((notif: any) => {
        const repoName = notif.repository?.full_name || 'GitHub Repo';
        const title = notif.subject?.title || 'Notification';
        const type = notif.subject?.type || 'Issue';
        const updatedDate = notif.updated_at ? new Date(notif.updated_at) : new Date();
        const reason = notif.reason || 'notification';

        // Map reasons to friendly descriptions
        const friendlyReason: Record<string, string> = {
          assign: 'You were assigned to this task.',
          author: 'You created this pull request or issue.',
          comment: 'There was a new comment posted.',
          mention: 'You were directly @mentioned in the thread.',
          review_requested: 'A pull request review was requested from you.',
          state_change: 'The state was changed (closed/reopened).',
          subscribed: 'You are watching this repository updates.',
        };

        const explanation = friendlyReason[reason] || `Notification event: ${reason}`;

        return {
          id: `github-${notif.id}`,
          threadId: notif.id,
          from: `GitHub Notifications <notifications@github.com>`,
          fromEmail: 'notifications@github.com',
          subject: `[GitHub] [${repoName}] ${type}: ${title}`,
          snippet: `${explanation} - Update on ${repoName}`,
          body: `GitHub Notification details:
Repository: ${repoName}
Item Type: ${type}
Title: ${title}
Update Reason: ${explanation}

For details or to view this item, check your GitHub dashboard at: https://github.com/${repoName}`,
          receivedAt: updatedDate,
        };
      });
    } catch (error) {
      this.logger.error(`Failed to fetch GitHub notifications via API: ${error.message}`);
      throw error;
    }
  }
}
