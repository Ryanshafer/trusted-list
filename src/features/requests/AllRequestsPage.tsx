import React from "react";
import requestsData from "../../../data/requests.json";
import categoriesData from "../../../data/categories.json";
import { AppSidebar } from "@/components/app-sidebar";
import { CarouselSectionHeader } from "@/components/CarouselSectionHeader";
import { CardPersonRow, IncomingRequestCard, RequestCardPreview } from "@/features/dashboard/components/HelpRequestCards";
import type { CardData } from "@/features/dashboard/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { formatEndDate } from "@/lib/utils";
import {
  BadgeHelp,
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
  Tag,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type RequestCard = CardData & { category: string };
type FeaturedItem = {
  id: string;
  name: string;
  category?: string | null;
  subtitle?: string | null;
  requestSummary: string;
  request: string;
  endDate?: string | null;
  countdownHours?: number | null;
  avatarUrl?: string | null;
};

const allRequests = requestsData as RequestCard[];
const featured = {
  helpNow: (requestsData as any[]).filter((r) => r.featured === "helpNow") as FeaturedItem[],
  helpedLikeYou: (requestsData as any[]).filter((r) => r.featured === "helpedLikeYou") as FeaturedItem[],
};

// Generate category options from centralized data
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
].map(option => {
  const category = categoriesData.categories.find(c => c.slug === option.value);
  return {
    ...option,
    label: category?.displayName || option.label
  };
});

const categoryLabelMap = new Map(categoryOptions.map(({ value, label }) => [value, label]));

const carouselTitleTemplates = [
  (label: string) => `New requests in ${label}`,
  (label: string) => `Interesting requests in ${label}`,
  (label: string) => `Ways to help in ${label}`,
];

const carouselPromoTitleTemplates = [
  (label: string) => `See more in ${label}`,
  (label: string) => `Explore more ${label} requests`,
  (label: string) => `Find more ways to help in ${label}`,
];

const shuffleArray = <T,>(items: T[]) => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

export default function AllRequestsPage() {
  const [search, setSearch] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const buildCarouselCategories = () => {
    const titleTemplates = shuffleArray(carouselTitleTemplates);
    const promoTitleTemplates = shuffleArray(carouselPromoTitleTemplates);
    const availableCategories = categoryOptions
      .map(({ value, label }) => {
        const cards = allRequests.filter((card) => card.category.toLowerCase() === value);
        return { slug: value, label, cards };
      })
      .filter((category) => category.cards.length > 0);

    return shuffleArray(availableCategories)
      .slice(0, 3)
      .map((category, index) => ({
        ...category,
        title: titleTemplates[index % titleTemplates.length](category.label),
        promoTitle: promoTitleTemplates[index % promoTitleTemplates.length](category.label),
        promoCopy: `Browse more open requests in ${category.label.toLowerCase()} and find places where your experience can help.`,
      }));
  };

  const [carouselCategories, setCarouselCategories] = React.useState(() =>
    categoryOptions
      .map(({ value, label }) => ({
        slug: value,
        label,
        cards: allRequests.filter((card) => card.category.toLowerCase() === value),
      }))
      .filter((cat) => cat.cards.length > 0)
      .slice(0, 3)
      .map((cat) => ({
        ...cat,
        title: carouselTitleTemplates[0](cat.label),
        promoTitle: carouselPromoTitleTemplates[0](cat.label),
        promoCopy: `Browse more open requests in ${cat.label.toLowerCase()} and find places where your experience can help.`,
      }))
  );

  React.useEffect(() => {
    setCarouselCategories(buildCarouselCategories());
  }, []);
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
      const raw = typeof r.countdownHours === "number" ? r.countdownHours : hoursRemaining(r.endDate);
      const hours = raw === null ? 24 : raw;
      return { card: r, hours: Math.max(0, hours) };
    });
    return entries.sort((a, b) => a.hours - b.hours);
  }, []);

  const helpedLikeYou = React.useMemo(() => {
    return featured.helpedLikeYou.slice(0, 3);
  }, []);



  const handleSearchSubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const slug = slugify(trimmed);
    window.location.href = `/trusted-list/requests/search?q=${encodeURIComponent(trimmed)}#${slug}`;
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
              <header className="flex flex-col gap-1">
                <h1 className="font-serif text-5xl font-normal leading-none">Where could you help next?</h1>
                <p className="text-lg text-muted-foreground">Explore every open request on the Trusted List. Find ways you can contribute your skills.</p>
              </header>

              <section className="flex items-center gap-3 rounded-xl border border-border-50 bg-muted-25 p-4 shadow-sm">
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
                  {search && (
                    <button
                      type="button"
                      onClick={() => { setSearch(""); setShowSuggestions(false); }}
                      className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 top-full z-20 mt-2 w-full rounded-xl border border-border bg-background shadow-lg">
                      <ul className="max-h-64 overflow-auto py-2">
                        {suggestions.map((suggestion, idx) => (
                          <li key={`${suggestion}-${idx}`}>
                            <button
                              type="button"
                              className="flex w-full items-start gap-2 px-4 py-2 text-sm text-left hover:bg-muted-50"
                              onClick={() => handleSearchSubmit(suggestion)}
                            >
                              <BadgeHelp className="mt-0.5 h-4 w-4 text-muted-foreground" />
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
                      className="flex items-center gap-3 rounded-2xl border border-border bg-primary-10 px-4 py-3 text-left shadow-sm transition hover:bg-primary-25 hover:shadow-md"
                    >
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">{label}</span>
                    </a>
                  ))}
                </div>
              </section>

              {/* List Blocks: Urgent and History */}
              <div className="grid gap-16 md:grid-cols-2 mt-4 mb-12">
                {/* List 1: People who need help now */}
                <section className="space-y-3">
                  <CarouselSectionHeader title="People who need help now" count={helpNow.length} showCount={false} />
                  <div className="space-y-3">
                    {helpNow.map(({ card, hours }) => {
                      const firstName = card.name.split(" ")[0] ?? card.name;
                      const topicLabel = card.category ? categoryLabelMap.get(card.category.toLowerCase()) ?? card.category : null;
                      return (
                        <div key={card.id} className="flex flex-col gap-4 py-5 group border-b border-border-50 last:border-0">
                          <div className="space-y-3">
                            <Badge className="rounded-full bg-amber-100 text-amber-800 w-fit leading-4">
                              {hours < 1 ? "1h" : `${hours}h`} remaining
                            </Badge>
                            <RequestCardPreview
                              id={card.id}
                              requestSummary={card.requestSummary}
                              request={card.request}
                              meta={
                                topicLabel ? (
                                  <>
                                    <Tag className="h-3 w-3 shrink-0 mb-0.5" />
                                    <span>{topicLabel}</span>
                                  </>
                                ) : undefined
                              }
                            />
                          </div>
                          <CardPersonRow
                            avatarUrl={card.avatarUrl}
                            name={card.name}
                            trustedFor={card.subtitle ?? undefined}
                            action={
                              <Button
                                variant="outline"
                                className="h-10 rounded-full font-semibold border-primary px-5 text-sm leading-none text-primary"
                              >
                                Help {firstName}
                              </Button>
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* List 2: People like you have helped with... */}
                <section className="space-y-3">
                  <CarouselSectionHeader title="New requests for help" count={helpedLikeYou.length} showCount={false} />
                  <div className="space-y-3">
                    {helpedLikeYou.map((card) => {
                      const firstName = card.name.split(" ")[0] ?? card.name;
                      const topicLabel = card.category ? categoryLabelMap.get(card.category.toLowerCase()) ?? card.category : null;

                      return (
                        <div key={card.id} className="flex flex-col gap-4 py-5 group border-b border-border-50 last:border-0">
                          <div className="space-y-3">
                            {topicLabel && (
                              <Badge className="w-fit rounded-full border-blue-200 bg-blue-50 text-blue-800 font-semibold text-xs leading-4">
                                {topicLabel}
                              </Badge>
                            )}
                            <RequestCardPreview
                              id={card.id}
                              requestSummary={card.requestSummary}
                              request={card.request}
                              endDate={card.endDate}
                            />
                          </div>
                          <CardPersonRow
                            avatarUrl={card.avatarUrl}
                            name={card.name}
                            trustedFor={card.subtitle ?? undefined}
                            action={
                              <Button
                                variant="outline"
                                className="h-10 rounded-full font-semibold border-primary px-5 text-sm leading-none text-primary"
                              >
                                Help {firstName}
                              </Button>
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>

              {carouselCategories.map(({ title, slug, promoTitle, promoCopy, cards, label }) => {
                return (
                  <section key={title} className="space-y-4">
                    <CarouselSectionHeader title={title} count={cards.length} />
                    <div className="relative overflow-hidden">
                      <Carousel opts={{ align: "start", slidesToScroll: 3 }} className="w-full">
                        <CarouselContent>
                        {cards.map((card) => (
                          <CarouselItem key={card.id} className="basis-1/3">
                            <div className="h-full px-2 pb-4">
                              <IncomingRequestCard {...card} />
                            </div>
                          </CarouselItem>
                        ))}
                        <CarouselItem className="basis-1/3">
                          <div className="h-full px-2 pb-4">
                            <div className="flex h-full flex-col items-center justify-center gap-3 rounded-3xl border border-primary-25 bg-primary-25 p-6 text-center shadow-sm">
                              <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                                  Explore {label}
                                </p>
                                <h3 className="text-lg font-bold text-foreground">{promoTitle}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {promoCopy}
                                </p>
                              </div>
                              <div className="mt-2">
                                <Button asChild className="rounded-full font-semibold leading-none">
                                  <a href={`/trusted-list/requests/${slug}`}>See all {slug} requests</a>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CarouselItem>
                        </CarouselContent>
                        <CarouselPrevious className="-left-8 top-1/2 h-8 w-8 -translate-y-1/2 bg-primary/10 text-primary shadow-sm hover:shadow-md" />
                        <CarouselNext className="-right-8 top-1/2 h-8 w-8 -translate-y-1/2 bg-primary/10 text-primary shadow-sm hover:shadow-md" />
                      </Carousel>
                    </div>
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
