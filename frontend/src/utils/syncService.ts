// Legacy raw-HTTP offline replay removed in the offline-sync rework.
// The typed domain-ops replay engine lands in Task 10 (src/sync/replay.ts),
// which will move initSync there and delete this file.
export function initSync(): void {}
