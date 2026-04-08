import { describe, expect, test } from 'vitest';
import {
  allDetails,
  allRequests,
  askContacts,
  categoryDisplayNames,
  profileOpenRequests,
  slugAlias,
  synthesizedProfileDetails,
  topicToCategorySlug,
  trustRatingToTierIndex,
} from './request-detail-data';

describe('request-detail-data', () => {
  test('maps trust rating labels to the expected tier index', () => {
    expect(trustRatingToTierIndex('Emerging')).toBe(0);
    expect(trustRatingToTierIndex('Proven')).toBe(3);
    expect(trustRatingToTierIndex('Missing')).toBe(-1);
  });

  test('builds profile open request cards with the current user label', () => {
    const currentUserRequest = profileOpenRequests.find(
      (request) => request.id === 'req-ryan-1',
    );

    expect(currentUserRequest?.relationshipTag).toBe('Your Request');
  });

  test('keeps all request ids unique after combining request sources', () => {
    const ids = allRequests.map((request) => request.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  test('synthesizes request details for profile-backed requests', () => {
    const detail = synthesizedProfileDetails['req-ryan-1'];

    expect(detail.audience).toBe('My Circle');
    expect(detail.audienceCategory).toBe('Career Advice');
    expect(detail.topics).toEqual(['Career Advice']);
    expect(detail.author).toEqual({
      role: 'Head of Design',
      company: 'The Trusted List',
      connectionDegree: 'You',
      trustedFor: 'Product Design, UX Strategy, Leadership',
    });
    expect(detail.connectionPath.length).toBe(2);
    expect(detail.about.location).toBe('Ostuni, Italy');
    expect(detail.about.trustedExpertise).toBe(
      'Product Design, UX Strategy, Leadership, Design Systems, Research',
    );
    expect(detail.stats).toEqual({
      peopleHelped: 141,
      requests: 76,
      trustRating: 'Trustworthy',
    });
  });

  test('merges synthesized and static request details', () => {
    expect(allDetails['req-ryan-1'].audience).toBe('My Circle');
    expect(allDetails['req-career-1'].audience).toBe('Trusted List');
  });

  test('exposes ask contacts and category lookup maps', () => {
    expect(askContacts[0]?.name).toBe('Alicia Gomez');
    expect(categoryDisplayNames.career).toBe('Career Development');
    expect(topicToCategorySlug['career advice']).toBe('career');
    expect(slugAlias['career-advice']).toBe('career');
  });
});
