import type { ServiceSlot } from "@/lib/atelier-config";

function isSameCalendarDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function toLocalServiceDate(dateValue: string, timeValue: string): Date | null {
  if (!dateValue || !timeValue) {
    return null;
  }

  const parsed = new Date(`${dateValue}T${timeValue}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function buildManualServiceDate(dateValue: string, now = new Date()): Date | null {
  const baseDate = toLocalServiceDate(dateValue, "09:00");

  if (!baseDate) {
    return null;
  }

  if (baseDate > now) {
    return baseDate;
  }

  if (!isSameCalendarDay(baseDate, now)) {
    return baseDate;
  }

  const adjusted = new Date(now.getTime() + 30 * 60 * 1000);
  adjusted.setSeconds(0, 0);
  return adjusted;
}

export function getServiceSlotStart(slot: ServiceSlot): Date | null {
  return toLocalServiceDate(slot.date, slot.heureDebut);
}
