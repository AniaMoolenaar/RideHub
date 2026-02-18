import type { TimelineEntry, ServiceStatus } from "./types";

export function statusLabel(s: ServiceStatus) {
  switch (s) {
    case "ok":
      return "Ok";
    case "coming_up":
      return "Coming up";
    case "due_now":
      return "Due now";
    case "setup_needed":
      return "Setup needed";
    default:
      return "Ok";
  }
}

export function groupTimelineByYear(entries: TimelineEntry[]) {
  // assumes entries are newest-first; if not, sort here
  const map = new Map<string, TimelineEntry[]>();

  for (const e of entries) {
    const year = new Date(e.occurred_at).getFullYear().toString();
    const arr = map.get(year) ?? [];
    arr.push(e);
    map.set(year, arr);
  }

  const years = Array.from(map.keys()).sort((a, b) => Number(b) - Number(a));
  return years.map((y) => ({ year: y, entries: map.get(y)! }));
}
