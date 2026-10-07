/**
 * CHIEF PWA Service Worker Registration & Lifecycle Manager
 * 
 * BATCH 13C.2A.1 IMMUTABLE SPECIFICATION:
 * - DEV mode isolation: Never registers production service worker in DEV.
 *   Safely unregisters any obsolete Chief service workers and purges only Chief-owned caches.
 * - PROD mode: Registers conservative service worker.
 * - Explicit user-controlled updates: Worker enters 'waiting' state and is never activated automatically.
 * - applyUpdateSafely() verifies reload safety FIRST before any activation or reload.
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

  // REQUIREMENT 12: DEV Mode Isolation
  if (isChiefDevMode()) {
    // In DEV, do NOT register production service worker.
    // Clean up any existing Chief service worker and Chief-owned static caches on this origin.
    window.addEventListener('load', () => {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          if (reg.active?.scriptURL?.includes('sw.js')) {
            reg.unregister().then((success) => {
              if (success) {
                console.info('[Chief Dev SW] Unregistered previous service worker in DEV mode.');
              }
            });
          }
        }
      }).catch(() => {
        // Ignore errors in sandboxed dev environment
      });

      if ('caches' in window) {
        caches.keys().then((cacheNames) => {
          for (const name of cacheNames) {
            if (name.startsWith('chief-static-')) {
              caches.delete(name).catch(() => {});
            }
          }
        }).catch(() => {});
      }
    });
    return;
  }

  // REQUIREMENT 12: PROD Mode Registration
  window.addEventListener('load', () => {
    const swUrl = '/sw.js';

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        activeRegistration = registration;

        // Check if there is already a waiting worker from a previous visit
        if (registration.waiting) {
          isUpdateAvailable = true;
          notifyUpdateListeners(true);
          config?.onUpdate?.(registration);
        }

        // Listen for new updates discovered
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New update installed into cache and now waiting for user approval
                isUpdateAvailable = true;
                notifyUpdateListeners(true);
                config?.onUpdate?.(registration);
              } else {
                // Content cached for offline use
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
      // Ignore listener error
    }
  }
}

export interface UpdateApplyResult {
  applied: boolean;
  reason?: 'unsaved_work' | 'no_waiting_worker' | 'activating';
}

/**
 * Safely applies an update by posting SKIP_WAITING to waiting worker,
 * then reloading only after controller changes AND only when reload is safe.
 * 
 * REQUIREMENT 10 & 11:
 * 1. Evaluate isSafeToReload FIRST. If false, do nothing.
 * 2. If no waiting worker, do NOT blindly reload.
 * 3. Only when safe and waiting worker is present, send SKIP_WAITING and reload on controllerchange.
 */
export function applyUpdateSafely(isSafeToReload: boolean): UpdateApplyResult {
  // Step 1: Evaluate reload safety FIRST
  if (!isSafeToReload) {
    console.warn('[Chief Service Worker] Update deferred: active operational work is in-progress.');
    return { applied: false, reason: 'unsaved_work' };
  }

  // Step 2: Check waiting worker state — never blindly reload
  if (!activeRegistration || !activeRegistration.waiting) {
    console.info('[Chief Service Worker] No waiting service worker found to activate.');
    return { applied: false, reason: 'no_waiting_worker' };
  }

  // Step 3: Activate waiting worker safely
  activeRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });

  return { applied: true, reason: 'activating' };
}
