export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/** Parse the timestamp embedded in a backup key into a Date. */
export function parseKeyDate(key: string): Date | null {
  const m = key.match(/(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
}

/** Human label for a backup, e.g. "15 Apr 2025 · 02:00". */
export function formatLabel(key: string): string {
  const d = parseKeyDate(key);
  if (!d) return key;
  const date = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

/** Colour class for the age cell — fresh backups read green, older ones fade. */
export function ageColorClass(
  iso: string | null,
  fallback: Date | null,
): string {
  const d = iso ? new Date(iso) : fallback;
  if (!d || Number.isNaN(d.getTime())) return "text-app-muted";
  const days = (Date.now() - d.getTime()) / 86_400_000;
  if (days < 1) return "text-app-green";
  if (days < 30) return "text-app-muted";
  return "text-app-muted/60";
}

/** Relative age string ("2h ago", "3d ago") from an ISO date or fallback Date. */
export function relativeAge(iso: string | null, fallback: Date | null): string {
  const d = iso ? new Date(iso) : fallback;
  if (!d || Number.isNaN(d.getTime())) return "—";
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  const mo = Math.floor(days / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}
