import { describe, expect, test } from 'vitest';
import {
  getNotificationBody,
  memberHref,
  type Notification,
} from './notification-utils';

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'notif-1',
    type: 'direct_help_request',
    read: false,
    relativeTime: '2h ago',
    actor: {
      id: 'actor-1',
      name: 'Jen Wu',
      avatarUrl: null,
      trustedFor: ['Design Leadership'],
    },
    payload: {
      requestTitle: 'Review my portfolio',
    },
    ...overrides,
  };
}

describe('notification-utils', () => {
  test('builds member profile hrefs from names', () => {
    expect(memberHref('Ryan Shafer')).toBe('/trusted-list/members/ryan-shafer');
  });

  test('renders direct help request copy from the request title', () => {
    const body = getNotificationBody(makeNotification());
    expect(body).toBe('sent you a direct request — "Review my portfolio"');
  });

  test('renders recommendation outcomes with known and unknown states', () => {
    const accepted = getNotificationBody(
      makeNotification({
        type: 'recommendation_outcome',
        payload: {
          recommendedName: 'Alicia Gomez',
          outcome: 'accepted',
        },
      }),
    );
    const fallback = getNotificationBody(
      makeNotification({
        type: 'recommendation_outcome',
        payload: {
          recommendedName: 'Alicia Gomez',
          outcome: 'pending',
        },
      }),
    );

    expect(accepted).toBe(
      'Your recommendation of Alicia Gomez has been accepted and joined the platform',
    );
    expect(fallback).toBe(
      'Your recommendation of Alicia Gomez has been reviewed',
    );
  });

  test('renders moderation decisions with the correct message branch', () => {
    const body = getNotificationBody(
      makeNotification({
        type: 'moderation_decision',
        payload: {
          requestTitle: 'Need intros to PMs',
          decision: 'removed',
        },
      }),
    );

    expect(body).toBe(
      'Your request "Need intros to PMs" has been removed for violating community standards',
    );
  });
});
