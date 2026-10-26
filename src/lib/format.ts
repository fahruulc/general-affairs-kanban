import { APP_CONFIG } from "./constants";

/**
 * Format report sequence number to standardized GA string format (e.g. GA-00042)
 */
export function formatReportNumber(num: number): string {
  const padded = String(num).padStart(APP_CONFIG.reportNumberPadLength, "0");
  return `${APP_CONFIG.reportNumberPrefix}${padded}`;
}

/**
 * Format Date to Indonesian locale (Asia/Jakarta / WIB)
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  includeTime: boolean = true
): string {
  if (!date) return "-";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(includeTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }
      : {}),
  };

  return new Intl.DateTimeFormat("id-ID", options).format(d);
}

/**
 * Format file size in bytes to human-readable format
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
