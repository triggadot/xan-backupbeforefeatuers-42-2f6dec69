
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

/**
 * Combines class names with proper handling of tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string to a readable format
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  try {
    return format(new Date(date), "MMM d, yyyy");
  } catch (e) {
    console.error("Error formatting date:", e);
    return "Invalid date";
  }
}

/**
 * Format a number as a currency string
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number with commas
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return "0";
  return new Intl.NumberFormat("en-US").format(num);
}

/**
 * Format a percentage
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "0%";
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Format a date string to a short format (e.g., Jan 1)
 */
export function formatShortDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  try {
    return format(new Date(date), "MMM d");
  } catch (e) {
    console.error("Error formatting short date:", e);
    return "Invalid";
  }
}
