import type { AskContact, AskMode, HelpCategory } from "@/features/requests/components/HelpRequestDialog";

export type DialogErrors = {
  contacts?: string;
  shortDescription?: string;
  requestDetails?: string;
  requestCategories?: string;
};

export type CreateFormState = {
  shortDescription: string;
  requestDetails: string;
  requestCategories: string[];
  selectedContacts: AskContact[];
  vouchType: "myself" | "skill";
};

export type EditFormState = {
  shortDescription: string;
  requestDetails: string;
  requestCategories: string[];
  askMode: AskMode;
  dueDate?: Date;
};

export const DEFAULT_ASK_MODE: AskMode = "contact";
export const SUMMARY_MAX_LENGTH = 60;

export function getVisibleCategories(
  categories: HelpCategory[],
  askMode: AskMode,
) {
  return categories.filter((category) => {
    if (category.value === "introduction" && askMode !== "contact") return false;
    if (category.value === "connect" && askMode !== "contact") return false;
    if (category.value === "endorse" && askMode === "community") return false;
    return true;
  });
}

export function filterSelectableContacts(
  contacts: AskContact[],
  query: string,
  excludedIds: string[] = [],
) {
  const normalizedQuery = query.toLowerCase();

  return contacts.filter((contact) => {
    if (excludedIds.includes(contact.id)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return (
      contact.name.toLowerCase().includes(normalizedQuery) ||
      contact.role.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function getShortDescriptionPlaceholder(
  category: string | undefined,
  opportunityIntent: "hire" | "get-hired",
) {
  if (category === "introduction") {
    return "e.g. Can you introduce me to this person?";
  }

  if (category === "opportunity") {
    return opportunityIntent === "get-hired"
      ? "e.g. I'm looking for a new role in…"
      : "e.g. We're looking to hire a…";
  }

  if (category === "help-advice") {
    return "e.g. I'm trying to decide whether to…";
  }

  if (category === "mentorship") {
    return "e.g. I'm looking for an experienced mentor…";
  }

  if (category === "endorse") {
    return "e.g. Would you be willing to endorse me…";
  }

  if (category === "feedback") {
    return "e.g. What do you need to share?";
  }

  return "Enter a short descriptive title…";
}

export function validateHelpRequest({
  isEdit,
  askMode,
  selectedContacts,
  shortDescription,
  requestDetails,
  requestCategories,
}: {
  isEdit: boolean;
  askMode: AskMode;
  selectedContacts: AskContact[];
  shortDescription: string;
  requestDetails: string;
  requestCategories: string[];
}): DialogErrors {
  const nextErrors: DialogErrors = {};

  if (!isEdit && askMode === "contact" && selectedContacts.length === 0) {
    nextErrors.contacts = "Please add at least one contact";
  }

  if (!shortDescription.trim()) {
    nextErrors.shortDescription = "Please enter a short title";
  } else if (!isEdit && shortDescription.trim().length > SUMMARY_MAX_LENGTH) {
    nextErrors.shortDescription = "Title must be 60 characters or less";
  }

  if (!requestDetails.trim()) {
    nextErrors.requestDetails = "Please add some context";
  }

  if (requestCategories.length === 0) {
    nextErrors.requestCategories = "Please select at least one category";
  }

  return nextErrors;
}
