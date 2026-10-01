export function formatTime(time?: string | null): string {
  if (!time) return "";
  const trimmed = String(time).trim();
  if (!trimmed) return "";

  if (/AM|PM/i.test(trimmed)) return trimmed;

  const timeMatch = trimmed.match(/(\d{1,2}:\d{2})(?!.*\d)/);
  if (!timeMatch) return trimmed;

  const timePart = timeMatch[1];
  const parts = timePart.split(":");
  if (parts.length < 2) return trimmed;

  let hour = parseInt(parts[0], 10);
  const minute = parts[1];
  if (isNaN(hour)) return trimmed;

  const suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  const converted = `${String(hour).padStart(2, "0")}:${minute} ${suffix}`;

  return trimmed.replace(timePart, converted);
}

export function to24Hour(time?: string | null): string {
  if (!time) return "";
  const trimmed = String(time).trim();
  if (!trimmed) return "";
  if (!/AM|PM/i.test(trimmed)) {
    if (/^\d{1}:\d{2}$/.test(trimmed)) {
      return "0" + trimmed;
    }
    return trimmed;
  }
  const match = trimmed.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return trimmed;
  let hour = parseInt(match[1], 10);
  const minute = match[2];
  const suffix = match[3].toUpperCase();
  if (suffix === "AM" && hour === 12) hour = 0;
  if (suffix === "PM" && hour !== 12) hour += 12;
  return `${String(hour).padStart(2, "0")}:${minute}`;
}

export function getTodayDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function normalizeDateString(dateStr?: string | null): string {
  if (!dateStr) return "";
  const trimmed = String(dateStr).trim();
  if (!trimmed) return "";

  // Extract the date portion before 'T' or space if timestamp is present
  const datePart = trimmed.split("T")[0].split(" ")[0].trim();

  // If format is YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const ymdMatch = datePart.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, "0");
    const day = ymdMatch[3].padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // If format is DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const dmyMatch = datePart.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Fallback to standard Date parsing if possible
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return datePart;
}

