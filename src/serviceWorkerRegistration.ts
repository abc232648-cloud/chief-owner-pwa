/**
 * CHIEF PWA Service Worker Registration & Lifecycle Manager.
 * Production Owner Mobile is scoped to /owner/ and retires any legacy root worker.
 */

import { isChiefDevMode } from './config/devMode';

export interface ServiceWorkerRegistrationConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
}

let activeRegistration: ServiceWorkerRegistration | null = null;
let isUpdateAvailable = false;
const updateListeners: Array<(updateAvailable: boolean) => void> = [];

async function retireLegacyRootWorker(): Promise<void> {
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const reg of registrations) {
    const script = reg.active?.scriptURL || reg.waiting?.scriptURL || reg.installing?.scriptURL || '';
    const scopePath = new URL(reg.scope).pathname;
    if (scopePath === '/' && script.endsWith('/sw.js')) await reg.unregister();
  }
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    for (const name of cacheNames) {
      if (name.startsWith('chief-static-')) await caches.delete(name);
    }
  }
}

export function registerServiceWorker(config?: ServiceWorkerRegistrationConfig): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  const base = import.meta.env.BASE_URL;

  window.addEventListener('load', () => {
    void (async () => {
      try { await retireLegacyRootWorker(); } catch {}
      if (isChiefDevMode()) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            if ((reg.active?.scriptURL || '').includes('/owner/sw.js')) await reg.unregister();
          }
          if ('caches' in window) {
            for (const name of await caches.keys()) {
              if (name.startsWith('chief-owner-static-')) await caches.delete(name);
            }
          }
        } catch {}
        return;
      }

      if (base !== '/owner/') {
        console.warn('[Chief Service Worker] Owner production base path mismatch; registration refused.');
        return;
      }
      navigator.serviceWorker.register(`${base}sw.js`, { scope: base })
        .then((registration) => {
          activeRegistration = registration;
          if (registration.waiting) {
            isUpdateAvailable = true;
            notifyUpdateListeners(true);
            config?.onUpdate?.(registration);
          }
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (!installingWorker) return;
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  isUpdateAvailable = true;
                  notifyUpdateListeners(true);
                  config?.onUpdate?.(registration);
                } else {
                  config?.onSuccess?.(registration);
                }
              }
            };
          };
        })
        .catch((error) => console.warn('[Chief Service Worker] Registration failed:', error));
    })();
  });
}

export function subscribeToUpdates(listener: (updateAvailable: boolean) => void): () => void {
  updateListeners.push(listener);
  listener(isUpdateAvailable);
  return () => {
    const index = updateListeners.indexOf(listener);
    if (index > -1) updateListeners.splice(index, 1);
  };
}

function notifyUpdateListeners(available: boolean): void {
  for (const listener of updateListeners) {
    try { listener(available); } catch {}
  }
}

export interface UpdateApplyResult {
  applied: boolean;
  reason?: 'unsaved_work' | 'no_waiting_worker' | 'activating';
}

export function applyUpdateSafely(isSafeToReload: boolean): UpdateApplyResult {
  if (!isSafeToReload) {
    console.warn('[Chief Service Worker] Update deferred: active operational work is in-progress.');
    return { applied: false, reason: 'unsaved_work' };
  }
  if (!activeRegistration || !activeRegistration.waiting) {
    console.info('[Chief Service Worker] No waiting service worker found to activate.');
    return { applied: false, reason: 'no_waiting_worker' };
  }
  activeRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload());
  return { applied: true, reason: 'activating' };
}
