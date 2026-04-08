import { describe, expect, test } from 'vitest';
import type { AskContact, HelpCategory } from '@/features/requests/components/HelpRequestDialog';
import {
  SUMMARY_MAX_LENGTH,
  filterSelectableContacts,
  getShortDescriptionPlaceholder,
  getVisibleCategories,
  validateHelpRequest,
} from './help-request-dialog';

const categories: HelpCategory[] = [
  { value: 'introduction', label: 'Introduction' },
  { value: 'connect', label: 'Connect' },
  { value: 'endorse', label: 'Endorse' },
  { value: 'feedback', label: 'Feedback' },
];

const contacts: AskContact[] = [
  { id: '1', name: 'Jen Wu', role: 'Design Director' },
  { id: '2', name: 'Marcus Bell', role: 'Product Leader' },
];

describe('help-request-dialog utils', () => {
  test('hides categories based on ask mode', () => {
    expect(getVisibleCategories(categories, 'contact').map((category) => category.value)).toEqual([
      'introduction',
      'connect',
      'endorse',
      'feedback',
    ]);
    expect(getVisibleCategories(categories, 'circle').map((category) => category.value)).toEqual([
      'endorse',
      'feedback',
    ]);
    expect(getVisibleCategories(categories, 'community').map((category) => category.value)).toEqual([
      'feedback',
    ]);
  });

  test('filters selectable contacts by query and excluded ids', () => {
    const filtered = filterSelectableContacts(contacts, 'product', ['1']);
    expect(filtered.map((contact) => contact.id)).toEqual(['2']);
  });

  test('returns category-specific placeholders', () => {
    expect(getShortDescriptionPlaceholder('opportunity', 'hire')).toBe(
      "e.g. We're looking to hire a…",
    );
    expect(getShortDescriptionPlaceholder('opportunity', 'get-hired')).toBe(
      "e.g. I'm looking for a new role in…",
    );
    expect(getShortDescriptionPlaceholder(undefined, 'hire')).toBe(
      'Enter a short descriptive title…',
    );
  });

  test('validates required create fields, including contact selection and title length', () => {
    const errors = validateHelpRequest({
      isEdit: false,
      askMode: 'contact',
      selectedContacts: [],
      shortDescription: 'x'.repeat(SUMMARY_MAX_LENGTH + 1),
      requestDetails: '   ',
      requestCategories: [],
    });

    expect(errors).toEqual({
      contacts: 'Please add at least one contact',
      shortDescription: 'Title must be 60 characters or less',
      requestDetails: 'Please add some context',
      requestCategories: 'Please select at least one category',
    });
  });

  test('skips create-only validation rules in edit mode', () => {
    const errors = validateHelpRequest({
      isEdit: true,
      askMode: 'contact',
      selectedContacts: [],
      shortDescription: 'x'.repeat(SUMMARY_MAX_LENGTH + 1),
      requestDetails: 'Detailed context',
      requestCategories: ['feedback'],
    });

    expect(errors).toEqual({});
  });
});
