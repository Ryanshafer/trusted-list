import React from "react";
import dashboardData from "../../../data/dashboard-content.json";
import { AppSidebar } from "@/components/app-sidebar";
import { HelpRequestCard } from "@/features/dashboard/components/HelpRequestCards";
import type { CardData, SectionKey } from "@/features/dashboard/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LayoutGrid, List } from "lucide-react";

type DashboardContent = {
  helpSections: Record<SectionKey, { title: string; batches: CardData[][] }>;
};

const content = dashboardData as DashboardContent;
const helpSectionData = content.helpSections;

const allRequests: CardData[] = Object.values(helpSectionData)
  .map((section) => section.batches.flat())
  .flat();

const categoryOptions = [
  { value: "career", label: "Career development" },
  { value: "design", label: "Design" },
  { value: "product", label: "Product thinking" },
  { value: "business", label: "Business & finance" },
  { value: "health", label: "Wellness & lifestyle" },
  { value: "education", label: "Learning" },
  { value: "tech", label: "Dev & tools" },
  { value: "network", label: "Networking" },
  { value: "other", label: "Other" },
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

const buildCategoryRequests = (slug: string) => {
  const filtered = allRequests.filter((card) => deriveCategory(card) === slug);
  if (filtered.length > 0) return filtered;
  // Mock a few requests to ensure the category isn't empty
  return [1, 2, 3].map((idx) => ({
    id: `mock-${slug}-${idx}`,
    variant: "opportunities" as const,
    name: `${slug.charAt(0).toUpperCase()}${slug.slice(1)} member ${idx}`,
    requestSummary: `Looking for help with ${slug}`,
    request: `This is a mock request in the ${slug} category to ensure there are cards to browse. Help me with a quick review or advice.`,
    relationshipTag: "Trusted List",
    primaryCTA: "Offer help",
  }));
};

export default function CategoryRequestsPage({ slug }: { slug: string }) {
  const categoryLabel = categoryOptions.find((opt) => opt.value === slug)?.label || "Requests";
  const [ageFilter, setAgeFilter] = React.useState<string>("all");
  const [layout, setLayout] = React.useState<"grid" | "list">("grid");

  const withAge = React.useMemo(() =>
    buildCategoryRequests(slug).map((card, index) => {
      const ageDays = 3 + (index % 60);
      return { card, ageDays };
    }),
  [slug]);

  const filtered = React.useMemo(() =>
    withAge
      .filter(({ ageDays }) => {
        if (ageFilter === "days") return ageDays <= 7;
        if (ageFilter === "weeks") return ageDays <= 28;
        if (ageFilter === "months") return ageDays <= 120;
        return true;
      })
      .map(({ card }) => card),
  [withAge, ageFilter]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <SidebarInset className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden">
          <div className="flex items-center gap-3 border-b bg-background px-4 py-3 lg:hidden">
            <SidebarTrigger className="border border-border" />
          </div>
          <div className="flex-1 px-4 py-8 sm:px-6 lg:px-10">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
              <header className="space-y-1">
                <div className="flex items-center gap-2 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                  <a href="/trusted-list/requests" className="hover:underline">All Requests</a>
                  <span className="text-muted-foreground">/</span>
                  <span>{categoryLabel}</span>
                </div>
                <p className="text-muted-foreground text-base">Browse requests tagged for this category.</p>
              </header>

              <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={layout === "grid" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setLayout("grid")}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={layout === "list" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setLayout("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">Age of request</Label>
                    <Select value={ageFilter} onValueChange={setAgeFilter}>
                      <SelectTrigger className="h-9 rounded-full border-border bg-background px-3">
                        <SelectValue placeholder="Age" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="days">Days old</SelectItem>
                        <SelectItem value="weeks">Weeks old</SelectItem>
                        <SelectItem value="months">Months old</SelectItem>
                        <SelectItem value="all">All time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className={layout === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
                  {filtered.map((card) => (
                    <div key={card.id} className="p-1">
                      <HelpRequestCard {...card} />
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center text-sm text-muted-foreground">
                      No requests match this filter yet.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
