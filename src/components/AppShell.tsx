"use client";

import * as React from "react";

import dashboardData from "../../data/dashboard-content.json";
import { AppSidebar } from "@/components/app-sidebar";
import { HelpRequestCard } from "@/features/dashboard/components/HelpRequestCards";
import type { CardData, SectionKey } from "@/features/dashboard/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Loader2, Send, Check, Search, ChevronDownIcon } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "./ui/sidebar";

type SummaryHighlight = {
  title: string;
  body: string;
};

type SectionConfig = {
  title: string;
  batches: CardData[][];
};

type AskContact = {
  id: string;
  name: string;
  role: string;
};

type AskForHelpCard = {
  title: string;
  subtitle: string;
  cta: string;
  contacts: AskContact[];
};

type DashboardContent = {
  summaryHighlights: SummaryHighlight[];
  askForHelpCard: AskForHelpCard;
  helpSections: Record<SectionKey, SectionConfig>;
};

const content = dashboardData as DashboardContent;
const summaryHighlights = content.summaryHighlights;
const helpSectionData = content.helpSections;
const askForHelpCard = content.askForHelpCard;
const sectionOrder: SectionKey[] = ["circle", "network", "opportunities"];

const AppShell = () => {
  const [sections, setSections] = React.useState<
    Record<SectionKey, { cards: CardData[] }>
  >(
    () =>
      Object.fromEntries(
        sectionOrder.map((key) => [
          key,
          { cards: helpSectionData[key].batches.flat() },
        ])
      ) as Record<SectionKey, { cards: CardData[] }>
  );

  const [askDialogOpen, setAskDialogOpen] = React.useState(false);

  const handleClearCard = (section: SectionKey, cardId: string) => {
    setSections((prev) => ({
      ...prev,
      [section]: {
        cards: prev[section].cards.filter((card) => card.id !== cardId),
      },
    }));
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-muted/30">
        <AppSidebar />
        <SidebarInset className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden">
          <div className="flex items-center gap-3 border-b bg-background px-4 py-3 lg:hidden">
            <SidebarTrigger className="border border-border" />
          </div>
          <div className="flex-1 px-4 py-8 sm:px-6 lg:px-10">
            <div className="flex w-full max-w-7xl flex-col gap-8 overflow-hidden">
              <header className="space-y-3">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                    How can you help today?
                  </h1>
                </div>
              </header>

              <SummaryModules
                askCard={askForHelpCard}
                onAsk={() => setAskDialogOpen(true)}
              />

              <main className="space-y-10">
                {sectionOrder.map((key) => (
                  <HelpSection
                    key={key}
                    section={key}
                    title={helpSectionData[key].title}
                    cards={sections[key].cards}
                    onClearCard={handleClearCard}
                  />
                ))}
              </main>
            </div>
          </div>
        </SidebarInset>
      </div>
      <AskForHelpDialog
        open={askDialogOpen}
        onOpenChange={setAskDialogOpen}
        contacts={askForHelpCard.contacts}
      />
    </SidebarProvider>
  );
};

type HelpSectionProps = {
  section: SectionKey;
  title: string;
  cards: CardData[];
  onClearCard: (section: SectionKey, cardId: string) => void;
};

const HelpSection = ({
  section,
  title,
  cards,
  onClearCard,
}: HelpSectionProps) => {
  return (
    <section className="space-y-4">
      <SectionHeader title={title} count={cards.length} />
      <div className="relative">
        <Carousel
          opts={{ align: "start", slidesToScroll: 3 }}
          className="w-full overflow-hidden"
        >
          <CarouselContent>
            {cards.map((card) => (
              <CarouselItem
                key={card.id}
                className="px-2 sm:px-3 md:basis-1/2 xl:basis-1/3"
              >
                <div className="h-full p-1">
                  <HelpRequestCard
                    {...card}
                    onClear={() => onClearCard(section, card.id)}
                  />
                </div>
              </CarouselItem>
            ))}
            {cards.length === 0 && (
              <CarouselItem className="px-2 sm:px-3 basis-full">
                <div className="flex h-full min-h-[380px] w-full items-center justify-center rounded-3xl border border-dashed border-primary/30 bg-primary/10 p-6 mx-1 text-center">
                  <p className="text-lg font-semibold text-primary">
                    Your work here is done. Thanks for the help!
                  </p>
                </div>
              </CarouselItem>
            )}
          </CarouselContent>
          <div className="mt-4 flex justify-end gap-2 p-1">
            <CarouselPrevious className="static translate-y-0" />
            <CarouselNext className="static translate-y-0" />
          </div>
        </Carousel>
      </div>
    </section>
  );
};

type SectionHeaderProps = {
  title: string;
  count: number;
};

const SectionHeader = ({ title, count }: SectionHeaderProps) => (
  <div className="flex items-center gap-3">
    <h2 className="text-lg font-semibold leading-tight">{title}</h2>
    <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary h-8 w-8 flex items-center justify-center">
      {count}
    </span>
  </div>
);

const SummaryModules = ({
  askCard,
  onAsk,
}: {
  askCard: AskForHelpCard;
  onAsk: () => void;
}) => (
  <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {summaryHighlights.map((highlight) => (
      <article
        key={highlight.title}
        className="rounded-2xl border border-border bg-card p-5 shadow-sm"
      >
        <p className="text-sm font-medium text-muted-foreground">
          {highlight.title}
        </p>
        <p className="mt-2 text-base font-semibold text-foreground">
          {highlight.body}
        </p>
      </article>
    ))}
    <article className="flex flex-col rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 shadow-sm">
      <div className="space-y-2">
        <p className="text-lg font-semibold">{askCard.title}</p>
        <p className="text-sm text-muted-foreground">{askCard.subtitle}</p>
      </div>
      <div className="mt-4">
        <Button onClick={onAsk}>{askCard.cta}</Button>
      </div>
    </article>
  </section>
);

export default AppShell;

type AskMode = "contact" | "circle" | "list";

const AskForHelpDialog = ({
  open,
  onOpenChange,
  contacts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: AskContact[];
}) => {
  const [shortDescription, setShortDescription] = React.useState("");
  const [askMode, setAskMode] = React.useState<AskMode>("contact");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedContacts, setSelectedContacts] = React.useState<AskContact[]>(
    []
  );
  const [requestDetails, setRequestDetails] = React.useState("");
  const [sendState, setSendState] = React.useState<
    "idle" | "sending" | "success"
  >("idle");
  const defaultEndDate = React.useCallback(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date;
  }, []);
  const [endDateEnabled, setEndDateEnabled] = React.useState(false);
  const [endDate, setEndDate] = React.useState<Date | undefined>(
    defaultEndDate
  );
  const [endDatePickerOpen, setEndDatePickerOpen] = React.useState(false);

  const resetForm = React.useCallback(() => {
    setShortDescription("");
    setAskMode("contact");
    setSearchTerm("");
    setSelectedContacts([]);
    setRequestDetails("");
    setSendState("idle");
    setEndDateEnabled(false);
    setEndDate(defaultEndDate());
  }, [defaultEndDate]);

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      resetForm();
    }
    onOpenChange(value);
  };

  const filteredContacts = React.useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term)
      return contacts.filter(
        (contact) => !selectedContacts.some((c) => c.id === contact.id)
      );
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(term) &&
        !selectedContacts.some((selected) => selected.id === contact.id)
    );
  }, [contacts, searchTerm, selectedContacts]);

  const canSend =
    shortDescription.trim().length > 0 &&
    shortDescription.trim().length <= 32 &&
    requestDetails.trim().length > 0 &&
    (askMode !== "contact" || selectedContacts.length > 0);

  const handleSelectContact = (contact: AskContact) => {
    setSelectedContacts((prev) => [...prev, contact]);
    setSearchTerm("");
  };

  const handleRemoveContact = (id: string) => {
    setSelectedContacts((prev) => prev.filter((contact) => contact.id !== id));
  };

  const handleSend = () => {
    if (!canSend || sendState !== "idle") return;
    setSendState("sending");
    setTimeout(() => {
      setSendState("success");
      setTimeout(() => {
        handleOpenChange(false);
      }, 900);
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>What help do you need?</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="rounded-full bg-muted/80 p-1 text-sm font-medium">
            <div className="grid grid-cols-3 gap-1">
              {[
                { value: "contact", label: "Ask a contact" },
                { value: "circle", label: "Ask your circle" },
                { value: "list", label: "Ask the list" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAskMode(option.value as AskMode)}
                  className={`rounded-full px-2 py-1 transition ${
                    askMode === option.value
                      ? "bg-background text-foreground shadow"
                      : "text-muted-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {askMode === "contact" && (
            <div className="space-y-2">
              <div className="space-y-0 mb-1">
                <div className="relative space-y-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Search className="h-4 w-4" />
                  </span>
                  <Input
                    id="contact-search"
                    placeholder="Search your circle…"
                    className="placeholder:text-muted-foreground/50 mt-1 border border-border pl-9 rounded-full shadow-none"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>
              </div>
              {searchTerm && filteredContacts.length > 0 && (
                <div className="relative">
                  <div className="absolute left-0 right-0 z-20 w-full max-h-48 space-y-1 rounded-xl border border-border bg-card p-2 shadow-lg overflow-auto">
                    {filteredContacts.slice(0, 5).map((contact) => (
                      <button
                        key={contact.id}
                        type="button"
                        className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => handleSelectContact(contact)}
                      >
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {contact.role}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {selectedContacts.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedContacts.map((contact) => (
                    <Badge
                      key={contact.id}
                      variant="secondary"
                      className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm text-foreground transition hover:bg-muted/70 pointer-events-auto"
                    >
                      {contact.name}
                      <button
                        type="button"
                        className="cursor-pointer text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => handleRemoveContact(contact.id)}
                        aria-label={`Remove ${contact.name}`}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 mt-6">
            <Label
              htmlFor="ask-short-desc"
              className="flex items-center justify-between text-sm font-medium"
            >
              Short description
              <span className="text-xs text-muted-foreground">
                {shortDescription.length}/32 characters
              </span>
            </Label>
            <Input
              id="ask-short-desc"
              placeholder="Enter your request"
              maxLength={32}
              className="placeholder:text-muted-foreground/50 mt-1 border border-border"
              value={shortDescription}
              onChange={(event) => setShortDescription(event.target.value)}
            />
          </div>

          <div className="space-y-5">
            <Label htmlFor="request-details">Request details</Label>
            <Textarea
              id="request-details"
              placeholder="Ask specifically what you need help with…"
              rows={5}
              className="placeholder:text-muted-foreground/50 shadow-sm mt-1 border border-border"
              value={requestDetails}
              onChange={(event) => setRequestDetails(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="end-date-toggle"
                checked={endDateEnabled}
                onCheckedChange={(checked) =>
                  setEndDateEnabled(Boolean(checked))
                }
              />
              <Label htmlFor="end-date-toggle" className="text-sm font-medium h-9 justify-center flex items-center">
                Set an end date
              </Label>
            </div>

            {endDateEnabled && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Popover
                  open={endDatePickerOpen}
                  onOpenChange={setEndDatePickerOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-between font-normal"
                      id="end-date"
                    >
                      {endDate ? endDate.toLocaleDateString() : "Select date"}
                      <ChevronDownIcon />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="!w-auto !h-auto p-0"
                    align="start"
                    side="top"
                    sideOffset={8}
                    avoidCollisions={false}
                    style={{ height: "auto" }}
                  >
                    <Calendar
                      className="w-56"
                      mode="single"
                      selected={endDate}
                      captionLayout="dropdown"
                      onSelect={(date) => {
                        if (date) {
                          setEndDate(date);
                          setEndDatePickerOpen(false);
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              className=""
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className=""
              onClick={handleSend}
              disabled={!canSend || sendState !== "idle"}
            >
              {sendState === "idle" && (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send request
                </>
              )}
              {sendState === "sending" && (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending…
                </>
              )}
              {sendState === "success" && (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Sent!
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
