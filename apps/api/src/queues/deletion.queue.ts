const globalSymbols = global as any;
if (!globalSymbols.pendingDeletions) {
  globalSymbols.pendingDeletions = new Map<string, NodeJS.Timeout>();
}
const pendingDeletions: Map<string, NodeJS.Timeout> =
  globalSymbols.pendingDeletions;

export function scheduleOrgDeletion(
  organizationId: string,
  callback: () => Promise<void>,
  delay: number = 30 * 60 * 1000,
): void {
  // If a timer already exists for this Org, clear it out first
  if (pendingDeletions.has(organizationId)) {
    clearTimeout(pendingDeletions.get(organizationId)!);
  }

  const timer = setTimeout(async () => {
    try {
      await callback();
    } catch (error) {
      console.error(
        `Error executing deletion callback for org ${organizationId}:`,
        error,
      );
    } finally {
      // Ensure it gets cleaned up from memory even if the callback fails
      pendingDeletions.delete(organizationId);
    }
  }, delay);

  pendingDeletions.set(organizationId, timer);
}

export function cancelOrgDeletion(organizationId: string): boolean {
  const timer = pendingDeletions.get(organizationId);
  if (!timer) return false;

  clearTimeout(timer);
  pendingDeletions.delete(organizationId);
  return true;
}

export function isScheduled(organizationId: string): boolean {
  return pendingDeletions.has(organizationId);
}
