"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import dashboardData from "../../data/dashboard-content.json";
import { AppSidebar } from "@/components/app-sidebar";
import { HelpRequestCard } from "@/features/dashboard/components/HelpRequestCards";
import type { CardData, SectionKey } from "@/features/dashboard/types";
import { Button } from "./ui/button";
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

type AskForHelpCard = {
  title: string;
  subtitle: string;
  cta: string;
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
  const [sectionState] = React.useState(
    () =>
      Object.fromEntries(
        sectionOrder.map((key) => [key, { cards: helpSectionData[key].batches.flat(), refreshing: false }])
      ) as Record<SectionKey, { cards: CardData[]; refreshing: boolean }>
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-muted/30">
        <AppSidebar />
        <SidebarInset className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden">
          <div className="flex items-center gap-3 border-b bg-background px-4 py-3 lg:hidden">
            <SidebarTrigger className="border border-border" />
            <p className="text-base font-semibold">The Trusted List</p>
          </div>
          <div className="flex-1 px-4 py-8 sm:px-6 lg:px-10">
            <div className="flex w-full max-w-7xl flex-col gap-8 overflow-hidden">
              <header className="space-y-3">
                <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">The Trusted List</p>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                    How can you help today?
                  </h1>
                  <p className="text-muted-foreground">See who you can support right now.</p>
                </div>
              </header>

              <SummaryModules />

              <main className="space-y-10">
                {sectionOrder.map((key) => (
                  <React.Fragment key={key}>
                    <HelpSection
                      title={helpSectionData[key].title}
                      cards={sectionState[key].cards}
                      refreshing={sectionState[key].refreshing}
                    />
                  </React.Fragment>
                ))}
                <AskForHelp />
              </main>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

type HelpSectionProps = {
  title: string;
  cards: CardData[];
  refreshing: boolean;
};

const HelpSection = ({ title, cards, refreshing }: HelpSectionProps) => {
  return (
    <section className="space-y-4">
      <SectionHeader title={title} refreshing={refreshing} />
      {refreshing ? (
        <SectionSkeleton />
      ) : (
        <div className="w-full overflow-hidden p-1">
          <Carousel opts={{ align: "start", slidesToScroll: 3 }} className="w-full">
          <CarouselContent>
            {cards.map((card) => (
              <CarouselItem key={card.id} className="px-3 sm:px-4 md:basis-1/2 xl:basis-1/3">
                <div className="h-full">
                  <HelpRequestCard {...card} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="mt-4 flex justify-end gap-2">
            <CarouselPrevious className="static translate-y-0" />
            <CarouselNext className="static translate-y-0" />
          </div>
          </Carousel>
        </div>
      )}
    </section>
  );
};

type SectionHeaderProps = {
  title: string;
  refreshing: boolean;
};

const SectionHeader = ({ title, refreshing }: SectionHeaderProps) => (
  <div className="flex items-center gap-2">
    <h2 className="text-lg font-semibold leading-tight">{title}</h2>
    {refreshing ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
  </div>
);

const SectionSkeleton = () => (
  <div className="rounded-2xl border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
    <div className="flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>Refreshing recommendations…</span>
    </div>
  </div>
);

const SummaryModules = () => {
  return (
    <section className="grid gap-4 sm:grid-cols-2">
      {summaryHighlights.map((highlight) => (
        <article key={highlight.title} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">{highlight.title}</p>
          <p className="mt-2 text-base font-semibold text-foreground">{highlight.body}</p>
        </article>
      ))}
    </section>
  );
};

const AskForHelp = () => {
  return (
    <section className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6">
      <div className="space-y-2">
        <p className="text-lg font-semibold">{askForHelpCard.title}</p>
        <p className="text-sm text-muted-foreground">{askForHelpCard.subtitle}</p>
      </div>
      <div className="mt-4">
        <Button>{askForHelpCard.cta}</Button>
      </div>
    </section>
  );
};

export default AppShell;
