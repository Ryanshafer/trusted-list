"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { BaseDialog } from "@/components/BaseDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchCombobox, type ComboboxItem } from "@/components/SearchCombobox";

// ── Types ─────────────────────────────────────────────────────────────────────

export type InvitePayload = {
  firstName: string;
  lastName: string;
  email: string;
  linkedin: string;
  knownFrom: string;
  recommendation: string;
};

// ── Mock API — replace with a real fetch when the endpoint exists ─────────────

async function searchCompanies(query: string): Promise<ComboboxItem[]> {
  await new Promise((r) => setTimeout(r, 350));
  const { default: all } = await import("../../../../data/companies.json");
  const q = query.toLowerCase();
  return (all as ComboboxItem[])
    .filter((c) => c.label.toLowerCase().includes(q))
    .slice(0, 10);
}

// ── InviteDialog ──────────────────────────────────────────────────────────────

export function InviteDialog({
  open,
  onOpenChange,
  onSubmit,
  title = "Nominate someone for The Trusted List",
  description = "Great nominations start with great contact details.",
  submitLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (payload: InvitePayload) => void;
  title?: string;
  description?: string;
  submitLabel?: string;
}) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [linkedin, setLinkedin] = React.useState("");
  const [knownFromItem, setKnownFromItem] = React.useState<ComboboxItem | null>(null);
  const [recommendation, setRecommendation] = React.useState("");

  const [errors, setErrors] = React.useState<
    Partial<
      Record<
        "firstName" | "lastName" | "email" | "knownFrom" | "recommendation",
        string
      >
    >
  >({});

  React.useEffect(() => {
    if (open) return;
    setFirstName("");
    setLastName("");
    setEmail("");
    setLinkedin("");
    setKnownFromItem(null);
    setRecommendation("");
    setErrors({});
  }, [open]);

  const name = firstName.trim();

  const clearError = (field: keyof typeof errors) =>
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const handleSubmit = () => {
    const next: typeof errors = {};
    if (!firstName.trim()) next.firstName = "First name is required";
    if (!lastName.trim()) next.lastName = "Last name is required";
    if (!email.trim()) next.email = "Email address is required";
    if (!knownFromItem) next.knownFrom = "Please tell us how you know this person";
    if (!recommendation.trim())
      next.recommendation = "A recommendation is required to nominate someone";
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    onSubmit?.({
      firstName: name,
      lastName: lastName.trim(),
      email: email.trim(),
      linkedin: linkedin.trim(),
      knownFrom: knownFromItem?.label ?? "",
      recommendation: recommendation.trim(),
    });
    onOpenChange(false);
  };

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
        {submitLabel ?? (name ? `Nominate ${name}` : "Nominate")}
      </Button>
    </div>
  );

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="xl"
      footerContent={footerContent}
    >
      <div className="flex flex-col gap-8">
        {/* Name */}
        <div className="grid grid-cols-2 gap-10">
          <div className="flex flex-col gap-1">
            <Label htmlFor="invite-first-name" className="text-sm font-medium">
              First name
            </Label>
            <Input
              id="invite-first-name"
              placeholder="First name"
              value={firstName}
              aria-invalid={!!errors.firstName}
              className={
                errors.firstName
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }
              onChange={(e) => {
                setFirstName(e.target.value);
                clearError("firstName");
              }}
            />
            {errors.firstName && (
              <p className="text-xs text-destructive">{errors.firstName}</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="invite-last-name" className="text-sm font-medium">
              Last name
            </Label>
            <Input
              id="invite-last-name"
              placeholder="Last name"
              value={lastName}
              aria-invalid={!!errors.lastName}
              className={
                errors.lastName
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }
              onChange={(e) => {
                setLastName(e.target.value);
                clearError("lastName");
              }}
            />
            {errors.lastName && (
              <p className="text-xs text-destructive">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Email — full row */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="invite-email" className="text-sm font-medium">
            Email address
          </Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="first.last@email.com"
            value={email}
            aria-invalid={!!errors.email}
            className={`max-w-[calc(50%-20px)]${errors.email ? " border-destructive focus-visible:ring-destructive" : ""}`}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError("email");
            }}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email}</p>
          )}
        </div>

        {/* LinkedIn + Where do you know them from */}
        <div className="grid grid-cols-2 gap-10">
          <div className="flex flex-col gap-1">
            <Label className="text-sm font-medium">
              Where do you know them from?
            </Label>
            <SearchCombobox
              searchFn={searchCompanies}
              selectedLabel={knownFromItem?.label ?? null}
              selectedValue={knownFromItem?.value}
              placeholder="Search companies…"
              aria-invalid={!!errors.knownFrom}
              onSelect={(item) => {
                setKnownFromItem(item);
                clearError("knownFrom");
              }}
            />
            {errors.knownFrom && (
              <p className="text-xs text-destructive">{errors.knownFrom}</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="invite-linkedin" className="text-sm font-medium">
              LinkedIn profile
            </Label>
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
          <Label
            htmlFor="invite-recommendation"
            className="text-sm font-medium"
          >
            {name
              ? `Write your recommendation for ${name}`
              : "Write your recommendation"}
          </Label>
          <Textarea
            id="invite-recommendation"
            placeholder="Describe what makes them exceptional. What have you seen them do that others haven't? This will appear publicly on their profile."
            value={recommendation}
            aria-invalid={!!errors.recommendation}
            className={`mt-1 resize-none${errors.recommendation ? " border-destructive focus-visible:ring-destructive" : ""}`}
            rows={4}
            onChange={(e) => {
              setRecommendation(e.target.value);
              clearError("recommendation");
            }}
          />
          {errors.recommendation && (
            <p className="text-xs text-destructive">{errors.recommendation}</p>
          )}
        </div>
      </div>
    </BaseDialog>
  );
}
