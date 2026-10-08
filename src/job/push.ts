import { fetchPushConfig, removePushSubscription, savePushSubscription } from './api';

function decodeVapidKey(value: string): Uint8Array {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

export interface PushState {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  subscribed: boolean;
  backendEnabled: boolean;
  storageReady: boolean;
}

export async function inspectPushState(): Promise<PushState> {
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const backend = await fetchPushConfig();
  if (!supported) {
    return { supported: false, permission: 'unsupported', subscribed: false, backendEnabled: backend.enabled, storageReady: backend.storage_ready };
  }
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return {
    supported: true,
    permission: Notification.permission,
    subscribed: !!subscription && backend.subscribed > 0,
    backendEnabled: backend.enabled,
    storageReady: backend.storage_ready
  };
}

export async function enableJobPush(): Promise<PushState> {
  const backend = await fetchPushConfig();
  if (!backend.storage_ready) throw new Error('Chief push subscription storage is not provisioned.');
  if (!backend.enabled || !backend.public_key) throw new Error('Chief Web Push is not configured on the backend.');
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    throw new Error('This browser does not support installed-PWA Web Push.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notification permission was not granted.');

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeVapidKey(backend.public_key) as BufferSource
    });
  }
  await savePushSubscription(subscription.toJSON());
  return inspectPushState();
}

export async function disableJobPush(): Promise<PushState> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return inspectPushState();
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await removePushSubscription(subscription.endpoint);
    await subscription.unsubscribe();
  }
  return inspectPushState();
}
