// Shared Type Definitions
// This file contains types that are used across multiple features

// Example: Base type that could be used by multiple features
export type BaseEntity = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
};

// Example: Common API response type
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// Example: Pagination type
export type Pagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

// Example: Common filter types
export type DateRange = {
  startDate?: string | Date;
  endDate?: string | Date;
};

// Add more shared types as needed