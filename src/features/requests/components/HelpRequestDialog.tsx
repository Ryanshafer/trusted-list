"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Loader2, X } from "lucide-react";
import { BaseDialog } from "@/components/BaseDialog";
import {
  InteractiveStepper,
  InteractiveStepperItem,
  InteractiveStepperTitle,
  InteractiveStepperTrigger,
  type IStepperMethods,
} from "@/components/ui/interactive-stepper";
import {
  DEFAULT_ASK_MODE,
  REQUEST_DETAILS_MIN_LENGTH,
  filterSelectableContacts,
  getShortDescriptionPlaceholder,
  getVisibleCategories,
  type DialogErrors,
  type CreateFormState,
  type EditFormState,
  validateHelpRequest,
} from "@/features/requests/utils/help-request-dialog";
import { useCategoryContextState } from "@/features/requests/hooks/useCategoryContextState";
import {
  Fade,
  contentTransition,
  ContactSearchInput,
  CategoryGrid,
  CategorySection,
  DueDateSection,
  ShortDescriptionSection,
  RequestDetailsSection,
  CategoryContextFields,
  getContextStepTitle,
  categoryHasContextStep,
  categoryRequiresContextStep,
} from "@/features/requests/components/help-request-dialog";
import categoriesData from "../../../../data/categories.json";

// ── Shared types ──────────────────────────────────────────────────────────────

export type AskContact = {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
};

export type HelpCategory = {
  value: string;
  label: string;
};

export type AskMode = "contact" | "circle" | "community";

export type CreatePayload = {
  shortDescription: string;
  requestDetails: string;
  requestCategories: string[];
  askMode: AskMode;
  selectedContacts: AskContact[];
  introductionTarget?: AskContact;
  vouchSkill?: string;
  connectCompany?: string;
  feedbackLink?: string;
  feedbackFile?: File;
  dueDate?: Date;
};

export type EditPayload = {
  shortDescription: string;
  requestDetails: string;
  requestCategories: string[];
  askMode: AskMode;
  dueDate?: Date;
};

// ── Category data ─────────────────────────────────────────────────────────────

/**
 * Special category only available when requesting a connection from CircleModal.
 * Not included in HELP_CATEGORIES so it never appears in the normal creation flow.
 */
export const REQUEST_CONNECTION_CATEGORY: HelpCategory = {
  value: "request-connection",
  label: "Request Connection",
};

/** Used by the create flow (AskForHelpDialog / AppShell) */
export const HELP_CATEGORIES: HelpCategory[] = [
  { value: "feedback", label: "Feedback" },
  { value: "help-advice", label: "Help & Advice" },
  { value: "introduction", label: "Introduction" },
  { value: "mentorship", label: "Mentorship" },
  { value: "opportunity", label: "Job Opportunity" },
  { value: "endorse", label: "Recommendation" },
];

/** Used by the edit flow — matches the category keys stored in request data */
export const REQUEST_CATEGORIES: HelpCategory[] = categoriesData.categories.map((category) => ({
  value: category.slug,
  label: category.displayName,
}));

export const ASK_OPTIONS: { value: AskMode; label: string; subtitle: string }[] = [
  { value: "contact", label: "My contact", subtitle: "Sent privately to one or more of your contacts" },
  { value: "circle", label: "My circle", subtitle: "Open to anyone in your trusted network" },
  { value: "community", label: "The Trusted List", subtitle: "Open to everyone in the community" },
];

const resizeTransition = {
  duration: 0.25,
  ease: [0.16, 1, 0.3, 1],
} as const;

// ── Step management ───────────────────────────────────────────────────────────

type StepId = "who" | "category" | "context" | "details";


function getCreateFormState(props: CreateProps): CreateFormState {
  return {
    shortDescription: props.initialSummary ?? "",
    requestDetails: props.initialDetails ?? "",
    requestCategories: props.initialCategories ?? [],
    selectedContacts: props.initialSelectedContacts ?? [],
    vouchType: props.initialVouchType ?? "",
  };
}

function getEditFormState(props: EditProps): EditFormState {
  return {
    shortDescription: props.initialSummary ?? "",
    requestDetails: props.initialDetails ?? "",
    requestCategories: props.initialCategories ?? [],
    askMode: props.initialAskMode ?? DEFAULT_ASK_MODE,
    dueDate: props.initialDueDate,
  };
}

// ── Component props ───────────────────────────────────────────────────────────

type BaseProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: HelpCategory[];
};

type CreateProps = BaseProps & {
  mode: "create";
  contacts: AskContact[];
  userUnvouchedSkills?: string[];
  companies?: string[];
  initialCategories?: string[];
  initialSelectedContacts?: AskContact[];
  initialSummary?: string;
  initialDetails?: string;
  initialVouchType?: "myself" | "skill";
  /** When true, renders a simplified "request to connect" flow with custom title/context label */
  connectRequestMode?: boolean;
  /** Dialog title override — used with connectRequestMode */
  overrideTitle?: string;
  onSubmit?: (payload: CreatePayload) => void;
};

type EditProps = BaseProps & {
  mode: "edit";
  contacts?: AskContact[];
  initialSummary?: string;
  initialDetails?: string;
  initialCategories?: string[];
  initialDueDate?: Date;
  initialAskMode?: AskMode;
  onSubmit?: (payload: EditPayload) => void;
};

type Props = CreateProps | EditProps;

// ── Component ─────────────────────────────────────────────────────────────────

export function HelpRequestDialog(props: Props) {
  const { open, onOpenChange, categories } = props;
  const isEdit = props.mode === "edit";
  const createProps = props.mode === "create" ? props : undefined;
  const editProps = props.mode === "edit" ? props : undefined;
  const isConnectRequest = !isEdit && createProps?.connectRequestMode === true;

  // ── Form state ──────────────────────────────────────────────────────────────

  const [shortDescription, setShortDescription] = React.useState(props.initialSummary ?? "");
  const [requestDetails, setRequestDetails] = React.useState(props.initialDetails ?? "");
  const [requestCategories, setRequestCategories] = React.useState<string[]>(props.initialCategories ?? []);
  const [dueDate, setDueDate] = React.useState<Date | undefined>(
    props.mode === "edit" ? props.initialDueDate : undefined,
  );
  const [askMode, setAskMode] = React.useState<AskMode | "">(
    props.mode === "edit" ? props.initialAskMode ?? DEFAULT_ASK_MODE : "",
  );
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedContacts, setSelectedContacts] = React.useState<AskContact[]>([]);
  const [sendState, setSendState] = React.useState<"idle" | "sending" | "success">("idle");

  const [categoryOpen, setCategoryOpen] = React.useState(false);
  const [detailsExpanded, setDetailsExpanded] = React.useState(false);
  const [dueDatePickerOpen, setDueDatePickerOpen] = React.useState(false);
  const [errors, setErrors] = React.useState<DialogErrors>({});

  // ── Step state ──────────────────────────────────────────────────────────────

  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const shouldReduceMotion = useReducedMotion();

  const selectedCategory = requestCategories[0];
  const categoryContext = useCategoryContextState(selectedCategory);
  const {
    introSearchTerm, selectedIntroContact,
    opportunityIntent, vouchType, setVouchType, mentorshipDuration,
    vouchSkill, setVouchSkill, connectCompany,
    feedbackAttachment, feedbackLink, feedbackFile,
    resetVouch, resetIntroduction, resetConnect, resetAllOnDialogClose,
  } = categoryContext;

  const userUnvouchedSkills = createProps?.userUnvouchedSkills ?? [];
  const companies = createProps?.companies ?? [];

  const visibleCategories = getVisibleCategories(categories, (askMode || DEFAULT_ASK_MODE) as AskMode);

  const hasPrefilledContact = (createProps?.initialSelectedContacts?.length ?? 0) > 0;
  const hasPrefilledCategory = props.mode === "create" && (createProps?.initialCategories?.length ?? 0) > 0;

  const shouldAutoFocusSearch = !hasPrefilledContact;

  const contacts = props.contacts ?? [];

  const categoryTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  const stepperRef = React.useRef<HTMLDivElement & IStepperMethods>(null);
  const resizeObserverRef = React.useRef<ResizeObserver | null>(null);
  const [contentHeight, setContentHeight] = React.useState<number | null>(null);

  const resizeMeasureRef = React.useCallback((el: HTMLDivElement | null) => {
    resizeObserverRef.current?.disconnect();
    resizeObserverRef.current = null;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setContentHeight(entry.contentRect.height);
    });
    observer.observe(el);
    resizeObserverRef.current = observer;
  }, []);

  const activeSteps = React.useMemo((): StepId[] => {
    if (isEdit || isConnectRequest) return ["details"];
    const steps: StepId[] = [];
    if (!hasPrefilledContact) steps.push("who");
    if (!hasPrefilledCategory || categoryRequiresContextStep(selectedCategory)) steps.push("category");
    steps.push("details");
    return steps;
  }, [isEdit, isConnectRequest, hasPrefilledContact, hasPrefilledCategory, selectedCategory]);

  const safeStepIndex = Math.min(currentStepIndex, activeSteps.length - 1);
  const currentStep = activeSteps[safeStepIndex] ?? "details";
  const isLastStep = safeStepIndex >= activeSteps.length - 1;
  const isFirstStep = safeStepIndex === 0;

  // ── Derived summary labels ──────────────────────────────────────────────────

  const whoSummaryLabel = React.useMemo(() => {
    if (askMode === "circle") return "My circle";
    if (askMode === "community") return "The Trusted List";
    if (selectedContacts.length === 1) return selectedContacts[0].name;
    if (selectedContacts.length > 1) return `${selectedContacts[0].name} +${selectedContacts.length - 1}`;
    return "My contact";
  }, [askMode, selectedContacts]);

  const categorySummaryLabel = React.useMemo(() => {
    return visibleCategories.find((c) => c.value === selectedCategory)?.label ?? selectedCategory ?? "";
  }, [visibleCategories, selectedCategory]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const clearError = React.useCallback((key: keyof DialogErrors) => {
    setErrors((current) => {
      if (!current[key]) return current;
      return { ...current, [key]: undefined };
    });
  }, []);

  // ── Re-sync initial values each time the dialog opens ──────────────────────

  React.useEffect(() => {
    if (!open) return;
    setCurrentStepIndex(0);
    if (props.mode === "edit") {
      const nextState = getEditFormState(props);
      setShortDescription(nextState.shortDescription);
      setRequestDetails(nextState.requestDetails);
      setRequestCategories(nextState.requestCategories);
      setDueDate(nextState.dueDate);
      setAskMode(nextState.askMode);
    } else {
      const nextState = getCreateFormState(props);
      setShortDescription(nextState.shortDescription);
      setRequestDetails(nextState.requestDetails);
      setRequestCategories(nextState.requestCategories);
      setSelectedContacts(nextState.selectedContacts);
      setVouchSkill(null);
      setVouchType(nextState.vouchType);
    }
    setErrors({});
    setCategoryOpen(false);
    setDueDatePickerOpen(false);
  }, [
    open,
    props.mode,
    createProps?.initialCategories,
    createProps?.initialDetails,
    createProps?.initialSelectedContacts,
    createProps?.initialSummary,
    createProps?.initialVouchType,
    editProps?.initialAskMode,
    editProps?.initialCategories,
    editProps?.initialDetails,
    editProps?.initialDueDate,
    editProps?.initialSummary,
  ]);

  // ── Filtered contacts ───────────────────────────────────────────────────────

  const filteredContacts = React.useMemo(() => {
    return filterSelectableContacts(
      contacts,
      searchTerm,
      selectedContacts.map((c) => c.id),
    );
  }, [contacts, searchTerm, selectedContacts]);

  const filteredIntroContacts = React.useMemo(() => {
    return filterSelectableContacts(
      contacts,
      introSearchTerm,
      selectedIntroContact ? [selectedIntroContact.id] : [],
    );
  }, [contacts, introSearchTerm, selectedIntroContact]);

  // ── Category/mode side-effects ──────────────────────────────────────────────

  // Category-specific sub-fields reset themselves on category change inside
  // useCategoryContextState; this effect only owns the askMode-driven resets.
  React.useEffect(() => {
    if (askMode !== "contact") {
      if (selectedCategory === "introduction") setRequestCategories([]);
      if (selectedCategory === "connect") setRequestCategories([]);
      resetIntroduction();
      resetConnect();
    }
    if (askMode === "community") {
      if (selectedCategory === "endorse") setRequestCategories([]);
      resetVouch();
    }
  }, [askMode, selectedCategory, resetIntroduction, resetConnect, resetVouch]);

  // ── Step navigation ─────────────────────────────────────────────────────────

  const validateStep = (step: StepId): DialogErrors => {
    if (step === "who") {
      if (!askMode) return { askMode: "Please select who you're asking" };
      if (askMode === "contact" && selectedContacts.length === 0) return { contacts: "Please add at least one contact" };
    }
    if (step === "category") {
      if (requestCategories.length === 0) return { requestCategories: "Please select a category" };
      const cat = requestCategories[0];
      if (cat === "opportunity" && !opportunityIntent) return { context: "Please select an opportunity type" };
      if (cat === "mentorship" && !mentorshipDuration) return { context: "Please select a duration" };
      if ((cat === "vouch" || cat === "recommend") && !vouchType) return { context: "Please select what to vouch for" };
    }
    return {};
  };

  const goNext = () => {
    const errs = validateStep(currentStep);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setCurrentStepIndex((i) => i + 1);
  };

  const goBack = () => {
    setErrors({});
    setCurrentStepIndex((i) => Math.max(0, i - 1));
  };

  const goToStep = (step: StepId) => {
    const idx = activeSteps.indexOf(step);
    if (idx !== -1 && idx < safeStepIndex) {
      setErrors({});
      setCurrentStepIndex(idx);
    }
  };

  React.useEffect(() => {
    stepperRef.current?.goToStep(safeStepIndex + 1);
  }, [safeStepIndex]);

  // ── Open/close ──────────────────────────────────────────────────────────────

  const handleOpenChange = (value: boolean) => {
    if (!value && !isEdit) {
      setShortDescription("");
      setAskMode("");
      setSearchTerm("");
      setSelectedContacts([]);
      setRequestCategories([]);
      setRequestDetails("");
      setSendState("idle");
      setDueDate(undefined);
      resetAllOnDialogClose();
    }
    if (!value) {
      setErrors({});
      setCategoryOpen(false);
      setDueDatePickerOpen(false);
      setDetailsExpanded(false);
    }
    onOpenChange(value);
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = () => {
    if (!isEdit && sendState !== "idle") return;

    if (isConnectRequest) {
      const nextErrors: DialogErrors = {};
      if (!requestDetails.trim()) {
        nextErrors.requestDetails = "Please add some context";
      } else if (requestDetails.trim().length < REQUEST_DETAILS_MIN_LENGTH) {
        nextErrors.requestDetails = `Please add at least ${REQUEST_DETAILS_MIN_LENGTH} characters`;
      }
      if (Object.keys(nextErrors).length > 0) { setErrors(nextErrors); return; }
      setErrors({});
    } else {
      const newErrors = validateHelpRequest({
        isEdit,
        askMode: askMode as AskMode,
        selectedContacts,
        shortDescription,
        requestDetails,
        requestCategories,
      });
      if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
      setErrors({});
    }

    if (props.mode === "edit") {
      props.onSubmit?.({
        shortDescription: shortDescription.trim(),
        requestDetails: requestDetails.trim(),
        requestCategories: [...requestCategories],
        askMode: askMode as AskMode,
        dueDate,
      });
      handleOpenChange(false);
    } else if (isConnectRequest) {
      props.onSubmit?.({
        shortDescription: (createProps?.overrideTitle ?? shortDescription).trim(),
        requestDetails: requestDetails.trim(),
        requestCategories: ["request-connection"],
        askMode: "contact",
        selectedContacts: [...selectedContacts],
        dueDate: undefined,
      });
      handleOpenChange(false);
    } else {
      setSendState("sending");
      props.onSubmit?.({
        shortDescription: shortDescription.trim(),
        requestDetails: requestDetails.trim(),
        requestCategories: [...requestCategories],
        askMode: askMode as AskMode,
        selectedContacts: [...selectedContacts],
        introductionTarget: selectedIntroContact ?? undefined,
        vouchSkill: vouchSkill ?? undefined,
        connectCompany: connectCompany ?? undefined,
        feedbackLink: feedbackAttachment === "link" && feedbackLink ? feedbackLink : undefined,
        feedbackFile: feedbackAttachment === "file" && feedbackFile ? feedbackFile : undefined,
        dueDate,
      });
      setTimeout(() => {
        setSendState("success");
        setTimeout(() => handleOpenChange(false), 900);
      }, 1200);
    }
  };

  React.useEffect(() => {
    if (!isEdit && sendState === "success") {
      try { localStorage.setItem("interactions-active-tab", "my-requests"); } catch { /* no-op */ }
      window.location.href = "/trusted-list/interactions?tab=my-requests#my-requests";
    }
  }, [sendState, isEdit]);

  // ── Dialog meta ─────────────────────────────────────────────────────────────

  const dialogTitle = isConnectRequest
    ? (createProps?.overrideTitle ?? "Request to connect")
    : isEdit
    ? "Edit your request"
    : "Ask for help";

  const dialogDescription = isConnectRequest
    ? "Add context so they know why you're reaching out."
    : isEdit
    ? "Update your need, category, or timeframe."
    : "Choose who to ask, what kind of help you need, and share the details.";

  // ── Context step content (category-specific) ────────────────────────────────

  const renderContextContent = () => (
    <CategoryContextFields
      categoryContext={categoryContext}
      filteredIntroContacts={filteredIntroContacts}
      companies={companies}
      userUnvouchedSkills={userUnvouchedSkills}
      clearError={clearError}
    />
  );

  // ── Step content renderer ───────────────────────────────────────────────────

  const renderStepContent = () => {
    // ── Edit mode: single flat form ──────────────────────────────────────────
    if (isEdit) {
      return (
        <div className="flex flex-col gap-8">
          {/* Who */}
          <div className="space-y-3">
            <p className="text-base font-semibold text-foreground">Who do you want to ask?</p>
            <div className="flex gap-3">
              {ASK_OPTIONS.map((option) => {
                const selected = askMode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAskMode(option.value)}
                    className={`flex h-20 flex-1 flex-col justify-center overflow-hidden rounded-lg border px-3 py-4 text-left transition-colors ${
                      selected ? "border-primary bg-primary-25" : "border-border-75 bg-muted/20 hover:bg-muted-50"
                    }`}
                  >
                    <div className="flex w-full items-start gap-2">
                      <div className={`mt-px h-4 w-4 shrink-0 rounded-full border-2 transition-colors ${selected ? "border-primary bg-primary" : "border-muted-foreground bg-transparent"}`}>
                        {selected && <div className="m-auto mt-[3px] h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                      </div>
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className={`text-sm font-semibold leading-tight ${selected ? "text-accent-foreground" : "text-foreground"}`}>{option.label}</span>
                        <span className="text-xs leading-snug text-muted-foreground">{option.subtitle}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category */}
          <CategorySection
            errors={errors}
            categoryOpen={categoryOpen}
            requestCategories={requestCategories}
            visibleCategories={visibleCategories}
            categoryTriggerRef={categoryTriggerRef}
            onCategoryOpenChange={(open) => { setCategoryOpen(open); if (open) clearError("requestCategories"); }}
            onCategoryChange={(value) => { setRequestCategories(value); setCategoryOpen(false); if (value.length > 0) clearError("requestCategories"); }}
          />

          {/* Short description */}
          <ShortDescriptionSection
            value={shortDescription}
            onChange={(v) => { setShortDescription(v); clearError("shortDescription"); }}
            error={errors.shortDescription}
            placeholder={getShortDescriptionPlaceholder(selectedCategory, (opportunityIntent || "get-hired") as "hire" | "get-hired")}
          />

          {/* Request details */}
          <RequestDetailsSection
            value={requestDetails}
            onChange={(v) => { setRequestDetails(v); clearError("requestDetails"); }}
            error={errors.requestDetails}
            placeholder="Share what someone needs to know to help you."
            detailsExpanded={detailsExpanded}
            onToggleExpand={() => setDetailsExpanded((v) => !v)}
            showLabel
          />

          {/* Due date */}
          {!detailsExpanded && (
            <DueDateSection
              dueDate={dueDate}
              dueDatePickerOpen={dueDatePickerOpen}
              onDueDatePickerOpenChange={setDueDatePickerOpen}
              onDueDateChange={setDueDate}
            />
          )}
        </div>
      );
    }

    // ── Connect request mode ─────────────────────────────────────────────────
    if (isConnectRequest) {
      return (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <p className="text-base font-normal text-secondary-foreground">How do you know this person?</p>
            <span
              aria-live="polite"
              className={`text-xs tabular-nums transition-colors ${
                requestDetails.trim().length >= REQUEST_DETAILS_MIN_LENGTH ? "text-emerald-600" : "text-muted-foreground"
              }`}
            >
              {requestDetails.trim().length}/{REQUEST_DETAILS_MIN_LENGTH}
            </span>
          </div>
          {errors.requestDetails && <p className="text-xs text-destructive">{errors.requestDetails}</p>}
          <Textarea
            placeholder="Share what someone needs to know to help you."
            className={`h-[7.5rem] resize-none rounded-lg bg-background placeholder:text-muted-foreground shadow-none focus-visible:ring-1 focus-visible:ring-offset-0 ${errors.requestDetails ? "border-destructive" : "border-border"}`}
            value={requestDetails}
            onChange={(e) => { setRequestDetails(e.target.value); clearError("requestDetails"); }}
          />
        </div>
      );
    }

    // ── Create step flow ─────────────────────────────────────────────────────

    switch (currentStep) {
      case "who":
        return (
          <div>
            {errors.askMode && <p className="text-xs text-destructive mb-3">{errors.askMode}</p>}
            <div className="flex gap-3">
              {ASK_OPTIONS.map((option) => {
                const selected = askMode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => { setAskMode(option.value); clearError("askMode"); clearError("contacts"); }}
                    className={`flex h-20 flex-1 flex-col justify-center overflow-hidden rounded-lg border px-3 py-4 text-left transition-colors ${
                      selected ? "border-primary bg-primary-25" : "border-border-75 bg-muted/20 hover:bg-muted-50"
                    }`}
                  >
                    <div className="flex w-full items-start gap-2">
                      <div className={`mt-px h-4 w-4 shrink-0 rounded-full border-2 transition-colors ${selected ? "border-primary bg-primary" : "border-muted-foreground bg-transparent"}`}>
                        {selected && <div className="m-auto mt-[3px] h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                      </div>
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className={`text-sm font-semibold leading-tight ${selected ? "text-accent-foreground" : "text-foreground"}`}>{option.label}</span>
                        <span className="text-xs leading-snug text-muted-foreground">{option.subtitle}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <AnimatePresence initial={false}>
              {askMode === "contact" && (
                <Fade key="contact-search" className="space-y-2 px-1 pt-3">
                  {errors.contacts && <p className="text-xs text-destructive">{errors.contacts}</p>}
                  <ContactSearchInput
                    placeholder="Search contacts by name or skill…"
                    autoFocus={shouldAutoFocusSearch}
                    inputClassName={errors.contacts ? "border-destructive" : "border-primary"}
                    searchTerm={searchTerm}
                    filteredContacts={filteredContacts}
                    onSearchChange={(v) => { setSearchTerm(v); clearError("contacts"); }}
                    onSelect={(contact) => { setSelectedContacts((prev) => [...prev, contact]); setSearchTerm(""); clearError("contacts"); }}
                  />
                  <div className="flex min-h-9 flex-wrap gap-3 px-1 pb-2 pt-1">
                    {selectedContacts.map((contact) => (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => setSelectedContacts((prev) => prev.filter((c) => c.id !== contact.id))}
                        aria-label={`Remove ${contact.name}`}
                        className="flex items-center gap-1.5 rounded-full border border-border bg-muted-25 px-3 py-1 text-sm font-semibold leading-none text-foreground shadow-sm transition-colors hover:border-destructive/40 hover:bg-accent hover:text-destructive"
                      >
                        {contact.name}
                        <X className="h-3 w-3 opacity-50" />
                      </button>
                    ))}
                  </div>
                </Fade>
              )}
            </AnimatePresence>
          </div>
        );

      case "category":
        return (
          <div className="space-y-5">
            <CategoryGrid
              visibleCategories={visibleCategories}
              requestCategories={requestCategories}
              onCategoryChange={(value) => {
                setRequestCategories(value);
                if (value.length > 0) clearError("requestCategories");
              }}
              errors={errors}
            />
            <AnimatePresence mode="wait" initial={false}>
              {categoryHasContextStep(selectedCategory) && (
                <Fade key={selectedCategory} className="space-y-2 border-t border-border pt-4">
                  <p className="text-sm font-medium text-foreground">{getContextStepTitle(selectedCategory)}</p>
                  {errors.context && <p className="text-xs text-destructive">{errors.context}</p>}
                  {renderContextContent()}
                </Fade>
              )}
            </AnimatePresence>
          </div>
        );

      case "details":
        return (
          <div className="space-y-8 mt-4 mb-6">
            {/* Short description */}
            {!detailsExpanded && (
              <ShortDescriptionSection
                value={shortDescription}
                onChange={(v) => { setShortDescription(v); clearError("shortDescription"); }}
                error={errors.shortDescription}
                placeholder={getShortDescriptionPlaceholder(selectedCategory, (opportunityIntent || "get-hired") as "hire" | "get-hired")}
              />
            )}

            {/* Request details */}
            <RequestDetailsSection
              value={requestDetails}
              onChange={(v) => { setRequestDetails(v); clearError("requestDetails"); }}
              error={errors.requestDetails}
              placeholder={
                selectedCategory === "help-advice"
                  ? "Ask for help thinking through something:\n• A decision you're weighing\n• A challenge at work\n• Getting perspective on someone\n• How others have handled a similar situation"
                  : "Share what someone needs to know to help you."
              }
              detailsExpanded={detailsExpanded}
              onToggleExpand={() => setDetailsExpanded((v) => !v)}
              showLabel={!detailsExpanded}
            />

            {/* Due date */}
            {!detailsExpanded && (
              <DueDateSection
                dueDate={dueDate}
                dueDatePickerOpen={dueDatePickerOpen}
                onDueDatePickerOpenChange={setDueDatePickerOpen}
                onDueDateChange={setDueDate}
              />
            )}
          </div>
        );
    }
  };

  // ── Footer ──────────────────────────────────────────────────────────────────

  const submitButton = (
    <Button
      className="rounded-full font-semibold"
      onClick={handleSubmit}
      disabled={!isEdit && sendState !== "idle"}
      type="button"
    >
      {isEdit ? (
        <>Save Changes <ArrowRight className="h-4 w-4" /></>
      ) : sendState === "idle" ? (
        isConnectRequest ? <>Send Request <ArrowRight className="h-4 w-4" /></> : <>Request Help <ArrowRight className="h-4 w-4" /></>
      ) : sendState === "sending" ? (
        <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
      ) : (
        <><Check className="h-4 w-4" /> Request Created!</>
      )}
    </Button>
  );

  const footerContent = (
    <div className="flex w-full items-center justify-between">
      <Button
        variant="ghost"
        className="rounded-full font-semibold"
        onClick={() => handleOpenChange(false)}
        type="button"
      >
        Cancel
      </Button>
      <div className="flex items-center gap-3">
        {!isFirstStep && !isEdit && !isConnectRequest && (
          <Button
            variant="ghost"
            className="rounded-full font-semibold"
            onClick={goBack}
            type="button"
          >
            Back
          </Button>
        )}
        {isLastStep ? submitButton : (
          <Button className="rounded-full font-semibold" onClick={goNext} type="button">
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );

  // ── Step progress stepper ───────────────────────────────────────────────────

  const stepperElement = !isEdit && !isConnectRequest && activeSteps.length > 1 ? (
    <div className="border-y-4 px-3 py-3 mb-6">
      <InteractiveStepper ref={stepperRef} defaultValue={1}>
        {activeSteps.map((step, idx) => {
          const stepTitles: Partial<Record<StepId, string>> = {
            who: "Who are you asking?",
            category: "What kind of help?",
            details: "What do you need?",
          };
          const title = stepTitles[step] ?? step;
          const isCompleted = idx < safeStepIndex;
          const isActive = idx === safeStepIndex;
          return (
            <InteractiveStepperItem
              key={step}
              completed={isCompleted}
              disabled={idx > safeStepIndex}
            >
              <InteractiveStepperTrigger
                className="justify-start px-1.5 py-1 shrink-0"
                onClick={() => {
                  if (isCompleted) {
                    setCurrentStepIndex(idx);
                    setErrors({});
                  }
                }}
              >
                <div className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isActive
                    ? "bg-card text-primary outline outline-1 outline-primary outline-offset-2"
                    : "border border-input bg-background text-muted-foreground"
                }`}>
                  {isCompleted ? <Check className="h-4 w-4" /> : idx + 1}
                </div>
                <InteractiveStepperTitle className={`leading-none font-semibold ${
                  isCompleted
                    ? "text-foreground"
                    : isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}>{title}</InteractiveStepperTitle>
              </InteractiveStepperTrigger>
            </InteractiveStepperItem>
          );
        })}
      </InteractiveStepper>
    </div>
  ) : null;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <BaseDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={dialogTitle}
      description={dialogDescription}
      size="2xl"
      footerContent={footerContent}
      contentClassName="pt-2"
    >
      <div className="flex flex-col overflow-x-hidden">
        {stepperElement}
        <motion.div
          animate={{ height: contentHeight ?? "auto" }}
          transition={resizeTransition}
          className="mb-4 overflow-hidden"
        >
          <div ref={resizeMeasureRef}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${currentStep}-${safeStepIndex}`}
                initial={shouldReduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={contentTransition}
                className="px-1 py-1"
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </BaseDialog>
  );
}

// Backward-compatible alias — preserves the onSendRequest prop name used by existing callers
export const AskForHelpDialog = ({
  open,
  onOpenChange,
  contacts,
  userUnvouchedSkills,
  companies,
  initialCategories,
  onSendRequest,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: AskContact[];
  userUnvouchedSkills?: string[];
  companies?: string[];
  initialCategories?: string[];
  onSendRequest?: (payload: CreatePayload) => void;
}) => (
  <HelpRequestDialog
    mode="create"
    open={open}
    onOpenChange={onOpenChange}
    contacts={contacts}
    userUnvouchedSkills={userUnvouchedSkills}
    companies={companies}
    initialCategories={initialCategories}
    categories={HELP_CATEGORIES}
    onSubmit={onSendRequest}
  />
);
