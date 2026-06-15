const globalSymbols = global as any;
if (!globalSymbols.pendingDeletions) {
  globalSymbols.pendingDeletions = new Map<string, NodeJS.Timeout>();
}
const pendingDeletions: Map<string, NodeJS.Timeout> =
  globalSymbols.pendingDeletions;

export function scheduleOrgDeletion(
  orgId: string,
  callback: () => Promise<void>,
  delay: number = 30 * 60 * 1000,
): void {
  // If a timer already exists for this Org, clear it out first
  if (pendingDeletions.has(orgId)) {
    clearTimeout(pendingDeletions.get(orgId)!);
  }

  const timer = setTimeout(async () => {
    try {
      await callback();
    } catch (error) {
      console.error(
        `Error executing deletion callback for org ${orgId}:`,
        error,
      );
    } finally {
      // Ensure it gets cleaned up from memory even if the callback fails
      pendingDeletions.delete(orgId);
    }
  }, delay);

  pendingDeletions.set(orgId, timer);
}

export function cancelOrgDeletion(orgId: string): boolean {
  const timer = pendingDeletions.get(orgId);
  if (!timer) return false;

  clearTimeout(timer);
  pendingDeletions.delete(orgId);
  return true;
}

export function isScheduled(orgId: string): boolean {
  return pendingDeletions.has(orgId);
}
