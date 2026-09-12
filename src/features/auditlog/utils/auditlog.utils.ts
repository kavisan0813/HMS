import type { AuditLogListParams } from "../types/auditlog.types";

export function safeArray<T>(data: T[] | undefined | null): T[] {
  return Array.isArray(data) ? data : [];
}

export function display(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load audit data.";
}

export function localDate(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function getDateRange(
  range: string,
  customStartDate?: string,
  customEndDate?: string,
): Pick<AuditLogListParams, "fromDate" | "toDate"> {
  if (range === "All Time") return {};

  if (range === "Custom Range" || range === "Custom") {
    return {
      fromDate: customStartDate || undefined,
      toDate: customEndDate || undefined,
    };
  }

  const today = new Date();
  const from = new Date(today);

  if (range === "Yesterday") {
    from.setDate(from.getDate() - 1);
    const date = localDate(from);
    return { fromDate: date, toDate: date };
  }

  if (range === "Today") {
    const date = localDate(today);
    return { fromDate: date, toDate: date };
  }

  if (range === "Last 7 Days") from.setDate(from.getDate() - 6);
  if (range === "Last 30 Days") from.setDate(from.getDate() - 29);

  return { fromDate: localDate(from), toDate: localDate(today) };
}

export function normalizeCode(value: string | undefined): string {
  return (value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function matchesCode(
  value: string | undefined,
  selected: string,
): boolean {
  if (selected === "All") return true;
  const actual = normalizeCode(value);
  const expected = normalizeCode(selected);
  return Boolean(
    actual &&
    expected &&
    (actual === expected ||
      actual.includes(expected) ||
      expected.includes(actual)),
  );
}

export function isInDateRange(
  timestamp: string | undefined,
  range: string,
): boolean {
  if (range === "All Time" || !timestamp) return true;
  const value = new Date(timestamp).getTime();
  if (Number.isNaN(value)) return true;
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (range === "Yesterday") {
    start.setDate(start.getDate() - 1);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return value >= start.getTime() && value < end.getTime();
  }
  if (range === "Today") return value >= start.getTime();
  const days = range === "Last 7 Days" ? 7 : 30;
  start.setDate(start.getDate() - (days - 1));
  return value >= start.getTime();
}

export function optionValue(option: unknown): string {
  if (typeof option === "string") return option;
  if (option && typeof option === "object") {
    const candidate =
      "value" in option
        ? (option as { value?: unknown }).value
        : "code" in option
          ? (option as { code?: unknown }).code
          : "id" in option
            ? (option as { id?: unknown }).id
            : undefined;
    if (typeof candidate === "string" || typeof candidate === "number") {
      return String(candidate);
    }
  }
  return "";
}

export function optionLabel(option: unknown): string {
  if (typeof option === "string") return option;
  if (option && typeof option === "object") {
    const candidate =
      "label" in option
        ? (option as { label?: unknown }).label
        : "name" in option
          ? (option as { name?: unknown }).name
          : "description" in option
            ? (option as { description?: unknown }).description
            : undefined;
    if (typeof candidate === "string" || typeof candidate === "number") {
      return String(candidate);
    }
  }
  return optionValue(option);
}

export function matchesAnyCode(
  values: Array<string | number | undefined | null>,
  selectedFilter: string,
): boolean {
  if (selectedFilter === "All") return true;
  const target = normalizeCode(selectedFilter);
  if (!target) return true;
  return values.some((val) => normalizeCode(display(val)) === target);
}
