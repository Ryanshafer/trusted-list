import { describe, expect, test } from 'vitest';
import {
  filterAndSortCards,
  getInitialTierIndex,
  getGreetingTargetIndex,
  getDaysLeftInMonth
} from './dashboard-utils';

describe('dashboard-utils', () => {
  describe('filterAndSortCards', () => {
    const mockCards = [
      {
        id: '1',
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        name: 'Card A'
      },
      {
        id: '2',
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        name: 'Card B'
      },
      {
        id: '3',
        endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago (expired)
        name: 'Card C'
      },
      {
        id: '4',
        endDate: undefined, // No deadline
        name: 'Card D'
      }
    ];

    test('filters out expired cards', () => {
      const result = filterAndSortCards(mockCards as any);
      expect(result.length).toBe(3); // Should exclude Card C
      expect(result.some(card => card.id === '3')).toBe(false);
    });

    test('sorts cards by deadline (soonest first)', () => {
      const result = filterAndSortCards(mockCards as any);
      expect(result[0].id).toBe('2'); // 2 days from now (soonest)
      expect(result[1].id).toBe('1'); // 5 days from now
      expect(result[2].id).toBe('4'); // No deadline (goes to end)
    });

    test('handles empty array', () => {
      const result = filterAndSortCards([]);
      expect(result).toEqual([]);
    });
  });

  describe('getInitialTierIndex', () => {
    test('returns correct tier for score ranges', () => {
      expect(getInitialTierIndex(299)).toBe(0);  // Emerging
      expect(getInitialTierIndex(300)).toBe(1);  // Reliable
      expect(getInitialTierIndex(499)).toBe(1);  // Reliable
      expect(getInitialTierIndex(500)).toBe(2);  // Trustworthy
      expect(getInitialTierIndex(699)).toBe(2);  // Trustworthy
      expect(getInitialTierIndex(700)).toBe(3);  // Proven
      expect(getInitialTierIndex(899)).toBe(3);  // Proven
      expect(getInitialTierIndex(900)).toBe(4);  // Stellar
      expect(getInitialTierIndex(1000)).toBe(4); // Stellar
    });
  });

  describe('getGreetingTargetIndex', () => {
    // Note: This test might need mocking of Date depending on test environment
    test('returns correct index based on time of day', () => {
      const result = getGreetingTargetIndex();
      expect([0, 1, 2]).toContain(result); // Should be 0, 1, or 2
    });
  });

  describe('getDaysLeftInMonth', () => {
    test('returns correct days left in month', () => {
      const result = getDaysLeftInMonth();
      const today = new Date();
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const expectedDays = lastDayOfMonth.getDate() - today.getDate();
      expect(result).toBe(expectedDays);
    });

    test('handles end of month correctly', () => {
      // Mock today as last day of month
      const mockDate = new Date('2023-01-31'); // January 31st
      vi.setSystemTime(mockDate);
      
      const result = getDaysLeftInMonth();
      expect(result).toBe(0); // Should be 0 days left
      
      vi.useRealTimers(); // Clean up
    });
  });
});