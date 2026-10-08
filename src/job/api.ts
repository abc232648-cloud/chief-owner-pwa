import { chiefApiClient } from '../api';

export type JobFeedSeverity = 'INFO' | 'ACTION_REQUIRED' | 'URGENT';

export interface JobFeedEvent {
  id: string;
  occurred_at: string;
  source: 'notification' | 'application';
  severity: JobFeedSeverity;
  title: string;
  summary: string;
  status: string;
  application_id: string | null;
  related_page: string;
  unread: boolean;
}

export interface JobFeedResponse {
  events: JobFeedEvent[];
  counts: {
    unread: number;
    action_required: number;
    urgent: number;
  };
  limit: number;
  privacy: string;
}

export interface JobPushConfig {
  enabled: boolean;
  public_key: string;
  storage_ready: boolean;
  subscribed: number;
}

export async function fetchJobFeed(): Promise<JobFeedResponse> {
  return (await chiefApiClient.get<JobFeedResponse>('/api/ui/job-feed')).data;
}

export async function fetchPushConfig(): Promise<JobPushConfig> {
  return (await chiefApiClient.get<JobPushConfig>('/api/job-pwa/push-config')).data;
}

export async function savePushSubscription(subscription: PushSubscriptionJSON): Promise<void> {
  const endpoint = subscription.endpoint;
  const p256dh = subscription.keys?.p256dh;
  const auth = subscription.keys?.auth;
  if (!endpoint || !p256dh || !auth) throw new Error('Browser returned an incomplete Web Push subscription.');
  await chiefApiClient.post('/api/job-pwa/push-subscriptions', {
    endpoint,
    keys: { p256dh, auth }
  });
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  await chiefApiClient.post('/api/job-pwa/push-unsubscribe', { endpoint });
}
