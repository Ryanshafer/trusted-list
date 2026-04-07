"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ArrowRight, BicepsFlexed, Briefcase, CalendarPlus2, Check, ContactRound, Link, Loader2, Maximize2, Minimize2, Paperclip, Tag, X } from "lucide-react";
import { BaseDialog } from "@/components/BaseDialog";
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
  { value: "opportunity", label: "Opportunity" },
  { value: "vouch", label: "Vouch" },
];

/** Used by the edit flow — matches the category keys stored in request data */
export const REQUEST_CATEGORIES: HelpCategory[] = categoriesData.categories.map((category) => ({
  value: category.slug,
  label: category.displayName
}));

export const ASK_OPTIONS: { value: AskMode; label: string; subtitle: string }[] = [
  { value: "contact", label: "My contact", subtitle: "Private requests, chosen by you" },
  { value: "circle", label: "My circle", subtitle: "Everyone in your trusted network" },
  { value: "community", label: "The Trusted List", subtitle: "Everyone in the whole community" },
];

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

  const [shortDescription, setShortDescription] = React.useState(
    isEdit ? (props as EditProps).initialSummary ?? "" : ""
  );
  const [requestDetails, setRequestDetails] = React.useState(
    isEdit ? (props as EditProps).initialDetails ?? "" : ""
  );
  const [requestCategories, setRequestCategories] = React.useState<string[]>(
    isEdit
      ? (props as EditProps).initialCategories ?? []
      : (props as CreateProps).initialCategories ?? []
  );
  const [dueDate, setDueDate] = React.useState<Date | undefined>(
    isEdit ? (props as EditProps).initialDueDate : undefined
  );

  const [askMode, setAskMode] = React.useState<AskMode>(
    isEdit ? (props as EditProps).initialAskMode ?? "contact" : "contact"
  );
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedContacts, setSelectedContacts] = React.useState<AskContact[]>([]);
  const [sendState, setSendState] = React.useState<"idle" | "sending" | "success">("idle");

  const [introSearchTerm, setIntroSearchTerm] = React.useState("");
  const [selectedIntroContact, setSelectedIntroContact] = React.useState<AskContact | null>(null);
  const [opportunityIntent, setOpportunityIntent] = React.useState<"hire" | "get-hired">("get-hired");
  const [mentorshipDuration, setMentorshipDuration] = React.useState<"short-term" | "long-term">("short-term");
  const [vouchType, setVouchType] = React.useState<"myself" | "skill">("myself");
  const [vouchSkill, setVouchSkill] = React.useState<string | null>(null);
  const [vouchSkillOpen, setVouchSkillOpen] = React.useState(false);
  const [connectCompany, setConnectCompany] = React.useState<string | null>(null);
  const [connectCompanyOpen, setConnectCompanyOpen] = React.useState(false);
  const [feedbackAttachment, setFeedbackAttachment] = React.useState<"nothing" | "link" | "file">("nothing");
  const [feedbackLink, setFeedbackLink] = React.useState("");
  const [feedbackFile, setFeedbackFile] = React.useState<File | null>(null);

  const isIntroduction = requestCategories[0] === "introduction";
  const isOpportunity = requestCategories[0] === "opportunity";
  const isMentorship = requestCategories[0] === "mentorship";
  const isVouch = requestCategories[0] === "vouch";
  const isConnect = requestCategories[0] === "connect";
  const isFeedback = requestCategories[0] === "feedback";

  const userUnvouchedSkills = !isEdit ? (props as CreateProps).userUnvouchedSkills ?? [] : [];
  const companies = !isEdit ? (props as CreateProps).companies ?? [] : [];

  const visibleCategories = categories.filter((c) => {
    if (c.value === "introduction" && askMode !== "contact") return false;
    if (c.value === "connect" && askMode !== "contact") return false;
    if (c.value === "vouch" && askMode === "community") return false;
    return true;
  });

  const [categoryOpen, setCategoryOpen] = React.useState(false);
  const [detailsExpanded, setDetailsExpanded] = React.useState(false);
  const [dueDatePickerOpen, setDueDatePickerOpen] = React.useState(false);
  const [errors, setErrors] = React.useState<{
    contacts?: string;
    shortDescription?: string;
    requestDetails?: string;
    requestCategories?: string;
  }>({});

  const categoryTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  const hasPrefilledContact =
    !isEdit && ((props as CreateProps).initialSelectedContacts?.length ?? 0) > 0;
  const shouldAutoFocusSearch = !hasPrefilledContact;

  // Re-sync initial values each time the dialog opens
  React.useEffect(() => {
    if (!open) return;
    if (isEdit) {
      const p = props as EditProps;
      setShortDescription(p.initialSummary ?? "");
      setRequestDetails(p.initialDetails ?? "");
      setRequestCategories(p.initialCategories ?? []);
      setDueDate(p.initialDueDate);
      setAskMode(p.initialAskMode ?? "contact");
    } else {
      const p = props as CreateProps;
      setRequestCategories(p.initialCategories ?? []);
      setSelectedContacts(p.initialSelectedContacts ?? []);
    }
    setErrors({});
    setCategoryOpen(false);
    setDueDatePickerOpen(false);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!open || isEdit || !hasPrefilledContact) return;
    const timeoutId = window.setTimeout(() => {
      categoryTriggerRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [open, isEdit, hasPrefilledContact]);

  const handleOpenChange = (value: boolean) => {
    if (!value && !isEdit) {
      setShortDescription("");
      setAskMode("contact");
      setSearchTerm("");
      setSelectedContacts([]);
      setRequestCategories([]);
      setRequestDetails("");
      setSendState("idle");
      setDueDate(undefined);
      setIntroSearchTerm("");
      setSelectedIntroContact(null);
      setFeedbackAttachment("nothing");
      setFeedbackLink("");
      setFeedbackFile(null);
    }
    if (!value) {
      setErrors({});
      setCategoryOpen(false);
    }
    onOpenChange(value);
  };

  const contacts = isEdit
    ? (props as EditProps).contacts ?? []
    : (props as CreateProps).contacts;

  const filteredContacts = React.useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return contacts.filter((c) => !selectedContacts.some((s) => s.id === c.id));
    return contacts.filter(
      (c) =>
        (c.name.toLowerCase().includes(term) || c.role?.toLowerCase().includes(term)) &&
        !selectedContacts.some((s) => s.id === c.id)
    );
  }, [contacts, searchTerm, selectedContacts]);

  const filteredIntroContacts = React.useMemo(() => {
    const term = introSearchTerm.toLowerCase();
    return contacts.filter(
      (c) =>
        c.id !== selectedIntroContact?.id &&
        (!term || c.name.toLowerCase().includes(term) || c.role?.toLowerCase().includes(term))
    );
  }, [contacts, introSearchTerm, selectedIntroContact]);

  // Clear contact-only / restricted categories when ask mode changes
  React.useEffect(() => {
    if (askMode !== "contact") {
      if (requestCategories[0] === "introduction") setRequestCategories([]);
      if (requestCategories[0] === "connect") setRequestCategories([]);
      setSelectedIntroContact(null);
      setIntroSearchTerm("");
      setConnectCompany(null);
      setConnectCompanyOpen(false);
    }
    if (askMode === "community") {
      if (requestCategories[0] === "vouch") setRequestCategories([]);
      setVouchType("myself");
      setVouchSkill(null);
    }
  }, [askMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset intro target when category changes away from introduction
  React.useEffect(() => {
    if (!isIntroduction) {
      setSelectedIntroContact(null);
      setIntroSearchTerm("");
    }
  }, [isIntroduction]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset opportunity intent when category changes away from opportunity
  React.useEffect(() => {
    if (!isOpportunity) setOpportunityIntent("get-hired");
  }, [isOpportunity]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset mentorship duration when category changes away from mentorship
  React.useEffect(() => {
    if (!isMentorship) setMentorshipDuration("short-term");
  }, [isMentorship]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset vouch state when category changes away from vouch
  React.useEffect(() => {
    if (!isVouch) {
      setVouchType("myself");
      setVouchSkill(null);
      setVouchSkillOpen(false);
    }
  }, [isVouch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset connect state when category changes away from connect
  React.useEffect(() => {
    if (!isConnect) {
      setConnectCompany(null);
      setConnectCompanyOpen(false);
    }
  }, [isConnect]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset feedback state when category changes away from feedback
  React.useEffect(() => {
    if (!isFeedback) {
      setFeedbackAttachment("nothing");
      setFeedbackLink("");
      setFeedbackFile(null);
    }
  }, [isFeedback]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = () => {
    if (!isEdit && sendState !== "idle") return;
    const newErrors: typeof errors = {};
    if (!isEdit && askMode === "contact" && selectedContacts.length === 0)
      newErrors.contacts = "Please add at least one contact";
    if (!shortDescription.trim())
      newErrors.shortDescription = "Please enter a short title";
    else if (!isEdit && shortDescription.trim().length > 60)
      newErrors.shortDescription = "Title must be 60 characters or less";
    if (!requestDetails.trim())
      newErrors.requestDetails = "Please add some context";
    if (requestCategories.length === 0)
      newErrors.requestCategories = "Please select at least one category";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    if (isEdit) {
      (props as EditProps).onSubmit?.({
        shortDescription: shortDescription.trim(),
        requestDetails: requestDetails.trim(),
        requestCategories: [...requestCategories],
        askMode,
        dueDate,
      });
      handleOpenChange(false);
    } else {
      setSendState("sending");
      (props as CreateProps).onSubmit?.({
        shortDescription: shortDescription.trim(),
        requestDetails: requestDetails.trim(),
        requestCategories: [...requestCategories],
        askMode,
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
      try {
        localStorage.setItem("interactions-active-tab", "my-requests");
      } catch {
        // no-op
      }
      window.location.href = "/trusted-list/interactions?tab=my-requests#my-requests";
    }
  }, [sendState, isEdit]);

  const summaryMaxLength = 60;

  return (
    <BaseDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={isEdit ? "Edit your request" : "What are you trying to achieve?"}
      description={isEdit
        ? "Update your need, category, or timeframe."
        : "Name your need, choose who to ask, and add a timeframe if helpful."}
      size="xl"
      footerContent={
        <>
          <Button
            variant="ghost"
            className="rounded-full font-semibold"
            onClick={() => handleOpenChange(false)}
            type="button"
          >
            Cancel
          </Button>
          <Button
            className="rounded-full font-semibold"
            onClick={handleSubmit}
            disabled={!isEdit && sendState !== "idle"}
            type="button"
          >
            {isEdit ? (
              <>Save Changes <ArrowRight className="h-4 w-4" /></>
            ) : sendState === "idle" ? (
              <>Request Help <ArrowRight className="h-4 w-4" /></>
            ) : sendState === "sending" ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
            ) : (
              <><Check className="h-4 w-4" /> Request Created!</>
            )}
          </Button>
        </>
      }
    >
        <div className="flex flex-col gap-8 overflow-x-hidden">

          {/* ── Who do you want to ask? ─────────────────────────── */}
          {!detailsExpanded && (
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
                        selected ? "border-primary bg-primary-25" : "border-border-75 bg-muted hover:bg-muted-50"
                      }`}
                    >
                      <div className="flex w-full items-start gap-2">
                        <div
                          className={`mt-px h-4 w-4 shrink-0 rounded-full border-2 transition-colors ${
                            selected ? "border-primary bg-primary" : "border-muted-foreground bg-transparent"
                          }`}
                        >
                          {selected && (
                            <div className="m-auto mt-[3px] h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                          )}
                        </div>
                        <div className="flex min-w-0 flex-col gap-1">
                          <span className={`text-sm font-semibold leading-tight ${selected ? "text-accent-foreground" : "text-foreground"}`}>
                            {option.label}
                          </span>
                          <span className="text-xs leading-snug text-muted-foreground">
                            {option.subtitle}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {askMode === "contact" && (
                <div className="space-y-2">
                  {errors.contacts && (
                    <p className="mb-1 text-xs text-destructive">{errors.contacts}</p>
                  )}
                  <div className="relative">
                    <ContactRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      autoFocus={shouldAutoFocusSearch}
                      placeholder="Search contacts by name or skill…"
                      className={`rounded-full bg-background pl-9 shadow-none ${errors.contacts ? "border-destructive" : "border-primary"}`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {searchTerm && filteredContacts.length > 0 && (
                    <div className="relative">
                      <div className="absolute left-0 right-0 z-20 max-h-48 overflow-auto rounded-xl border border-border bg-card p-3 shadow-lg">
                        <div className="flex flex-col gap-4">
                          {filteredContacts.slice(0, 5).map((contact) => (
                            <button
                              key={contact.id}
                              type="button"
                              className="flex w-full items-center gap-2 rounded-lg text-left transition-colors hover:bg-accent px-2 py-1"
                              onClick={() => {
                                setSelectedContacts((prev) => [...prev, contact]);
                                setSearchTerm("");
                                if (errors.contacts) setErrors((prev) => ({ ...prev, contacts: undefined }));
                              }}
                            >
                              <Avatar className="h-10 w-10 shrink-0 border-2 border-primary-foreground shadow-md">
                                <AvatarImage src={contact.avatarUrl} alt={contact.name} className="object-cover" />
                                <AvatarFallback className="text-sm font-semibold">
                                  {contact.name[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <p className="text-base font-semibold text-card-foreground">{contact.name}</p>
                                <p className="text-xs text-muted-foreground">{contact.role}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedContacts.length > 0 && (
                    <div className="flex flex-wrap gap-3 pt-1">
                      {selectedContacts.map((contact) => (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() => setSelectedContacts((prev) => prev.filter((c) => c.id !== contact.id))}
                          aria-label={`Remove ${contact.name}`}
                          className="flex items-center gap-1.5 rounded-full border border-border bg-muted-25 px-3 py-1 text-sm font-semibold leading-none text-foreground transition-colors hover:bg-accent hover:border-destructive/40 hover:text-destructive"
                        >
                          {contact.name}
                          <X className="h-3 w-3 opacity-50" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── What kind of help is this? ───────────────────── */}
          {!detailsExpanded && (
            <div className="space-y-3">
                  <p className="text-base font-semibold text-foreground">What kind of help is this?</p>
                  {errors.requestCategories && (
                    <p className="mb-1 text-xs text-destructive">{errors.requestCategories}</p>
                  )}
                  <Popover
                    open={categoryOpen}
                    onOpenChange={(open) => {
                      setCategoryOpen(open);
                      if (open && errors.requestCategories) setErrors((prev) => ({ ...prev, requestCategories: undefined }));
                    }}
                  >
                    <PopoverTrigger asChild>
                      <button
                        ref={categoryTriggerRef}
                        type="button"
                        className={`flex h-9 w-full items-center gap-2 rounded-lg border bg-background px-3 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${errors.requestCategories ? "border-destructive" : "border-border"}`}
                      >
                        <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className={`flex-1 text-sm ${requestCategories.length > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                          {requestCategories.length > 0
                            ? visibleCategories.find((c) => c.value === requestCategories[0])?.label ?? requestCategories[0]
                            : "Select a category…"}
                        </span>
                        {requestCategories.length > 0 && (
                          <span
                            role="button"
                            aria-label="Clear category"
                            onClick={(e) => { e.stopPropagation(); setRequestCategories([]); }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </span>
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" side="top">
                      <Command>
                        <CommandInput placeholder="Search categories…" />
                        <CommandList>
                          <CommandEmpty>No categories found.</CommandEmpty>
                          <CommandGroup>
                            {visibleCategories.map((cat) => {
                              const selected = requestCategories[0] === cat.value;
                              return (
                                <CommandItem
                                  key={cat.value}
                                  value={cat.value}
                                  onSelect={() => {
                                    setRequestCategories([cat.value]);
                                    setCategoryOpen(false);
                                    if (errors.requestCategories) setErrors((prev) => ({ ...prev, requestCategories: undefined }));
                                  }}
                                >
                                  <Check className={`mr-2 h-4 w-4 ${selected ? "opacity-100" : "opacity-0"}`} />
                                  {cat.label}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
            </div>
          )}

          {/* ── Who would you like to be introduced to? (Introduction only) ── */}
          {!detailsExpanded && isIntroduction && (
            <div className="space-y-3">
              <p className="text-base font-semibold text-foreground">Who would you like to be introduced to?</p>
              {selectedIntroContact ? (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted-25 px-3 py-2">
                  <Avatar className="h-8 w-8 shrink-0 border-2 border-primary-foreground shadow-md">
                    <AvatarImage src={selectedIntroContact.avatarUrl} alt={selectedIntroContact.name} className="object-cover" />
                    <AvatarFallback className="text-sm font-semibold">
                      {selectedIntroContact.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-col">
                    <p className="text-sm font-semibold text-foreground">{selectedIntroContact.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedIntroContact.role}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedIntroContact(null); setIntroSearchTerm(""); }}
                    aria-label={`Remove ${selectedIntroContact.name}`}
                    className="ml-auto flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <ContactRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or role…"
                      className="rounded-full bg-background pl-9 shadow-none border-border"
                      value={introSearchTerm}
                      onChange={(e) => setIntroSearchTerm(e.target.value)}
                    />
                  </div>
                  {introSearchTerm && filteredIntroContacts.length > 0 && (
                    <div className="relative">
                      <div className="absolute left-0 right-0 z-20 max-h-48 overflow-auto rounded-xl border border-border bg-card p-3 shadow-lg">
                        <div className="flex flex-col gap-4">
                          {filteredIntroContacts.slice(0, 5).map((contact) => (
                            <button
                              key={contact.id}
                              type="button"
                              className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-accent"
                              onClick={() => { setSelectedIntroContact(contact); setIntroSearchTerm(""); }}
                            >
                              <Avatar className="h-10 w-10 shrink-0 border-2 border-primary-foreground shadow-md">
                                <AvatarImage src={contact.avatarUrl} alt={contact.name} className="object-cover" />
                                <AvatarFallback className="text-sm font-semibold">
                                  {contact.name[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <p className="text-base font-semibold text-card-foreground">{contact.name}</p>
                                <p className="text-xs text-muted-foreground">{contact.role}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Opportunity intent toggle (Opportunity only) ── */}
          {!detailsExpanded && isOpportunity && (
            <div className="space-y-3">
              <p className="text-base font-semibold text-foreground">What kind of opportunity is this?</p>
              <ToggleGroup
                type="single"
                value={opportunityIntent}
                onValueChange={(v) => { if (v) setOpportunityIntent(v as "hire" | "get-hired"); }}
                className="grid grid-cols-2 gap-2"
              >
                <ToggleGroupItem value="get-hired" className="rounded-lg border border-border h-9 text-sm font-semibold data-[state=on]:bg-primary-25 data-[state=on]:border-primary data-[state=on]:text-accent-foreground">
                  Looking to get hired
                </ToggleGroupItem>
                <ToggleGroupItem value="hire" className="rounded-lg border border-border h-9 text-sm font-semibold data-[state=on]:bg-primary-25 data-[state=on]:border-primary data-[state=on]:text-accent-foreground">
                  Looking to hire
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          )}

          {/* ── Vouch type + skill selector (Vouch only) ── */}
          {!detailsExpanded && isVouch && (
            <div className="space-y-3">
              <p className="text-base font-semibold text-foreground">What would you like vouched?</p>
              <ToggleGroup
                type="single"
                value={vouchType}
                onValueChange={(v) => {
                  if (v) {
                    setVouchType(v as "myself" | "skill");
                    setVouchSkill(null);
                    setVouchSkillOpen(false);
                  }
                }}
                className="grid grid-cols-2 gap-2"
              >
                <ToggleGroupItem value="myself" className="rounded-lg border border-border h-9 text-sm font-semibold data-[state=on]:bg-primary-25 data-[state=on]:border-primary data-[state=on]:text-accent-foreground">
                  Myself
                </ToggleGroupItem>
                <ToggleGroupItem value="skill" className="rounded-lg border border-border h-9 text-sm font-semibold data-[state=on]:bg-primary-25 data-[state=on]:border-primary data-[state=on]:text-accent-foreground">
                  A Skill
                </ToggleGroupItem>
              </ToggleGroup>

              {vouchType === "skill" && userUnvouchedSkills.length > 0 && (
                <Popover open={vouchSkillOpen} onOpenChange={setVouchSkillOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-background px-3 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <BicepsFlexed className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className={`flex-1 text-sm ${vouchSkill ? "text-foreground" : "text-muted-foreground"}`}>
                        {vouchSkill ?? "Select a skill…"}
                      </span>
                      {vouchSkill && (
                        <span
                          role="button"
                          aria-label="Clear skill"
                          onClick={(e) => { e.stopPropagation(); setVouchSkill(null); }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" side="top">
                    <Command>
                      <CommandInput placeholder="Search skills…" />
                      <CommandList>
                        <CommandEmpty>No skills found.</CommandEmpty>
                        <CommandGroup>
                          {userUnvouchedSkills.map((skill) => (
                            <CommandItem
                              key={skill}
                              value={skill}
                              onSelect={() => { setVouchSkill(skill); setVouchSkillOpen(false); }}
                            >
                              <Check className={`mr-2 h-4 w-4 ${vouchSkill === skill ? "opacity-100" : "opacity-0"}`} />
                              {skill}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          )}

          {/* ── Connect company selector (Connect only) ── */}
          {!detailsExpanded && isConnect && companies.length > 0 && (
            <div className="space-y-3">
              <p className="text-base font-semibold text-foreground">Where do you know each other?</p>
              <Popover open={connectCompanyOpen} onOpenChange={setConnectCompanyOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-background px-3 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className={`flex-1 text-sm ${connectCompany ? "text-foreground" : "text-muted-foreground"}`}>
                      {connectCompany ?? "Select a company…"}
                    </span>
                    {connectCompany && (
                      <span
                        role="button"
                        aria-label="Clear company"
                        onClick={(e) => { e.stopPropagation(); setConnectCompany(null); }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" side="top">
                  <Command>
                    <CommandInput placeholder="Search companies…" />
                    <CommandList>
                      <CommandEmpty>No companies found.</CommandEmpty>
                      <CommandGroup>
                        {companies.map((company) => (
                          <CommandItem
                            key={company}
                            value={company}
                            onSelect={() => { setConnectCompany(company); setConnectCompanyOpen(false); }}
                          >
                            <Check className={`mr-2 h-4 w-4 ${connectCompany === company ? "opacity-100" : "opacity-0"}`} />
                            {company}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* ── Mentorship duration toggle (Mentorship only) ── */}
          {!detailsExpanded && isMentorship && (
            <div className="space-y-3">
              <p className="text-base font-semibold text-foreground">What kind of mentorship are you looking for?</p>
              <ToggleGroup
                type="single"
                value={mentorshipDuration}
                onValueChange={(v) => { if (v) setMentorshipDuration(v as "short-term" | "long-term"); }}
                className="grid grid-cols-2 gap-2"
              >
                <ToggleGroupItem value="short-term" className="rounded-lg border border-border h-9 text-sm font-semibold data-[state=on]:bg-primary-25 data-[state=on]:border-primary data-[state=on]:text-accent-foreground">
                  Short Term
                </ToggleGroupItem>
                <ToggleGroupItem value="long-term" className="rounded-lg border border-border h-9 text-sm font-semibold data-[state=on]:bg-primary-25 data-[state=on]:border-primary data-[state=on]:text-accent-foreground">
                  Long Term
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          )}

          {/* ── Feedback attachment (Feedback only) ── */}
          {!detailsExpanded && isFeedback && (
            <div className="space-y-3">
              <p className="text-base font-semibold text-foreground">Do you have something to share?</p>
              <ToggleGroup
                type="single"
                value={feedbackAttachment}
                onValueChange={(v) => {
                  if (v) {
                    setFeedbackAttachment(v as "nothing" | "link" | "file");
                    setFeedbackLink("");
                    setFeedbackFile(null);
                  }
                }}
                className="grid grid-cols-3 gap-2"
              >
                <ToggleGroupItem value="nothing" className="rounded-lg border border-border h-9 text-sm font-semibold data-[state=on]:bg-primary-25 data-[state=on]:border-primary data-[state=on]:text-accent-foreground">
                  Nothing
                </ToggleGroupItem>
                <ToggleGroupItem value="link" className="rounded-lg border border-border h-9 text-sm font-semibold data-[state=on]:bg-primary-25 data-[state=on]:border-primary data-[state=on]:text-accent-foreground">
                  Link
                </ToggleGroupItem>
                <ToggleGroupItem value="file" className="rounded-lg border border-border h-9 text-sm font-semibold data-[state=on]:bg-primary-25 data-[state=on]:border-primary data-[state=on]:text-accent-foreground">
                  File
                </ToggleGroupItem>
              </ToggleGroup>

              {feedbackAttachment === "link" && (
                <div className="relative">
                  <Link className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="url"
                    placeholder="Paste a link…"
                    className="rounded-lg bg-background pl-9 shadow-none border-border"
                    value={feedbackLink}
                    onChange={(e) => setFeedbackLink(e.target.value)}
                  />
                </div>
              )}

              {feedbackAttachment === "file" && (
                <label className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                  <Paperclip className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">
                    {feedbackFile ? feedbackFile.name : "Choose a file…"}
                  </span>
                  {feedbackFile && (
                    <span
                      role="button"
                      aria-label="Remove file"
                      onClick={(e) => { e.preventDefault(); setFeedbackFile(null); }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </span>
                  )}
                  <input
                    type="file"
                    className="sr-only"
                    onChange={(e) => setFeedbackFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>
          )}

          {/* ── What would you like help with? ───────────────── */}
          {!detailsExpanded && (
            <div className="space-y-3">
              <p className="text-base font-semibold text-foreground">What would you like help with?</p>
              {errors.shortDescription && (
                <p className="mb-1 text-xs text-destructive">{errors.shortDescription}</p>
              )}
              <div className="flex items-center gap-2">
                <Input
                  placeholder={
                    isIntroduction ? "e.g. Can you introduce me to this person?" :
                    isOpportunity && opportunityIntent === "get-hired" ? "e.g. I'm looking for a new role in…" :
                    isOpportunity && opportunityIntent === "hire" ? "e.g. We're looking to hire a…" :
                    requestCategories[0] === "help-advice" ? "e.g. I'm trying to decide whether to…" :
                    isMentorship ? "e.g. I'm looking for an experienced mentor…" :
                    isVouch ? "e.g. Would you be willing to vouch for me…" :
                    isFeedback ? "e.g. What do you need to share?" :
                    "Enter a short descriptive title…"
                  }
                  maxLength={summaryMaxLength}
                  className={`flex-1 rounded-lg bg-background shadow-none ${errors.shortDescription ? "border-destructive" : ""}`}
                  value={shortDescription}
                  onChange={(e) => {
                    setShortDescription(e.target.value);
                    if (errors.shortDescription) setErrors((prev) => ({ ...prev, shortDescription: undefined }));
                  }}
                />
                <p className="shrink-0 text-xs text-muted-foreground">
                  {shortDescription.length}/{summaryMaxLength} characters maximum
                </p>
              </div>
            </div>
          )}

          {/* ── Add some context ─────────────────────────────── */}
          <div className="space-y-2">
            <p className="text-base font-normal text-secondary-foreground">Add some context to get better advice</p>
            {errors.requestDetails && (
              <p className="mb-1 text-xs text-destructive">{errors.requestDetails}</p>
            )}
            <div className="relative" style={{ height: detailsExpanded ? "calc(60dvh)" : "7.5rem" }}>
              <Textarea
                placeholder={requestCategories[0] === "help-advice" ? "Ask for help thinking through something:\n• A decision you're weighing\n• A challenge at work\n• Getting perspective on someone\n• How others have handled a similar situation" : "Share what someone needs to know to help you well."}
                className={`h-full resize-none rounded-lg bg-background placeholder:text-muted-foreground shadow-none ${errors.requestDetails ? "border-destructive" : "border-border"}`}
                value={requestDetails}
                onChange={(e) => {
                  setRequestDetails(e.target.value);
                  if (errors.requestDetails) setErrors((prev) => ({ ...prev, requestDetails: undefined }));
                }}
              />
              <button
                type="button"
                onClick={() => setDetailsExpanded((v) => !v)}
                aria-label={detailsExpanded ? "Collapse text area" : "Expand text area"}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {detailsExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* ── When do you need this by? ─────────────────────── */}
          {!detailsExpanded && (
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <p className="text-base font-semibold text-foreground">When do you need this by?</p>
                <p className="text-base font-normal text-muted-foreground">(Optional)</p>
              </div>
              <Popover open={dueDatePickerOpen} onOpenChange={setDueDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={`rounded-full font-semibold leading-none transition-colors ${
                      dueDate
                        ? "border-border bg-muted-25 text-foreground"
                        : "border-foreground bg-secondary text-foreground shadow-sm"
                    }`}
                  >
                    <CalendarPlus2 className="h-4 w-4" />
                    {dueDate
                      ? dueDate.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
                      : "Set a timeframe"}
                    {dueDate && (
                      <span
                        role="button"
                        aria-label="Clear due date"
                        onClick={(e) => { e.stopPropagation(); setDueDate(undefined); }}
                        className="ml-1 flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => {
                      if (date) {
                        setDueDate(date);
                        setDueDatePickerOpen(false);
                      }
                    }}
                    className="min-w-[214px] min-h-[261px]"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}


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
