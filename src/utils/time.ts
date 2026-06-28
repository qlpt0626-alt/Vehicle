/**
 * Utility helper to standardize all visual date and time formatting
 * specifically targeted for Vietnam (UTC+7 / Asia/Ho_Chi_Minh).
 */
export function formatVNTime(value: any): string {
  if (!value) return "";
  try {
    let d: Date;
    if (value && typeof value.toDate === 'function') {
      d = value.toDate();
    } else if (value && typeof value.seconds === 'number') {
      d = new Date(value.seconds * 1000);
    } else if (value instanceof Date) {
      d = value;
    } else {
      d = new Date(value);
    }
    if (isNaN(d.getTime())) return "";
    
    return d.toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour12: false,
    });
  } catch {
    return "";
  }
}

/**
 * Safely parses any date value (ISO string, Firestore Timestamp, plain object with seconds, or Date)
 * into a standard javascript Date object, or returns null if invalid.
 */
export function parseDate(value: any): Date | null {
  if (!value) return null;
  try {
    let d: Date;
    if (value && typeof value.toDate === 'function') {
      d = value.toDate();
    } else if (value && typeof value.seconds === 'number') {
      d = new Date(value.seconds * 1000);
    } else if (value instanceof Date) {
      d = value;
    } else {
      d = new Date(value);
    }
    if (isNaN(d.getTime())) return null;
    return d;
  } catch {
    return null;
  }
}
