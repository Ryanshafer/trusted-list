"use client";

import * as React from "react";

import dashboardData from "../../data/dashboard-content.json";
import { AppSidebar } from "@/components/app-sidebar";
import { HelpRequestCard } from "@/features/dashboard/components/HelpRequestCards";
import type { CardData, SectionKey } from "@/features/dashboard/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Loader2, Send, Check, Search, ChevronDownIcon, Users, CheckCircle2, Clock, ChevronRight, Activity, Sparkles, HandHelping, UserPlus, Hand } from "lucide-react";
import { interactions } from "@/features/interactions/data";


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

export type AskContact = {
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
      <div className="flex min-h-screen bg-background">
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
              <RecommendationBanner />

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
      <SectionHeader
        title={title}
        count={cards.length}
        showCount={section !== "opportunities"}
        ctaLabel={section === "opportunities" ? "Explore all requests" : undefined}
        ctaHref={section === "opportunities" ? "/trusted-list/requests" : undefined}
      />
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
            {section === "opportunities" && (
              <CarouselItem className="px-2 sm:px-3 md:basis-1/2 xl:basis-1/3">
                <div className="h-full p-1">
                  <div className="flex h-full flex-col items-center justify-center gap-3 rounded-3xl border border-primary/30 bg-primary/20 p-6 text-center shadow-sm">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-primary">Community spotlight</p>
                      <h3 className="text-xl font-bold text-foreground">Looking for more people to help?</h3>
                      <p className="text-sm text-muted-foreground">
                        Browse every open request across the Trusted List and jump into the ones that fit you best.
                      </p>
                    </div>
                    <div className="mt-2">
                      <Button asChild>
                        <a href="/trusted-list/requests">Explore all requests</a>
                      </Button>
                    </div>
                  </div>
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
  showCount?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
};

const SectionHeader = ({ title, count, showCount = true, ctaLabel, ctaHref }: SectionHeaderProps) => (
  <div className="flex items-center gap-3 justify-between">
    <div className="flex items-center gap-3">
      <h2 className="text-2xl font-semibold leading-tight">{title}</h2>
      {showCount && (
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary h-8 w-8 flex items-center justify-center">
          {count}
        </span>
      )}
    </div>
    {ctaLabel && ctaHref && (
      <Button asChild variant="ghost" className="h-auto p-0 text-primary hover:text-primary/80">
        <a href={ctaHref} className="inline-flex items-center gap-1 text-sm font-medium">
          {ctaLabel}
          <ChevronRight className="h-4 w-4" />
        </a>
      </Button>
    )}
  </div>
);

const useAnimatedCounter = (end: number, duration: number = 2000) => {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setCount(Math.round(end * easeOut));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
};

const ImpactSummary = () => {
  const helpedCount = interactions.helped.length;
  const inProgressCount = interactions.inProgress.length;

  const peopleHelped = useAnimatedCounter(helpedCount);
  const peopleInProgress = useAnimatedCounter(inProgressCount);

  return (
    <div className="col-span-1 flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Your Direct Impact</h3>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" strokeWidth={2} />
          <div className="flex items-baseline gap-2">
            <span className="w-16 text-left text-4xl font-bold tracking-tighter text-foreground tabular-nums">
              {peopleHelped}
            </span>
            <span className="text-base font-medium text-muted-foreground">People Helped</span>
          </div>
        </div>

        <div className="h-px w-full bg-border/60" />

        <div className="flex items-center gap-2">
          <Clock className="h-8 w-8 text-blue-500" strokeWidth={2} />
          <div className="flex items-baseline gap-2">
            <span className="w-16 text-left text-4xl font-bold tracking-tighter text-foreground tabular-nums">
              {peopleInProgress}
            </span>
            <span className="text-base font-medium text-muted-foreground">In Progress Helping</span>
          </div>
        </div>

        {/* Removed "People Requesting Help" per request */}
      </div>
      <div className="mt-8">
        <Button variant="ghost" className="w-full justify-end pl-0 hover:bg-transparent text-primary hover:text-primary/80" asChild>
          <a href="/trusted-list/interactions">
            See all activity →
          </a>
        </Button>
      </div>
    </div>
  );
};

const PerformanceGauge = () => {
  // Gauge configuration
  const size = 250;
  const stroke = 64;
  const radius = size - stroke;
  const center = size;

  // Animation state
  const [displayValue, setDisplayValue] = React.useState(100);
  const [angle, setAngle] = React.useState(180);

  // Target values
  const targetValue = 5;
  const targetAngle = 261;
  const startAngle = 180;
  const startValue = 100;

  React.useEffect(() => {
    const duration = 2000; // 2 seconds
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentAngle = startAngle + (targetAngle - startAngle) * easeOut;
      const currentValue = startValue - (startValue - targetValue) * easeOut;

      setAngle(currentAngle);
      setDisplayValue(Math.round(currentValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, []);

  const angleInRadians = (angle * Math.PI) / 180;

  // Calculate line coordinates
  // We want the line to span the stroke width
  const innerR = radius - stroke / 2;
  const outerR = radius + stroke / 2;

  const x1 = center + innerR * Math.cos(angleInRadians);
  const y1 = center + innerR * Math.sin(angleInRadians);
  const x2 = center + outerR * Math.cos(angleInRadians);
  const y2 = center + outerR * Math.sin(angleInRadians);

  // Helper function to get tier message based on percentage
  const getTierMessage = (value: number): string => {
    if (value <= 5) return "You're among the most helpful on the list.";
    if (value <= 52) return "You're helping steadily — keep going.";
    if (value <= 75) return "You're on your way — every action matters.";
    return "You're just getting started — new chances to help ahead.";
  };

  // Track the current tier message for fade transitions
  const [currentMessage, setCurrentMessage] = React.useState(getTierMessage(100));
  const [messageKey, setMessageKey] = React.useState(0);

  // Update message with fade effect when tier changes
  React.useEffect(() => {
    const newMessage = getTierMessage(displayValue);
    if (newMessage !== currentMessage) {
      setCurrentMessage(newMessage);
      setMessageKey(prev => prev + 1);
    }
  }, [displayValue, currentMessage]);

  return (
    <div className="col-span-1 relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm h-full min-h-[220px]">
      <div className="absolute top-6 left-6 bottom-6 z-10 flex flex-col">
        <h3 className="text-lg font-semibold text-foreground mb-4">How You Stack Up</h3>
        <div className="flex flex-col gap-2">
          <span className="text-5xl font-bold tracking-tighter text-foreground leading-none">
            Top {displayValue}%
          </span>
          <p
            key={messageKey}
            className="text-md text-foreground/70 leading-snug font-medium max-w-[45%] animate-in fade-in duration-500"
          >
            {currentMessage}
          </p>
        </div>
      </div>

      {/* Gauge Container */}
      <div className="absolute bottom-0 right-0">
        <div className="relative" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="overflow-visible"
          >
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" /> {/* Blue */}
                <stop offset="100%" stopColor="#f97316" /> {/* Orange */}
              </linearGradient>
            </defs>
            {/* Background Track */}
            <path
              d={`M ${stroke} ${center} A ${radius} ${radius} 0 0 1 ${center} ${stroke}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={stroke}
              className="text-muted/20"
              strokeLinecap="round"
            />
            {/* Value Track */}
            <path
              d={`M ${stroke} ${center} A ${radius} ${radius} 0 0 1 ${center} ${stroke}`}
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth={stroke}
              strokeLinecap="round"
            />
            {/* Indicator Line */}
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth={4}
              className="text-foreground"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

const SummaryModules = ({
  askCard,
  onAsk,
}: {

  askCard: AskForHelpCard;
  onAsk: () => void;
}) => (
  <section className="grid gap-4 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
    <ImpactSummary />
    <PerformanceGauge />
    <article className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
          <Hand className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">{askCard.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{askCard.subtitle}</p>
        </div>
      </div>
      <div className="mt-6 flex flex-row items-center gap-2">
        <Button onClick={onAsk} className="flex-1 font-medium">
          {askCard.cta}
        </Button>
        <Button variant="ghost" className="flex-1 font-medium text-primary hover:text-primary/80 hover:bg-transparent px-1" asChild>
          <a href="/trusted-list/interactions?tab=my-requests">
            See my requests →
          </a>
        </Button>
      </div>
    </article>
    {summaryHighlights.slice(2).map((highlight) => (
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
  </section>
);

const RecommendationBanner = () => (
  <section className="flex flex-col items-center justify-center gap-2 pt-3 pb-4 px-4 text-center">
    <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-3xl">
      Know someone who belongs on The Trusted List?
    </h2>
    <Button variant="link" className="h-auto px-0 text-xl hover:no-underline font-medium group">
      Recommend a Member
      <ChevronRight className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
    </Button>
  </section>
);

export default AppShell;

type AskMode = "contact" | "circle" | "list";

const AskForHelpDialog = ({
  open,
  onOpenChange,
  contacts,
  onSendRequest,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: AskContact[];
  onSendRequest?: (payload: {
    shortDescription: string;
    requestDetails: string;
    requestCategory: string;
    askMode: AskMode;
    selectedContacts: AskContact[];
    endDateEnabled: boolean;
    endDate?: Date;
  }) => void;
}) => {
  const [shortDescription, setShortDescription] = React.useState("");
  const [askMode, setAskMode] = React.useState<AskMode>("contact");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedContacts, setSelectedContacts] = React.useState<AskContact[]>(
    []
  );
  const [requestCategory, setRequestCategory] = React.useState("");
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
    requestCategory.trim().length > 0 &&
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
    onSendRequest?.({
      shortDescription: shortDescription.trim(),
      requestDetails: requestDetails.trim(),
      requestCategory: requestCategory.trim(),
      askMode,
      selectedContacts: [...selectedContacts],
      endDateEnabled,
      endDate,
    });
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
          <div className="mt-4 rounded-lg bg-muted p-1 text-[13px] font-medium">
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
                  className={`rounded-md px-3 py-1.5 transition-all duration-200 ease-in-out ${askMode === option.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground/80"
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full text-muted-foreground hover:text-foreground"
                        onClick={() => handleRemoveContact(contact.id)}
                        aria-label={`Remove ${contact.name}`}
                      >
                        ×
                      </Button>
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

          <div className="space-y-2">
            <Label htmlFor="request-category">Request category</Label>
            <Select value={requestCategory} onValueChange={setRequestCategory}>
              <SelectTrigger id="request-category" className="mt-1">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="career-advice">Career Advice</SelectItem>
                <SelectItem value="introduction">Introduction/Networking</SelectItem>
                <SelectItem value="resume-review">Resume/Portfolio Review</SelectItem>
                <SelectItem value="interview-prep">Interview Preparation</SelectItem>
                <SelectItem value="general-support">General Support</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-5">
            <Label htmlFor="request-details">Request details</Label>
            <Textarea
              id="request-details"
              placeholder="Ask specifically what you need help with…"
              rows={5}
              className="placeholder:text-muted-foreground/50 shadow-sm mt-1 border border-border bg-transparent"
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
                    className="!w-auto h-77 p-0"
                    align="start"
                    side="top"
                    sideOffset={8}
                    avoidCollisions={false}
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
                  <Send className="mr-1 h-4 w-4" />
                  Send request
                </>
              )}
              {sendState === "sending" && (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Sending…
                </>
              )}
              {sendState === "success" && (
                <>
                  <Check className="mr-1 h-4 w-4" />
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

export { AskForHelpDialog };
