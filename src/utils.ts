import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(time: string) {
  return time; // Simple HH:mm
}

export function getDayName(day: number) {
  const days = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return days[day];
}
