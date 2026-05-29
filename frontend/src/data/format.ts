export function formatIDR(value: number): string {
  if (!isFinite(value)) return "Rp 0";
  const rounded = Math.round(value);
  return "Rp " + rounded.toLocaleString("id-ID");
}

export function formatPct(value: number, digits: number = 1): string {
  if (!isFinite(value)) return "0%";
  return value.toFixed(digits) + "%";
}

export function roundToNearest(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.round(value / step) * step;
}

export function parseNumber(input: string): number {
  if (!input) return 0;
  const cleaned = input.replace(/[^0-9.,-]/g, "").replace(/\./g, "").replace(/,/g, ".");
  const n = parseFloat(cleaned);
  return isFinite(n) ? n : 0;
}
