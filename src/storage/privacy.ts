/**
 * CHIEF Storage Privacy & Session Isolation Manager
 * 
 * BATCH 13C.2A PRIVACY RULES:
 * - When identity changes or logout occurs:
 *   - In-memory read caches are immediately wiped.
 *   - Offline queue and worker report states are scoped exclusively to the authenticated userId.
 *   - Unsynchronized records of the previous user remain securely bound to their userId in IndexedDB
 *     (preventing data loss) but are NEVER exposed to the next logged-in user.
 *   - Anonymous/unowned records never auto-attach to subsequent logins.
 *   - Never reattribute queue items to another worker.
 */

import { clearLiveCache, setCacheUserNamespace } from '../api/cache/readCache';

export class StoragePrivacyManager {
  private static currentUserId: string | null = null;

  public static getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * Called whenever user session changes (login, switch, or reauth).
   */
  public static handleSessionChange(newUserId: string | null): void {
    if (this.currentUserId !== newUserId) {
      // 1. Wipe active live telemetry caches across memory and sessionStorage
      clearLiveCache();
      setCacheUserNamespace(newUserId);

      // 2. Update active security namespace
      this.currentUserId = newUserId;
    }
  }

  /**
   * Explicit logout handler.
   */
  public static handleLogout(): void {
    clearLiveCache();
    setCacheUserNamespace(null);
    this.currentUserId = null;
  }
}
