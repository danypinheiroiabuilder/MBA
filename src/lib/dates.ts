import { addMonths, format, parseISO, startOfMonth } from "date-fns";

export function monthKeyFromISODate(isoDate: string) {
  return isoDate.slice(0, 7); // YYYY-MM
}

export function monthLabelFromKey(key: string) {
  // key: YYYY-MM
  const iso = `${key}-01`;
  return format(parseISO(iso), "MMM yyyy");
}

export function clampMonthKey(key: string) {
  return /^\d{4}-\d{2}$/.test(key) ? key : format(new Date(), "yyyy-MM");
}

export function shiftMonthKey(key: string, deltaMonths: number) {
  const iso = `${clampMonthKey(key)}-01`;
  return format(addMonths(startOfMonth(parseISO(iso)), deltaMonths), "yyyy-MM");
}

