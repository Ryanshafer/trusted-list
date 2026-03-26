"use client";

import * as React from "react";

import dashboardData from "../../data/dashboard-content.json";
import dashboardLayout from "../../data/dashboard-layout.json";
import requestsData from "../../data/requests.json";
import invitesData from "../../data/invites.json";
import { AppSidebar } from "@/components/app-sidebar";
import { CarouselSectionHeader } from "@/components/CarouselSectionHeader";
import { IncomingRequestCard } from "@/features/dashboard/components/HelpRequestCards";
import type { CardData, SectionKey } from "@/features/dashboard/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Check, CircleHelp, IterationCcw, ChevronRight, HeartHandshake } from "lucide-react";
import { Badge } from "./ui/badge";
import { HELP_CATEGORIES } from "@/features/requests/components/HelpRequestDialog";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "./ui/empty";
import { AskForHelpDialog, type AskContact } from "@/features/requests/components/HelpRequestDialog";
import { interactions } from "@/features/interactions/data";
import { RotateWords } from "./anim/rotate-words";
import { AnimatePresence, motion } from "framer-motion";
import { TrustParticleField } from "./TrustParticleField";
import currentUser from "../../data/current-user.json";


import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "./ui/sidebar";

type AskForHelpCard = {
  title: string;
  subtitle: string;
  cta: string;
  contacts: AskContact[];
  companies?: string[];
};

type DashboardContent = {
  askForHelpCard: AskForHelpCard;
};

const content = dashboardData as DashboardContent;
const askForHelpCard = content.askForHelpCard;

const requestMap = new Map((requestsData as CardData[]).map((r) => [r.id, r]));
const helpSectionData = Object.fromEntries(
  Object.entries(dashboardLayout.sections).map(([key, section]) => [
    key,
    {
      title: section.title,
      cards: section.batches.flat().map((id) => requestMap.get(id)).filter(Boolean) as CardData[],
    },
  ])
) as Record<SectionKey, { title: string; cards: CardData[] }>;
const sectionOrder: SectionKey[] = ["contact", "circle", "community"];
const firstSectionAnchorId = "requests-for-your-help";

const getGreetingForNow = () => {
  const hours = new Date().getHours();
  if (hours < 12) return "Good morning";
  if (hours < 18) return "Good afternoon";
  return "Good evening";
};

const AppShell = () => {
  const [sections, setSections] = React.useState<
    Record<SectionKey, { cards: CardData[] }>
  >(
    () =>
      Object.fromEntries(
        sectionOrder.map((key) => {
          // Filter out cards where endDate has passed
          const activeCards = helpSectionData[key].cards
            .filter((card: CardData) => {
              if (!card.endDate) return true;
              return new Date(card.endDate).getTime() > Date.now();
            })
            .sort((a: CardData, b: CardData) => {
              // Cards without deadlines go to the end
              if (!a.endDate && !b.endDate) return 0;
              if (!a.endDate) return 1;
              if (!b.endDate) return -1;

              // Sort by deadline (soonest first)
              return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
            });

          return [
            key,
            { cards: activeCards },
          ];
        })
      ) as Record<SectionKey, { cards: CardData[] }>
  );

  const [askDialogOpen, setAskDialogOpen] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false);
  const introRequestCount =
    (sections.contact?.cards.length ?? 0) +
    (sections.circle?.cards.length ?? 0);
  const greetingWords = ["morning,", "afternoon,", "evening,"];
  const greetingTargetIndex = React.useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return 0;
    if (hours < 18) return 1;
    return 2;
  }, []);

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
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden">
          <div className="flex items-center gap-3 border-b bg-background px-4 py-3 lg:hidden">
            <SidebarTrigger className="border border-border" />
          </div>
          <div className="flex-1 px-4 py-8 sm:px-6 lg:px-10">
            <div className="mx-auto flex w-full flex-col gap-8">
              <header className="flex flex-col items-start gap-4 py-3">
                <div className="flex w-full flex-col gap-1">
                  <div className="flex flex-wrap items-start gap-2">
                    <RotateWords
                      text="Good"
                      words={greetingWords}
                      initialIndex={0}
                      targetIndex={greetingTargetIndex}
                      className="font-serif text-3xl font-normal leading-10 text-foreground"
                      wordClassName="font-serif text-3xl font-normal leading-10 text-foreground"
                      intervalMs={600}
                      startDelayMs={0}
                      animateInitial={false}
                    />
                    <span className="font-serif text-3xl font-normal leading-10 text-foreground">
                      {currentUser.firstName}.
                    </span>
                  </div>
                  <h3 className="font-serif text-4xl font-normal leading-none text-primary text-left sm:text-5xl">
                    How can you help today?
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1 text-base text-muted-foreground sm:text-lg">
                  You've got 
                <a
                  href={`#${firstSectionAnchorId}`}
                  className="text-base sm:text-lg text-primary hover:text-primary-75 transition-colors bg-primary-10 px-1 rounded-xs"
                >
                  {introRequestCount} new requests 
                </a>
                for help from your inner circle.
                </span>
              </header>

              <TrustScoreSection />
              <div className="flex gap-6 lg:gap-8">
                <HelpRequestStartModule
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  onOpen={() => setAskDialogOpen(true)}
                />
                <InviteModule onInvite={() => setInviteDialogOpen(true)} />
              </div>

              <main className="space-y-10 mt-6">
                {sectionOrder.map((key, idx) => (
                  <HelpSection
                    key={key}
                    section={key}
                    title={helpSectionData[key].title}
                    cards={sections[key].cards}
                    onClearCard={handleClearCard}
                    anchorId={idx === 0 ? firstSectionAnchorId : undefined}
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
        userUnvouchedSkills={(currentUser as any).unvouchedSkills}
        companies={askForHelpCard.companies}
        initialCategories={selectedCategory ? [selectedCategory] : undefined}
      />
      <InviteDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} />
    </SidebarProvider>
  );
};

type HelpSectionProps = {
  section: SectionKey;
  title: string;
  cards: CardData[];
  onClearCard: (section: SectionKey, cardId: string) => void;
  anchorId?: string;
};

const HelpSection = ({
  section,
  title,
  cards,
  onClearCard,
  anchorId,
}: HelpSectionProps) => {
  return (
    <section className="space-y-4" id={anchorId}>
      <CarouselSectionHeader
        title={title}
        count={cards.length}
        showCount={section !== "community"}
        ctaLabel={section === "community" ? "Explore all open requests" : undefined}
        ctaHref={section === "community" ? "/trusted-list/requests" : undefined}
      />
      <div className="relative">
        <Carousel
          opts={{ align: "start", slidesToScroll: 3 }}
          className="w-full"
        >
          <CarouselContent>
            {cards.map((card) => (
              <CarouselItem
                key={card.id}
                className="basis-1/3"
              >
                <div className="h-full px-2 pb-4">
                  <IncomingRequestCard
                    {...card}
                    onClear={() => onClearCard(section, card.id)}
                  />
                </div>
              </CarouselItem>
            ))}
            {cards.length === 0 && (
              <CarouselItem className="basis-full">
                <Empty className="min-h-[380px] mx-1">
                  <EmptyMedia variant="icon">
                    <HeartHandshake />
                  </EmptyMedia>
                  <EmptyContent>
                    <EmptyHeader>
                      <EmptyTitle>Your work here is done.</EmptyTitle>
                      <EmptyDescription>Thanks for the help! Looking for more people to support?</EmptyDescription>
                    </EmptyHeader>
                    <Button asChild className="rounded-full font-semibold px-5 leading-none">
                      <a href="/trusted-list/requests">Explore all requests</a>
                    </Button>
                  </EmptyContent>
                </Empty>
              </CarouselItem>
            )}
            {section === "community" && (
              <CarouselItem className="basis-1/3">
                <div className="h-full p-2">
                  <div className="flex h-full flex-col items-center justify-center gap-3 rounded-3xl border border-primary-25 bg-primary-25 p-6 text-center shadow-sm">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-primary">Community spotlight</p>
                      <h3 className="text-xl font-bold text-foreground">Looking for more people to help?</h3>
                      <p className="text-sm text-muted-foreground">
                        Browse every open request across the Trusted List and jump into the ones that fit you best.
                      </p>
                    </div>
                    <div className="mt-2">
                      <Button asChild className="rounded-full font-semibold leading-none">
                        <a href="/trusted-list/requests">Explore all open requests</a>
                      </Button>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            )}
          </CarouselContent>
          <CarouselPrevious className="-left-8 top-1/2 h-8 w-8 -translate-y-1/2 bg-primary/10 text-primary shadow-sm hover:shadow-md" />
          <CarouselNext className="-right-8 top-1/2 h-8 w-8 -translate-y-1/2 bg-primary/10 text-primary shadow-sm hover:shadow-md" />
        </Carousel>
      </div>
    </section>
  );
};

// ── Trust score tiers ─────────────────────────────────────────────────────────

const TRUST_TIERS = [
  { label: "Emerging", subtitle: "Starting to show up for others" },
  { label: "Reliable", subtitle: "People can count on you" },
  { label: "Trustworthy", subtitle: "Your perspective carries weight" },
  { label: "Proven", subtitle: "You continue to make a real impact" },
  { label: "Stellar", subtitle: "You're a shining example to those around you" },
];

const getInitialTierIndex = (score: number): number => {
  if (score >= 900) return 4;
  if (score >= 700) return 3;
  if (score >= 500) return 2;
  if (score >= 300) return 1;
  return 0;
};

// ── TrustScoreSection ─────────────────────────────────────────────────────────

const TrustScoreSection = () => {
  const actualTierIndex = React.useMemo(() => getInitialTierIndex(currentUser.trustScore), []);
  const [displayTierIndex, setDisplayTierIndex] = React.useState(0);
  const pendingTimeoutsRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  React.useEffect(() => {
    if (actualTierIndex === 0) return;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= actualTierIndex; i++) {
      const t = setTimeout(() => setDisplayTierIndex(i), i * 1400);
      timeouts.push(t);
    }
    pendingTimeoutsRef.current = timeouts;
    return () => timeouts.forEach(clearTimeout);
  }, [actualTierIndex]);

  const handleCycle = () => {
    pendingTimeoutsRef.current.forEach(clearTimeout);
    pendingTimeoutsRef.current = [];
    setDisplayTierIndex((i) => (i + 1) % TRUST_TIERS.length);
  };

  return (
    <article className="rounded-2xl bg-card shadow-md p-3">
      <div className="grid grid-cols-3 min-h-[275px]">
        {/* Col 1: Particle field visualization */}
        <div className="bg-primary/10 relative overflow-hidden rounded-l-lg">
          <TrustParticleField tierIndex={displayTierIndex} avatarUrl={currentUser.avatarUrl} />
        </div>

        {/* Col 2: Score module */}
        <div
          className="bg-primary/10 rounded-r-lg relative flex flex-col justify-end pb-9 pl-4 pr-4 gap-1 cursor-pointer select-none"
          onClick={handleCycle}
        >
          <button
            className="absolute top-[10px] right-[10px] rounded-full p-2.5 text-muted-foreground hover:bg-background/50 transition-colors"
            aria-label="About trust score"
            onClick={(e) => e.stopPropagation()}
          >
            <CircleHelp className="h-4 w-4" />
          </button>
          <p className="text-base text-muted-foreground">Your Trust Score</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={displayTierIndex}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="font-serif text-5xl text-primary leading-none"
            >
              {TRUST_TIERS[displayTierIndex].label}
            </motion.p>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.p
              key={displayTierIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="text-sm text-muted-foreground mt-1"
            >
              {TRUST_TIERS[displayTierIndex].subtitle}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Col 3: Opportunities list */}
        <div className="flex flex-col pl-3 py-1.5 gap-2">
          <div className="px-2 py-1">
            <p className="font-serif text-xl text-card-foreground leading-7">
              Your opportunities to follow through:
            </p>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            {interactions.inProgress.map((item) => (
              <a
                key={item.id}
                href={`/trusted-list/interactions?tab=in-progress&open=${item.id}`}
                className="group flex items-center justify-between bg-background rounded-lg shadow-sm pl-2.5 pr-1.5 py-2 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarImage src={(item as any).avatarUrl ?? undefined} />
                    <AvatarFallback className="text-xs">{item.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-lg font-semibold truncate text-card-foreground group-hover:text-primary transition-colors leading-7">
                    {(item as any).requestSummary ?? item.name}
                  </span>
                </div>
                <span className="shrink-0 rounded-full bg-secondary flex items-center justify-center h-6 w-6">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </span>
              </a>
            ))}
          </div>
          <div className="flex justify-end pr-2 pb-1">
            <Button
              variant="ghost"
              className="rounded-full font-medium text-sm text-card-foreground hover:text-primary hover:bg-primary/10 h-auto px-4 py-2 leading-none gap-2 transition-colors"
              asChild
            >
              <a href="/trusted-list/interactions?tab=in-progress">
                See all opportunities <ChevronRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
};

// ── HelpRequestStartModule ────────────────────────────────────────────────────

const HelpRequestStartModule = ({
  selectedCategory,
  setSelectedCategory,
  onOpen,
}: {
  selectedCategory: string | null;
  setSelectedCategory: (c: string | null) => void;
  onOpen: () => void;
}) => (
  <article className="flex-1 flex flex-col gap-8 rounded-2xl bg-card shadow-md p-5">
    <div className="flex flex-col gap-1">
      <h2 className="font-serif text-2xl text-foreground leading-8">What kind of help do you need?</h2>
      <p className="text-sm text-card-foreground">
        3 people in your circle helped someone with one of these categories this past week.
      </p>
    </div>
    <div className="flex flex-col gap-4 items-center pb-3">
      <p className="text-base font-semibold text-card-foreground">Pick a category to get started:</p>
      <div className="flex flex-wrap gap-4 justify-center px-12">
        {HELP_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelectedCategory(isActive ? null : cat.value)}
              className={[
                "inline-flex items-center gap-1.5 rounded-full min-h-[32px] px-3 py-1 text-sm border transition-colors",
                isActive
                  ? "bg-primary/10 border-primary text-card-foreground"
                  : "border-muted-foreground text-card-foreground hover:border-primary hover:text-primary",
              ].join(" ")}
            >
              {isActive && <Check className="h-3.5 w-3.5 shrink-0" />}
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
    <div className="flex justify-end mt-auto">
      <Button
        onClick={onOpen}
        className="rounded-full font-semibold min-h-[40px] px-6"
      >
        Request help
      </Button>
    </div>
  </article>
);

// ── Invite module data ────────────────────────────────────────────────────────

const { invitesRemaining, lastMonthNominations } = invitesData;

// ── InviteModule ──────────────────────────────────────────────────────────────

const InviteModule = ({ onInvite }: { onInvite: () => void }) => {
  const today = new Date();
  const daysLeftInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate();
  return (
  <article className="flex-1 flex flex-col justify-between rounded-2xl bg-card shadow-md p-5 gap-4">
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between w-full gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full bg-primary/10 border-2 border-white shadow-md">
            <span className="text-4xl font-semibold text-card-foreground leading-none">{invitesRemaining}</span>
          </div>
          <p className="font-serif text-2xl text-card-foreground leading-8">invites remaining this month</p>
        </div>
        <Badge variant="outline" className="rounded-full gap-1 border-border bg-background text-card-foreground font-semibold text-xs leading-4 shrink-0">
          <IterationCcw className="h-3 w-3 -translate-y-[0.5px] shrink-0" />
          Resets in {daysLeftInMonth} days
        </Badge>
      </div>
      <p className="text-sm text-card-foreground">
        Each month you get five nominations to add someone to The Trusted List — choose wisely.
      </p>
    </div>

    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last month's nominations</p>
      <div className="flex items-center gap-5">
        <div className="flex items-center pr-[12.5px]">
          {lastMonthNominations.nominees.map((person, i) => (
            <a
              key={person.name}
              href={`/trusted-list/members/${person.slug}`}
              className="group/member relative shrink-0"
              style={{ marginRight: i < lastMonthNominations.nominees.length - 1 ? -12.5 : 0, zIndex: lastMonthNominations.nominees.length - i }}
              aria-label={person.name}
            >
              <Avatar className="h-[50px] w-[50px] border-[3px] border-card shadow-md transition-colors group-hover/member:border-primary">
                <AvatarImage src={person.avatarUrl} className="object-cover" />
                <AvatarFallback className="text-sm">{person.name[0]}</AvatarFallback>
              </Avatar>
            </a>
          ))}
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-semibold text-foreground leading-snug">
            {lastMonthNominations.nominees.map((p, i) => (
              <React.Fragment key={p.name}>
                <a
                  href={`/trusted-list/members/${p.slug}`}
                  className="hover:text-primary transition-colors"
                >
                  {p.name}
                </a>
                {i < lastMonthNominations.nominees.length - 1 && ", "}
              </React.Fragment>
            ))}
          </p>
          <p className="text-sm text-muted-foreground">
            {lastMonthNominations.allJoined ? "All joined" : "Some joined"} · {lastMonthNominations.used} of {lastMonthNominations.total} used last month
          </p>
        </div>
      </div>
    </div>

    <div className="flex justify-end">
      <Button
        variant="outline"
        onClick={onInvite}
        className="rounded-full font-semibold border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent min-h-[40px] px-6"
      >
        Start your nomination
      </Button>
    </div>
  </article>
  );
};

// ── InviteDialog ──────────────────────────────────────────────────────────────

const InviteDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) => {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [linkedin, setLinkedin] = React.useState("");
  const [skills, setSkills] = React.useState<string[]>([]);
  const [skillQuery, setSkillQuery] = React.useState("");

  const skillOptions = React.useMemo(
    () => [
      "Design", "Research", "Analysis", "Engineering Management",
      "Product Strategy", "UX Writing", "Growth", "Data Science",
      "Mobile", "Infrastructure", "People Management", "Hiring",
      "Career Coaching", "Fundraising", "Storytelling",
    ],
    [],
  );

  const filteredSkills = React.useMemo(() => {
    const query = skillQuery.trim().toLowerCase();
    return skillOptions
      .filter((o) => !skills.includes(o))
      .filter((o) => (query ? o.toLowerCase().includes(query) : true))
      .slice(0, 6);
  }, [skillOptions, skills, skillQuery]);

  const addSkill = (skill: string) => {
    if (skills.includes(skill)) return;
    setSkills((prev) => [...prev, skill]);
    setSkillQuery("");
  };
  const removeSkill = (skill: string) => setSkills((prev) => prev.filter((s) => s !== skill));

  const handleSubmit = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invite someone to The Trusted List</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Great referrals start with great contact details, and a quick double-check goes a long way.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invite-first-name">First name</Label>
              <Input id="invite-first-name" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-last-name">Last name</Label>
              <Input id="invite-last-name" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input id="invite-email" type="email" placeholder="first.last@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-linkedin">LinkedIn profile</Label>
              <Input id="invite-linkedin" placeholder="https://www.linkedin.com/in/username" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-skills">Highlight their skills</Label>
            <div className="relative mt-1">
              <div
                className="min-h-[46px] w-full rounded-md border border-input bg-background p-2 flex flex-wrap items-center gap-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                onClick={() => (document.getElementById("invite-skills-input") as HTMLInputElement | null)?.focus()}
              >
                {skills.map((skill) => (
                  <span key={skill} className="inline-flex items-center gap-2 rounded-sm bg-foreground px-3 py-1 text-sm font-medium text-background">
                    {skill}
                    <button type="button" className="text-muted-foreground hover:text-background" aria-label={`Remove ${skill}`} onClick={() => removeSkill(skill)}>×</button>
                  </span>
                ))}
                <input
                  id="invite-skills-input"
                  className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground/75"
                  placeholder={skills.length === 0 ? "Start typing a skill..." : ""}
                  value={skillQuery}
                  onChange={(e) => setSkillQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && skillQuery.trim()) { e.preventDefault(); addSkill(skillQuery.trim()); }
                    if (e.key === "Backspace" && !skillQuery && skills.length) removeSkill(skills[skills.length - 1]);
                  }}
                />
              </div>
              {skillQuery.trim().length > 0 && filteredSkills.length > 0 && (
                <div className="absolute z-10 mt-2 w-full rounded-lg border border-border bg-background shadow-lg">
                  <ul className="max-h-48 overflow-auto py-2">
                    {filteredSkills.map((skill) => (
                      <li key={skill}>
                        <button type="button" className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-muted/50" onClick={() => addSkill(skill)}>
                          <span>{skill}</span>
                          <span className="text-xs text-muted-foreground">Add</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-3">
          <Button variant="ghost" className="rounded-full font-semibold leading-none" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="rounded-full font-semibold leading-none" onClick={handleSubmit} disabled={!firstName || !lastName || !email}>Invite</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppShell;

// Re-export for backward compatibility — callers that import from AppShell continue to work
export type { AskContact };
export { AskForHelpDialog };
