import React from "react";
import dashboardData from "../../../data/dashboard-content.json";
import { AppSidebar } from "@/components/app-sidebar";
import { HelpRequestCard } from "@/features/dashboard/components/HelpRequestCards";
import type { CardData, SectionKey } from "@/features/dashboard/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import {
  Briefcase,
  Clapperboard,
  PenTool,
  Cpu,
  Wallet,
  HeartPulse,
  GraduationCap,
  Rocket,
  Coffee,
  Search,
} from "lucide-react";

type DashboardContent = {
  helpSections: Record<SectionKey, { title: string; batches: CardData[][] }>;
};

const content = dashboardData as DashboardContent;
const helpSectionData = content.helpSections;

const allRequests: CardData[] = Object.values(helpSectionData)
  .map((section) => section.batches.flat())
  .flat();

const categoryOptions = [
  { value: "career", label: "Career development", icon: Briefcase },
  { value: "design", label: "Design", icon: PenTool },
  { value: "product", label: "Product thinking", icon: Rocket },
  { value: "business", label: "Business & finance", icon: Wallet },
  { value: "health", label: "Wellness & lifestyle", icon: HeartPulse },
  { value: "education", label: "Learning", icon: GraduationCap },
  { value: "tech", label: "Dev & tools", icon: Cpu },
  { value: "network", label: "Networking", icon: Coffee },
  { value: "other", label: "Other", icon: Clapperboard },
];

const deriveCategory = (card: CardData) => {
  const haystack = `${card.requestSummary ?? ""} ${card.request}`.toLowerCase();
  if (haystack.match(/career|interview|manager|promotion/)) return "career";
  if (haystack.match(/design|ux|ui|figma|research/)) return "design";
  if (haystack.match(/product|strategy|roadmap|vision/)) return "product";
  if (haystack.match(/finance|budget|fundraise|pricing/)) return "business";
  if (haystack.match(/health|wellness|lifestyle|balance/)) return "health";
  if (haystack.match(/learn|education|study|school/)) return "education";
  if (haystack.match(/dev|engineer|code|tools|tech/)) return "tech";
  if (haystack.match(/network|connect|introduce|coffee/)) return "network";
  if (card.variant === "opportunities") return "product";
  return "other";
};

const categorySlices = [
  {
    title: "Requests for career development",
    filter: (card: CardData) => deriveCategory(card) === "career",
    slug: "career",
    promoTitle: "Help someone level up",
    promoCopy: "Browse open requests from members preparing for interviews, promotions, and new roles.",
  },
  {
    title: "Questions about UX design methodology",
    filter: (card: CardData) => deriveCategory(card) === "design",
    slug: "design",
    promoTitle: "Share your design craft",
    promoCopy: "Find designers asking for critique, systems feedback, and research ideas.",
  },
  {
    title: "Looking for new opportunities",
    filter: (card: CardData) => deriveCategory(card) === "product",
    slug: "product",
    promoTitle: "Open doors for product builders",
    promoCopy: "Explore opportunities where intros, pitch practice, or GTM advice can help.",
  },
];

export default function AllRequestsPage() {
  const [search, setSearch] = React.useState("");
  const term = search.toLowerCase();
  const matchesSearch = (card: CardData) => {
    if (!term) return true;
    const haystack = `${card.name} ${card.requestSummary ?? ""} ${card.request}`.toLowerCase();
    return haystack.includes(term);
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
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
              <header className="space-y-3">
                <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                  Where could you help next?
                </h1>
                <p className="text-muted-foreground">
                  Explore every open request on the Trusted List. Find ways you can contribute your skills.
                </p>
              </header>

              <section className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 p-4 shadow-sm">
                <div className="flex flex-1 items-center gap-3 rounded-full border border-border bg-background px-4 py-2 shadow-sm">
                  <Search className="h-5 w-5 text-muted-foreground" />
                  <Input
                    id="search-requests"
                    placeholder="Search for ways to help"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 border-0 bg-transparent p-0 text-base focus-visible:ring-0 shadow-none"
                  />
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Categories</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryOptions.map(({ value, label, icon: Icon }) => (
                    <a
                      key={value}
                      href={`/trusted-list/requests/${value}`}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-sm transition hover:bg-muted/60"
                    >
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">{label}</span>
                    </a>
                  ))}
                </div>
              </section>

              {categorySlices.map(({ title, filter, slug, promoTitle, promoCopy }) => {
                const cards = allRequests.filter((card) => filter(card) && matchesSearch(card));
                if (!cards.length) return null;
                return (
                  <section key={title} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{title}</h3>
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {cards.length}
                        </span>
                      </div>
                    </div>
                    <Carousel opts={{ align: "start", slidesToScroll: 2 }} className="w-full overflow-hidden">
                      <CarouselContent>
                        {cards.map((card) => (
                          <CarouselItem key={card.id} className="px-2 sm:px-3 md:basis-1/2 xl:basis-1/3">
                            <div className="h-full p-1">
                              <HelpRequestCard {...card} />
                            </div>
                          </CarouselItem>
                        ))}
                        <CarouselItem className="px-2 sm:px-3 md:basis-1/2 xl:basis-1/3">
                          <div className="h-full p-1">
                            <div className="flex h-full flex-col items-center justify-center gap-3 rounded-3xl border border-primary/30 bg-primary/20 p-6 text-center shadow-sm">
                              <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                                  Explore {title}
                                </p>
                                <h3 className="text-lg font-bold text-foreground">{promoTitle}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {promoCopy}
                                </p>
                              </div>
                              <div className="mt-2">
                                <Button asChild>
                                  <a href={`/trusted-list/requests/${slug}`}>See all {slug} requests</a>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CarouselItem>
                      </CarouselContent>
                      <div className="mt-3 flex justify-end gap-2 p-1">
                        <CarouselPrevious className="static translate-y-0" />
                        <CarouselNext className="static translate-y-0" />
                      </div>
                    </Carousel>
                  </section>
                );
              })}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
