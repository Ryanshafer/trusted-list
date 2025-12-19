import React from "react";
import requestsData from "../../../data/requests.json";
import featuredData from "../../../data/requests-featured.json";
import { AppSidebar } from "@/components/app-sidebar";
import { HelpRequestCard } from "@/features/dashboard/components/HelpRequestCards";
import type { CardData } from "@/features/dashboard/types";
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
  Clock,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type RequestCard = CardData & { category: string };
type FeaturedItem = {
  id: string;
  name: string;
  subtitle?: string | null;
  requestSummary: string;
  request: string;
  endDate?: string | null;
  avatarUrl?: string | null;
};

const allRequests = requestsData as RequestCard[];
const featured = featuredData as { helpNow: FeaturedItem[]; helpedLikeYou: FeaturedItem[] };

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

const categorySlices = [
  {
    title: "Requests for career development",
    filter: (card: RequestCard) => card.category === "career",
    slug: "career",
    promoTitle: "Help someone level up",
    promoCopy: "Browse open requests from members preparing for interviews, promotions, and new roles.",
  },
  {
    title: "Questions about UX design methodology",
    filter: (card: RequestCard) => card.category === "design",
    slug: "design",
    promoTitle: "Share your design craft",
    promoCopy: "Find designers asking for critique, systems feedback, and research ideas.",
  },
  {
    title: "Looking for new opportunities",
    filter: (card: RequestCard) => card.category === "product",
    slug: "product",
    promoTitle: "Open doors for product builders",
    promoCopy: "Explore opportunities where intros, pitch practice, or GTM advice can help.",
  },
];

export default function AllRequestsPage() {
  const [search, setSearch] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = React.useState<Record<string, boolean>>({});
  const term = search.toLowerCase();
  const matchesSearch = (card: RequestCard) => {
    if (!term) return true;
    const haystack = `${card.name} ${card.requestSummary ?? ""} ${card.request}`.toLowerCase();
    return haystack.includes(term);
  };

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "search";

  const suggestions = React.useMemo(() => {
    if (term.length < 2) return [];
    return allRequests
      .filter(matchesSearch)
      .slice(0, 6)
      .map((card) => card.requestSummary || card.request)
      .filter(Boolean);
  }, [term]);

  const now = React.useMemo(() => Date.now(), []);
  const hoursRemaining = (endDate?: string | null) => {
    if (!endDate) return null;
    const end = new Date(endDate).getTime();
    if (Number.isNaN(end)) return null;
    const diffMs = end - now;
    const hours = Math.max(0, Math.round(diffMs / 1000 / 60 / 60));
    return hours;
  };
  const formatHoursRemaining = (endDate?: string | null) => {
    const hours = hoursRemaining(endDate);
    if (hours === null) return "No end";
    if (hours < 1) return "<1h";
    return `${hours}h`;
  };

  const helpNow = React.useMemo(() => {
    const entries = featured.helpNow.slice(0, 3).map((r) => {
      const raw = hoursRemaining(r.endDate);
      const hours = raw === null ? 24 : raw;
      return { card: r, hours: Math.max(0, hours) };
    });
    return entries.sort((a, b) => a.hours - b.hours);
  }, []);

  const helpedLikeYou = React.useMemo(() => {
    return featured.helpedLikeYou.slice(0, 3);
  }, []);

  const truncate = (value: string, len = 120) => {
    if (value.length <= len) return value;
    return `${value.slice(0, len).trim()}…`;
  };

  const formatEndDate = (value?: string | null) => {
    if (!value) return "No end date";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "No end date";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const handleSearchSubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const slug = slugify(trimmed);
    window.location.href = `/trusted-list/requests/search?q=${encodeURIComponent(trimmed)}#${slug}`;
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
                <div className="relative flex flex-1 items-center gap-3 rounded-full border border-border bg-background px-4 py-2 shadow-sm">
                  <Search className="h-5 w-5 text-muted-foreground" />
                  <Input
                    id="search-requests"
                    placeholder="Search for ways to help"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearchSubmit(search);
                      }
                    }}
                    className="h-10 border-0 bg-transparent p-0 text-base focus-visible:ring-0 shadow-none"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 top-full z-20 mt-2 w-full rounded-xl border border-border bg-background shadow-lg">
                      <ul className="max-h-64 overflow-auto py-2">
                        {suggestions.map((suggestion, idx) => (
                          <li key={`${suggestion}-${idx}`}>
                            <button
                              type="button"
                              className="flex w-full items-start gap-2 px-4 py-2 text-sm text-left hover:bg-muted/60"
                              onClick={() => handleSearchSubmit(suggestion)}
                            >
                              <Search className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <span className="text-foreground">{suggestion}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
                      className="flex items-center gap-3 rounded-2xl border border-border bg-primary/10 px-4 py-3 text-left shadow-sm transition hover:bg-primary/20 hover:shadow-md"
                    >
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">{label}</span>
                    </a>
                  ))}
                </div>
              </section>

              {/* List Blocks: Urgent and History */}
              <div className="grid gap-12 md:grid-cols-2 mt-4 mb-12">
                {/* List 1: People who need help now */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold tracking-tight">People who need help now</h3>
                  </div>
                  <div className="divide-y divide-border/50 border-t border-border/50">
                    {helpNow.map(({ card, hours }) => {
                      const firstName = card.name.split(" ")[0] ?? card.name;
                      const initials = card.name.split(" ").map((n) => n[0]).join("");
                      const isExpanded = !!expandedDescriptions[card.id];
                      return (
                        <div key={card.id} className="flex items-center gap-4 py-5 group border-b border-border/50 last:border-0">
                          <Avatar className="h-16 w-16 shrink-0 border border-border/50 shadow-sm">
                            {card.avatarUrl && <AvatarImage src={card.avatarUrl} alt={card.name} />}
                            <AvatarFallback>
                              {initials}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0 space-y-1">
                            <Badge className="rounded-full bg-emerald-100 text-emerald-800 w-fit">
                              {hours < 1 ? "1h" : `${hours}h`} remaining
                            </Badge>
                            <h4 className="font-bold text-base sm:text-lg text-foreground leading-tight">
                              {card.requestSummary}
                            </h4>
                            <p className={`text-sm text-foreground leading-snug ${isExpanded ? "" : "line-clamp-2"}`}>
                              {card.request.length > 100 ? (
                                isExpanded ? (
                                  <>
                                    {card.request}
                                    <button
                                      type="button"
                                      className="text-muted-foreground font-medium ml-1 cursor-pointer"
                                      onClick={() =>
                                        setExpandedDescriptions((prev) => ({ ...prev, [card.id]: false }))
                                      }
                                    >
                                      less
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    {card.request.slice(0, 100).trim()}
                                    <span className="text-muted-foreground">... </span>
                                    <button
                                      type="button"
                                      className="text-muted-foreground font-medium cursor-pointer"
                                      onClick={() =>
                                        setExpandedDescriptions((prev) => ({ ...prev, [card.id]: true }))
                                      }
                                    >
                                      more
                                    </button>
                                  </>
                                )
                              ) : (
                                card.request
                              )}
                            </p>
                          </div>

                          <div className="shrink-0 flex items-center justify-center min-w-[140px] self-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="font-semibold  px-8 border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-md h-8"
                            >
                              Help {firstName}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* List 2: People like you have helped with... */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold tracking-tight">New requests for help</h3>
                  </div>
                  <div className="divide-y divide-border/50 border-t border-border/50">
                    {helpedLikeYou.map((card) => {
                      const firstName = card.name.split(" ")[0] ?? card.name;
                      const initials = card.name.split(" ").map((n) => n[0]).join("");
                      const isExpanded = !!expandedDescriptions[card.id];

                      return (
                        <div key={card.id} className="flex items-center gap-4 py-6 group border-b border-border/50 last:border-0">
                          <Avatar className="h-16 w-16 shrink-0 border border-border/50 shadow-sm">
                            {card.avatarUrl && <AvatarImage src={card.avatarUrl} alt={card.name} />}
                            <AvatarFallback>
                              {initials}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              <span>Help needed until {formatEndDate(card.endDate)}</span>
                            </div>
                            <h4 className="font-bold text-base sm:text-lg text-foreground leading-tight">
                              {card.requestSummary}
                            </h4>
                            <p className={`text-sm text-foreground leading-snug ${isExpanded ? "" : "line-clamp-2"}`}>
                              {card.request.length > 80 ? (
                                isExpanded ? (
                                  <>
                                    {card.request}
                                    <button
                                      type="button"
                                      className="text-muted-foreground font-medium ml-1 cursor-pointer"
                                      onClick={() =>
                                        setExpandedDescriptions((prev) => ({ ...prev, [card.id]: false }))
                                      }
                                    >
                                      less
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    {card.request.slice(0, 80).trim()}
                                    <span className="text-muted-foreground">... </span>
                                    <button
                                      type="button"
                                      className="text-muted-foreground font-medium cursor-pointer"
                                      onClick={() =>
                                        setExpandedDescriptions((prev) => ({ ...prev, [card.id]: true }))
                                      }
                                    >
                                      more
                                    </button>
                                  </>
                                )
                              ) : (
                                card.request
                              )}
                            </p>
                          </div>

                          <div className="shrink-0 flex items-center justify-center min-w-[140px] self-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="font-semibold px-8 border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-md h-8"
                            >
                              Help {firstName}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>

              {/* Carousel 1: Career */}
              {(() => {
                const slice = categorySlices[0];
                const cards = allRequests.filter((card) => slice.filter(card));
                if (!cards.length) return null;
                return (
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{slice.title}</h3>
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
                                  Explore {slice.title}
                                </p>
                                <h3 className="text-lg font-bold text-foreground">{slice.promoTitle}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {slice.promoCopy}
                                </p>
                              </div>
                              <div className="mt-2">
                                <Button asChild>
                                  <a href={`/trusted-list/requests/${slice.slug}`}>See all {slice.slug} requests</a>
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
              })()}

              {/* Carousels 2 & 3: Design and Product */}
              {categorySlices.slice(1).map(({ title, filter, slug, promoTitle, promoCopy }) => {
                const cards = allRequests.filter((card) => filter(card));
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
