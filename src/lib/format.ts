const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const pesoWhole = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export function formatPeso(amount: number): string {
  return peso.format(amount);
}

export function formatPesoWhole(amount: number): string {
  return pesoWhole.format(amount);
}

export function formatPesoCompact(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `₱${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `₱${(amount / 1_000).toFixed(1)}k`;
  return pesoWhole.format(amount);
}

/** "2026-07" for a Date or today. */
export function monthKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** "2026-07-14" local date string. */
export function todayISO(): string {
  const d = new Date();
  return `${monthKey(d)}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "2026-07" -> "July 2026" */
export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** "2026-07" -> "Jul '26" */
export function monthShort(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  return monthKey(new Date(y, m - 1 + delta, 1));
}

/** Trailing n month keys ending at `end` (inclusive), oldest first. */
export function trailingMonths(n: number, end: string = monthKey()): string[] {
  return Array.from({ length: n }, (_, i) => shiftMonth(end, i - n + 1));
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Given due days-of-month (e.g. 15 and 31), the next due date from today. */
export function nextDueDate(dueDays: number[]): Date | null {
  const days = dueDays.filter((d): d is number => !!d);
  if (days.length === 0) return null;
  const today = new Date();
  const candidates: Date[] = [];
  for (let offset = 0; offset < 2; offset++) {
    const y = today.getFullYear();
    const m = today.getMonth() + offset;
    const lastDay = new Date(y, m + 1, 0).getDate();
    for (const d of days) {
      candidates.push(new Date(y, m, Math.min(d, lastDay)));
    }
  }
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const future = candidates.filter((c) => c >= todayMid).sort((a, b) => +a - +b);
  return future[0] ?? null;
}
