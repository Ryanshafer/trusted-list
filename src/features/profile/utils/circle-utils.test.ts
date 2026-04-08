import { describe, expect, test } from 'vitest';
import type { CircleMember } from '../types';
import { filterMembers, sortMembers } from './circle-utils';

const members: CircleMember[] = [
  {
    userId: '1',
    name: 'Jen Wu',
    avatarUrl: null,
    connectionDegree: '1st',
    verifiedSkills: ['Design Leadership'],
  },
  {
    userId: '2',
    name: 'Marcus Bell',
    avatarUrl: null,
    connectionDegree: '2nd',
    verifiedSkills: ['Product Strategy'],
    awaiting: true,
  },
  {
    userId: '3',
    name: 'Anika Osei',
    avatarUrl: null,
    connectionDegree: '1st',
    verifiedSkills: ['Research'],
  },
];

describe('circle-utils', () => {
  test('filters members by name and verified skill', () => {
    expect(filterMembers(members, 'jen').map((member) => member.userId)).toEqual(['1']);
    expect(filterMembers(members, 'strategy').map((member) => member.userId)).toEqual(['2']);
  });

  test('returns the original list when the query is blank', () => {
    expect(filterMembers(members, '   ')).toBe(members);
  });

  test('sorts members alphabetically in ascending and descending order', () => {
    expect(sortMembers(members, 'asc').map((member) => member.name)).toEqual([
      'Anika Osei',
      'Jen Wu',
      'Marcus Bell',
    ]);
    expect(sortMembers(members, 'desc').map((member) => member.name)).toEqual([
      'Marcus Bell',
      'Jen Wu',
      'Anika Osei',
    ]);
  });

  test('keeps awaiting members first in recent order', () => {
    expect(sortMembers(members, 'recent').map((member) => member.userId)).toEqual([
      '2',
      '1',
      '3',
    ]);
  });
});
