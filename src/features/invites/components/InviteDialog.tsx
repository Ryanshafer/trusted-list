"use client";

import * as React from "react";
import { X, ChevronsUpDown, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BaseDialog } from "@/components/BaseDialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ── Types ─────────────────────────────────────────────────────────────────────

export type InvitePayload = {
  firstName: string;
  lastName: string;
  email: string;
  linkedin: string;
  knownFrom: string;
  recommendation: string;
};

type Company = { value: string; label: string };

// ── Mock API — replace with a real fetch when the endpoint exists ─────────────

async function searchCompanies(query: string): Promise<Company[]> {
  await new Promise((r) => setTimeout(r, 350));
  const { default: all } = await import("../../../../data/companies.json");
  const q = query.toLowerCase();
  return (all as Company[]).filter((c) => c.label.toLowerCase().includes(q)).slice(0, 10);
}

// ── InviteDialog ──────────────────────────────────────────────────────────────

export function InviteDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (payload: InvitePayload) => void;
}) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [linkedin, setLinkedin] = React.useState("");
  const [knownFrom, setKnownFrom] = React.useState("");
  const [knownFromOther, setKnownFromOther] = React.useState("");
  const [companyOpen, setCompanyOpen] = React.useState(false);
  const [recommendation, setRecommendation] = React.useState("");

  const [companyQuery, setCompanyQuery] = React.useState("");
  const [companyResults, setCompanyResults] = React.useState<Company[]>([]);
  const [companyLoading, setCompanyLoading] = React.useState(false);

  const [errors, setErrors] = React.useState<Partial<Record<"firstName" | "lastName" | "email" | "knownFrom" | "recommendation", string>>>({});

  React.useEffect(() => {
    if (open) return;
    setFirstName("");
    setLastName("");
    setEmail("");
    setLinkedin("");
    setKnownFrom("");
    setKnownFromOther("");
    setCompanyOpen(false);
    setCompanyQuery("");
    setCompanyResults([]);
    setRecommendation("");
    setErrors({});
  }, [open]);

  // Debounced typeahead — fires 300 ms after the user stops typing
  React.useEffect(() => {
    const query = companyQuery.trim();
    if (query.length < 2) {
      setCompanyResults([]);
      setCompanyLoading(false);
      return;
    }
    setCompanyLoading(true);
    const timer = setTimeout(async () => {
      const results = await searchCompanies(query);
      setCompanyResults(results);
      setCompanyLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [companyQuery]);

  const name = firstName.trim();
  const resolvedKnownFrom = knownFrom === "other" ? knownFromOther.trim() : knownFrom;

  const selectedCompanyLabel = React.useMemo(() => {
    if (!knownFrom || knownFrom === "other") return null;
    return companyResults.find((c) => c.value === knownFrom)?.label ?? knownFrom;
  }, [knownFrom, companyResults]);

  const clearError = (field: keyof typeof errors) =>
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });

  const handleSubmit = () => {
    const next: typeof errors = {};
    if (!firstName.trim()) next.firstName = "First name is required";
    if (!lastName.trim()) next.lastName = "Last name is required";
    if (!email.trim()) next.email = "Email address is required";
    if (!knownFrom) next.knownFrom = "Please tell us how you know this person";
    if (!recommendation.trim()) next.recommendation = "A recommendation is required to nominate someone";
    if (Object.keys(next).length > 0) { setErrors(next); return; }

    onSubmit?.({
      firstName: name,
      lastName: lastName.trim(),
      email: email.trim(),
      linkedin: linkedin.trim(),
      knownFrom: resolvedKnownFrom,
      recommendation: recommendation.trim(),
    });
    onOpenChange(false);
  };

  const showIdle = companyQuery.trim().length < 2;
  const showLoading = !showIdle && companyLoading;
  const showEmpty = !showIdle && !companyLoading && companyResults.length === 0;

  const footerContent = (
    <div className="flex items-center justify-end gap-4">
      <Button
        variant="ghost"
        className="rounded-full font-semibold"
        onClick={() => onOpenChange(false)}
        type="button"
      >
        Cancel
      </Button>
      <Button
        className="rounded-full font-semibold"
        onClick={handleSubmit}
        type="button"
      >
        {name ? `Nominate ${name}` : "Nominate"}
      </Button>
    </div>
  );

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nominate someone for The Trusted List"
      description="Great nominations start with great contact details."
      size="xl"
      footerContent={footerContent}
    >
      <div className="flex flex-col gap-8">
        {/* Name */}
        <div className="grid grid-cols-2 gap-10">
          <div className="flex flex-col gap-1">
            <Label htmlFor="invite-first-name" className="text-sm font-medium">First name</Label>
            <Input
              id="invite-first-name"
              placeholder="First name"
              value={firstName}
              aria-invalid={!!errors.firstName}
              className={errors.firstName ? "border-destructive focus-visible:ring-destructive" : ""}
              onChange={(e) => { setFirstName(e.target.value); clearError("firstName"); }}
            />
            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="invite-last-name" className="text-sm font-medium">Last name</Label>
            <Input
              id="invite-last-name"
              placeholder="Last name"
              value={lastName}
              aria-invalid={!!errors.lastName}
              className={errors.lastName ? "border-destructive focus-visible:ring-destructive" : ""}
              onChange={(e) => { setLastName(e.target.value); clearError("lastName"); }}
            />
            {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
          </div>
        </div>

        {/* Email — full row */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="invite-email" className="text-sm font-medium">Email address</Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="first.last@email.com"
            value={email}
            aria-invalid={!!errors.email}
            className={`max-w-[calc(50%-20px)]${errors.email ? " border-destructive focus-visible:ring-destructive" : ""}`}
            onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        {/* LinkedIn + Where do you know them from */}
        <div className="grid grid-cols-2 gap-10">
          <div className="flex flex-col gap-1">
            <Label className="text-sm font-medium">Where do you know them from?</Label>
            <Popover open={companyOpen} onOpenChange={setCompanyOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={companyOpen}
                  aria-invalid={!!errors.knownFrom}
                  className={`w-full justify-between font-normal bg-background hover:bg-background rounded-md h-9 px-3 ${errors.knownFrom ? "border-destructive focus-visible:ring-destructive" : "border-input"}`}
                >
                  <span className={knownFrom && knownFrom !== "other" ? "text-foreground" : "text-muted-foreground"}>
                    {selectedCompanyLabel ?? (knownFrom === "other" ? "Other" : "Search companies…")}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Type to search…"
                    value={companyQuery}
                    onValueChange={setCompanyQuery}
                  />
                  <CommandList className="max-h-[220px] overflow-y-auto">
                    {showIdle && (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        Type at least 2 characters to search
                      </p>
                    )}
                    {showLoading && (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {showEmpty && (
                      <CommandEmpty>No companies found.</CommandEmpty>
                    )}
                    {!showIdle && !showLoading && companyResults.length > 0 && (
                      <CommandGroup>
                        {companyResults.map((company) => (
                          <CommandItem
                            key={company.value}
                            value={company.value}
                            onSelect={() => {
                              setKnownFrom(company.value);
                              setKnownFromOther("");
                              setCompanyOpen(false);
                              clearError("knownFrom");
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${knownFrom === company.value ? "opacity-100" : "opacity-0"}`}
                            />
                            {company.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                  <CommandSeparator />
                  <div className="p-1">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() => { setKnownFrom("other"); setCompanyOpen(false); clearError("knownFrom"); }}
                    >
                      <Check className={`h-4 w-4 shrink-0 ${knownFrom === "other" ? "opacity-100" : "opacity-0"}`} />
                      Other
                    </button>
                  </div>
                </Command>
              </PopoverContent>
            </Popover>
            {knownFrom === "other" && (
              <Input
                placeholder="Enter your answer…"
                value={knownFromOther}
                onChange={(e) => setKnownFromOther(e.target.value)}
                className="mt-1"
                autoFocus
              />
            )}
            {errors.knownFrom && <p className="text-xs text-destructive">{errors.knownFrom}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="invite-linkedin" className="text-sm font-medium">LinkedIn profile</Label>
            <Input
              id="invite-linkedin"
              placeholder="https://www.linkedin.com/in/username"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
            />
          </div>
        </div>

        {/* Recommendation */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="invite-recommendation" className="text-sm font-medium">
            {name ? `Write your recommendation for ${name}` : "Write your recommendation"}
          </Label>
          <Textarea
            id="invite-recommendation"
            placeholder="Describe what makes them exceptional. What have you seen them do that others haven't? This will appear publicly on their profile."
            value={recommendation}
            aria-invalid={!!errors.recommendation}
            className={`mt-1 resize-none${errors.recommendation ? " border-destructive focus-visible:ring-destructive" : ""}`}
            rows={4}
            onChange={(e) => { setRecommendation(e.target.value); clearError("recommendation"); }}
          />
          {errors.recommendation && <p className="text-xs text-destructive">{errors.recommendation}</p>}
        </div>
      </div>
    </BaseDialog>
  );
}
