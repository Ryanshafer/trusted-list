import { describe, expect, test } from 'vitest';
import type { MyHelpRequest } from '@/features/interactions/utils/data';
import {
  computeMyRequestFilterOptions,
  defaultSidebarFilters,
  filterMyHelpRequests,
  isMyHelpRequestCompleted,
  isMyHelpRequestInProgress,
  isMyHelpRequestPaused,
  sortMyHelpRequestsForDisplay,
  variantToAudienceKey,
} from './interaction-utils';

function makeRequest(overrides: Partial<MyHelpRequest> = {}): MyHelpRequest {
  return {
    id: 'req-1',
    requestSummary: 'Portfolio feedback',
    request: 'Looking for detailed feedback on my portfolio.',
    responses: [],
    status: 'Open',
    type: 'circle',
    category: 'design',
    createdAt: '2026-04-01T00:00:00.000Z',
    promoted: true,
    endDate: '2026-05-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('interaction-utils', () => {
  test('maps non-contact and non-community variants to circle', () => {
    expect(variantToAudienceKey('contact')).toBe('contact');
    expect(variantToAudienceKey('community')).toBe('community');
    expect(variantToAudienceKey('circle')).toBe('circle');
    expect(variantToAudienceKey('custom')).toBe('circle');
  });

  test('derives completed, paused, and in-progress request states', () => {
    const completedContact = makeRequest({
      type: 'contact',
      responses: [
        {
          id: 'resp-1',
          name: 'Jen Wu',
          status: 'Completed',
          chatId: 'chat-1',
        },
      ],
    });
    const pausedCircle = makeRequest({
      promoted: false,
      type: 'circle',
    });
    const activeCommunity = makeRequest({
      type: 'community',
      promoted: true,
    });

    expect(isMyHelpRequestCompleted(completedContact)).toBe(true);
    expect(isMyHelpRequestPaused(pausedCircle)).toBe(true);
    expect(isMyHelpRequestInProgress(activeCommunity)).toBe(true);
  });

  test('filters my help requests by audience, response state, search, and date', () => {
    const requests = [
      makeRequest({
        id: 'contact-match',
        type: 'contact',
        requestSummary: 'Portfolio feedback',
        responses: [
          {
            id: 'resp-1',
            name: 'Jen Wu',
            status: 'In Progress',
            chatId: 'chat-1',
          },
        ],
        endDate: '2026-04-12T00:00:00.000Z',
      }),
      makeRequest({
        id: 'circle-miss',
        type: 'circle',
        requestSummary: 'Hiring help',
        category: 'business',
        responses: [],
        endDate: '2026-05-20T00:00:00.000Z',
      }),
    ];

    const filtered = filterMyHelpRequests(
      requests,
      {
        ...defaultSidebarFilters,
        audiences: ['contact'],
        responses: ['has'],
        dateTo: '2026-04-30T00:00:00.000Z',
      },
      'portfolio',
    );

    expect(filtered.map((request) => request.id)).toEqual(['contact-match']);
  });

  test('sorts open requests ahead of completed ones and undated requests after dated ones', () => {
    const requests = [
      makeRequest({
        id: 'completed',
        status: 'Closed',
        endDate: '2026-04-10T00:00:00.000Z',
      }),
      makeRequest({
        id: 'undated',
        endDate: undefined,
      }),
      makeRequest({
        id: 'soonest',
        endDate: '2026-04-08T00:00:00.000Z',
      }),
    ];

    const sorted = sortMyHelpRequestsForDisplay(requests);
    expect(sorted.map((request) => request.id)).toEqual([
      'soonest',
      'undated',
      'completed',
    ]);
  });

  test('computes filter options from request state and response presence', () => {
    const requests = [
      makeRequest({
        id: 'contact-complete',
        type: 'contact',
        category: 'career',
        responses: [
          {
            id: 'resp-1',
            name: 'Jen Wu',
            status: 'Completed',
            chatId: 'chat-1',
          },
        ],
      }),
      makeRequest({
        id: 'community-paused',
        type: 'community',
        category: 'design',
        promoted: false,
        responses: [],
      }),
    ];

    const result = computeMyRequestFilterOptions(requests);

    expect(result.topics).toEqual(['career', 'design']);
    expect(result.audience).toEqual({
      contact: true,
      circle: false,
      community: true,
    });
    expect(result.statuses).toEqual({
      inProgress: false,
      paused: true,
      completed: true,
    });
    expect(result.responses).toEqual({ none: true, has: true });
  });
});
