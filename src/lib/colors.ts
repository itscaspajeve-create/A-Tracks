// Categorical palette (light-mode steps, CVD-safe ordering). Entity colors are
// stored per-row in the DB so they stay consistent across every chart and badge.
export const PALETTE = [
  "#2a78d6", // blue
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
  "#e87ba4", // magenta
  "#eb6834", // orange
  "#0e7c8c", // teal
  "#8a6d3b", // brown
  "#6e6d68", // gray
] as const;

export function nextColor(used: string[]): string {
  const free = PALETTE.find((c) => !used.includes(c));
  return free ?? PALETTE[used.length % PALETTE.length];
}

export const ACCOUNT_TYPES = ["bank", "e-wallet", "loan", "cash"] as const;

export const CATEGORY_ICONS = [
  "home",
  "shopping-cart",
  "cat",
  "user",
  "clapperboard",
  "plug-zap",
  "landmark",
  "piggy-bank",
  "credit-card",
  "banknote",
  "tag",
  "utensils",
  "bus",
  "heart-pulse",
  "gift",
] as const;
