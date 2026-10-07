/**
 * CHIEF Operational Work & Dirty State Tracker
 * 
 * BATCH 13C.2A.1 SPECIFICATION:
 * - Prevents unsafe PWA reloads during active operational work.
 * - Tracks whether uncommitted operator work (forms, drafts, modals) is currently in progress.
 * - When work is in progress, PWA safe-update prompts operator to save before reloading.
 */

class OperationalWorkTracker {
  private activeDirtyForms = new Set<string>();

  public setDirty(formId: string, isDirty: boolean): void {
    if (isDirty) {
      this.activeDirtyForms.add(formId);
    } else {
      this.activeDirtyForms.delete(formId);
    }
  }

  public isWorkInProgress(): boolean {
    return this.activeDirtyForms.size > 0;
  }

  public getDirtyFormIds(): string[] {
    return Array.from(this.activeDirtyForms);
  }
}

export const operationalWorkTracker = new OperationalWorkTracker();
