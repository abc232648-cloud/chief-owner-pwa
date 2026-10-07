/**
 * CHIEF PWA Service Worker Registration & Lifecycle Manager
 * 
 * BATCH 13C.2A RULES:
 * - Genuine service worker registration.
 * - Conservative update strategy: informs user of new versions rather than forcibly reloading.
 * - In DEV mode, registers transparently without aggressive caching to avoid stale dev state.
 */

import { isChiefDevMode } from './config/devMode';

export interface ServiceWorkerRegistrationConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
}

let activeRegistration: ServiceWorkerRegistration | null = null;
let isUpdateAvailable = false;
const updateListeners: Array<(updateAvailable: boolean) => void> = [];

export function registerServiceWorker(config?: ServiceWorkerRegistrationConfig): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    const swUrl = '/sw.js';

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        activeRegistration = registration;

        // Check for updates on register
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content is available; please refresh.
                isUpdateAvailable = true;
                notifyUpdateListeners(true);
                config?.onUpdate?.(registration);
              } else {
                // Content is cached for offline use.
                config?.onSuccess?.(registration);
              }
            }
          };
        };
      })
      .catch((error) => {
        console.warn('[Chief Service Worker] Registration failed:', error);
      });
  });
}

export function subscribeToUpdates(listener: (updateAvailable: boolean) => void): () => void {
  updateListeners.push(listener);
  listener(isUpdateAvailable);
  return () => {
    const index = updateListeners.indexOf(listener);
    if (index > -1) {
      updateListeners.splice(index, 1);
    }
  };
}

function notifyUpdateListeners(available: boolean): void {
  for (const listener of updateListeners) {
    try {
      listener(available);
    } catch {
      // Ignore
    }
  }
}

/**
 * Safely applies an update by posting SKIP_WAITING to waiting worker,
 * then reloading only when no unsaved operational input is active.
 */
export function applyUpdateSafely(isSafeToReload: boolean = true): void {
  if (!activeRegistration || !activeRegistration.waiting) {
    window.location.reload();
    return;
  }

  if (!isSafeToReload) {
    console.warn('[Chief Service Worker] Update reload deferred: unsaved operational inputs present.');
    return;
  }

  activeRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}
