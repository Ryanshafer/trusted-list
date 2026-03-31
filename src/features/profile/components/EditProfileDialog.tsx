"use client";
import { useState } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { X, MapPin, ExternalLink, Trash2, Plus, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { JobStatusDot, JOB_STATUS_CONFIG } from "./JobStatusIndicator";
import type { ProfileData, JobStatus } from "../types";

const LINK_TYPES = ["Portfolio", "LinkedIn", "Github", "Twitter", "Other"] as const;
const SUMMARY_MAX = 220;
const NOT_LOOKING_LABEL = "Not looking";

interface LinkEntry {
  type: string;
  url: string;
}

function buildLinks(about: ProfileData["about"]): LinkEntry[] {
  const links: LinkEntry[] = [];
  if (about.websiteUrl) links.push({ type: "Portfolio", url: about.websiteUrl });
  if (about.linkedInUrl) links.push({ type: "LinkedIn", url: about.linkedInUrl });
  if (about.githubUrl) links.push({ type: "Github", url: about.githubUrl });
  return links;
}

function applyLinks(
  about: ProfileData["about"],
  links: LinkEntry[]
): ProfileData["about"] {
  const result = { ...about, websiteUrl: null as string | null, linkedInUrl: null as string | null, githubUrl: null as string | null };
  for (const link of links) {
    if (!link.url) continue;
    if (link.type === "Portfolio") result.websiteUrl = link.url;
    else if (link.type === "LinkedIn") result.linkedInUrl = link.url;
    else if (link.type === "Github") result.githubUrl = link.url;
  }
  return result;
}


interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileData;
  availableSkills?: string[];
  onSave: (updated: ProfileData) => void;
}

export function EditProfileDialog({
  open,
  onOpenChange,
  profile,
  availableSkills = [],
  onSave,
}: EditProfileDialogProps) {
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [jobStatus, setJobStatus] = useState<string>(profile.jobStatus ?? "none");
  const [skills, setSkills] = useState<[string, string, string]>([
    profile.verifiedSkills[0] ?? "none",
    profile.verifiedSkills[1] ?? "none",
    profile.verifiedSkills[2] ?? "none",
  ]);
  const [bio, setBio] = useState(profile.about.bio);
  const [location, setLocation] = useState(profile.about.location);
  const [links, setLinks] = useState<LinkEntry[]>(() => buildLinks(profile.about));

  function handleSkillChange(index: 0 | 1 | 2, value: string) {
    setSkills((prev) => {
      const next = [...prev] as [string, string, string];
      next[index] = value;
      return next;
    });
  }

  function handleLinkChange(index: number, field: "type" | "url", value: string) {
    setLinks((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }

  function handleRemoveLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddLink() {
    setLinks((prev) => [...prev, { type: "Portfolio", url: "" }]);
  }

  function handleSave() {
    const resolvedStatus: JobStatus =
      jobStatus === "none" ? null : (jobStatus as JobStatus);
    const updatedProfile: ProfileData = {
      ...profile,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      jobStatus: resolvedStatus,
      verifiedSkills: skills.filter(v => v !== "none"),
      about: applyLinks({ ...profile.about, bio, location }, links),
    };
    onSave(updatedProfile);
    onOpenChange(false);
  }

  const isJobOpen = jobStatus !== "none";

  // Filter out skills already selected in other slots
  const getFilteredOptions = (currentIndex: number) => {
    return availableSkills.filter(skill => {
      const isSelectedElsewhere = skills.some((s, i) => i !== currentIndex && s === skill);
      return !isSelectedElsewhere;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[672px] p-0 gap-0 overflow-hidden rounded-2xl [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="font-serif text-2xl font-normal leading-8">Edit Profile</h2>
          <DialogClose asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full border-border bg-muted font-semibold"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto max-h-[calc(100vh-220px)] px-6 pt-4 pb-6 flex flex-col gap-8">

          {/* First name + Last name */}
          <div className="grid grid-cols-2 gap-10">
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">First name</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Last name</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          {/* Job status */}
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium w-[120px] shrink-0">Job status:</span>
            <Select value={jobStatus} onValueChange={setJobStatus}>
              <SelectTrigger className="w-auto gap-2 rounded-lg border-border h-9 px-3">
                {isJobOpen && (
                  <JobStatusDot status={jobStatus as NonNullable<JobStatus>} />
                )}
                <SelectValue>
                  {isJobOpen ? JOB_STATUS_CONFIG[jobStatus as NonNullable<JobStatus>].label : NOT_LOOKING_LABEL}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not looking</SelectItem>
                <SelectItem value="open_to_right_role">Open to talking</SelectItem>
                <SelectItem value="actively_looking">Actively looking</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Trusted for */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">Trusted for</span>
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="What trusted skills means"
                      className="inline-flex h-4 w-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-64 overflow-visible bg-black text-muted shadow-md">
                    <span>
                      Trusted skills are skills that have been vouched for by a member. We
                      limit the display to 3 skills.
                    </span>
                    <TooltipPrimitive.Arrow className="" />
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {([0, 1, 2] as const).map((i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm font-medium w-[120px] shrink-0 text-secondary-foreground">
                  Skill #{i + 1}:
                </span>
                <Select value={skills[i]} onValueChange={(v) => handleSkillChange(i, v)}>
                  <SelectTrigger className="w-[196px] rounded-lg border-border h-9 px-3">
                    <SelectValue placeholder="Select a skill" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {getFilteredOptions(i).map((skill) => (
                      <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Summary</Label>
              <span className="text-sm text-muted-foreground">
                <span className="text-foreground">{bio.length}</span>/{SUMMARY_MAX}
              </span>
            </div>
            <Textarea
              value={bio}
              onChange={(e) => {
                if (e.target.value.length <= SUMMARY_MAX) setBio(e.target.value);
              }}
              className="h-[76px] resize-none"
            />
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1">
            <Label className="text-sm font-medium">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3">
            <Label className="text-sm font-medium">Links</Label>
            {links.map((link, i) => (
              <div key={i} className="flex items-center gap-3">
                <Select
                  value={link.type}
                  onValueChange={(v) => handleLinkChange(i, "type", v)}
                >
                  <SelectTrigger className="w-[120px] shrink-0 rounded-lg border-border h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LINK_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  className="flex-1"
                  value={link.url}
                  onChange={(e) => handleLinkChange(i, "url", e.target.value)}
                  placeholder="https://"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground shrink-0"
                  onClick={() => link.url && window.open(link.url, "_blank")}
                  type="button"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only">Open link</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full text-destructive hover:text-destructive shrink-0"
                  onClick={() => handleRemoveLink(i)}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remove link</span>
                </Button>
              </div>
            ))}
            <div className="flex justify-center pt-1">
              <Button
                variant="outline"
                className="rounded-full font-semibold h-8 px-3 text-sm gap-1.5 border-border"
                onClick={handleAddLink}
                type="button"
              >
                <Plus className="h-4 w-4" />
                Add link
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 px-6 py-4 bg-card border-t border-border">
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
            onClick={handleSave}
            type="button"
          >
            Save profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
