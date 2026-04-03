// Shared Utility Functions
// This file contains utility functions that are used across multiple features

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names using clsx and tailwind-merge
 * @param inputs - Class values to merge
 * @returns Merged class name string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date for display
 * @param date - Date to format
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options
  });
}

/**
 * Debounces a function call
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function(...args: Parameters<T>): void {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Capitalizes the first letter of a string
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Generates a unique ID
 * @returns Unique ID string
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Extracts initials from a name
 * @param name - Full name to extract initials from
 * @param maxLength - Maximum number of initials to return (default: 2)
 * @returns Initials in uppercase
 */
export function getInitials(name: string, maxLength: number = 2): string {
  if (!name) return '';
  return name.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, maxLength)
    .toUpperCase();
}

/**
 * Formats a date for display with fallback for null/undefined
 * @param date - Date to format (string, Date, null, or undefined)
 * @param options - Formatting options
 * @param fallback - Fallback text when date is invalid (default: "No deadline")
 * @returns Formatted date string or fallback
 */
export function formatDateWithFallback(
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  fallback: string = "No deadline"
): string {
  if (!date) return fallback;
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return fallback;
  
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options
  });
}

/**
 * Truncates a string with ellipsis
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 1) + '…';
}

/**
 * Formats an end date for display as human-readable relative time or formatted date
 * @param endDate - Date string to format
 * @param showRelative - Whether to show relative time (default: true)
 * @returns Formatted date string
 */
export function formatEndDate(endDate: string | null | undefined, showRelative: boolean = true): string {
  if (!endDate) return "No deadline";

  const date = new Date(endDate);
  if (Number.isNaN(date.getTime())) return "No deadline";

  if (showRelative) {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();

    if (diffMs < 0) return "Ended";

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMinutes < 60) {
      return diffMinutes === 1 ? "Help needed in next 1 minute" : `Help needed in next ${diffMinutes} minutes`;
    }
    
    if (diffHours < 24) {
      return diffHours === 1 ? "Help needed in next 1 hour" : `Help needed in next ${diffHours} hours`;
    }
  }

  // Fallback to formatted date
  return date.toLocaleDateString(undefined, { 
    month: "short", 
    day: "numeric", 
    year: "numeric" 
  });
}

// Add more shared utilities as needed