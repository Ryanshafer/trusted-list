"use client";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ArrowRightLeft, Flag, MoreHorizontal, Settings, SquarePen, UserRoundX } from "lucide-react";
import { ProfileParticleAvatar } from "./ProfileParticleAvatar";
import { TrustTierBadge } from "./TrustTierBadge";
import { JobStatusIndicator } from "./JobStatusIndicator";
import { ProfileCTAs } from "./ProfileCTAs";
import { EditProfileDialog } from "./EditProfileDialog"
import { AccountSettingsDialog } from "@/features/account";
import { UserReportDialog } from "@/features/moderation/components/UserReportDialog";
import { HelpRequestDialog, HELP_CATEGORIES, type AskContact } from "@/features/requests/components/HelpRequestDialog";
import currentUser from "../../../../data/current-user.json";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProfileData } from "../types";

const TIER_STEP_MS = 800;

function getTierIndex(score: number): number {
  if (score >= 900) return 4;
  if (score >= 700) return 3;
  if (score >= 500) return 2;
  if (score >= 300) return 1;
  return 0;
}

interface ProfileHeroProps {
  profile: ProfileData;
  isOwner: boolean;
  publicView?: boolean;
  basePath?: string;
  userEmail?: string;
  connectionDegree?: string | null;
  availableSkills?: string[];
  onProfileUpdate: (updated: ProfileData) => void;
}

export function ProfileHero({ profile, isOwner, publicView = false, basePath = "/trusted-list", userEmail, connectionDegree, availableSkills, onProfileUpdate }: ProfileHeroProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [endorsementDialogOpen, setEndorsementDialogOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const finalTierIndex = getTierIndex(profile.trustScore);
  const [currentTierIndex, setCurrentTierIndex] = useState(finalTierIndex); // TEMP: skip animation, load end state
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleUnvouchedSkills = profile.unvouchedSkills?.slice(0, 3) ?? [];
  const shouldShowUnconfirmedSkills =
    isOwner &&
    !publicView &&
    profile.verifiedSkills.length === 0 &&
    visibleUnvouchedSkills.length > 0;
  const endorsementContacts: AskContact[] = profile.circle
    .filter((member) => !member.awaiting)
    .map((member) => ({
      id: member.userId,
      name: member.name,
      role: member.verifiedSkills?.join(", ") || "Trusted List member",
      avatarUrl: member.avatarUrl ?? undefined,
    }));

  const handleRequestEndorsement = () => {
    setEndorsementDialogOpen(true);
  };

  useEffect(() => {
    return; // TEMP: animation disabled — remove this line to re-enable
    if (prefersReducedMotion) {
      setCurrentTierIndex(finalTierIndex);
      return;
    }

    let current = 0;
    setCurrentTierIndex(0);

    const step = () => {
      current += 1;
      setCurrentTierIndex(current);
      if (current < finalTierIndex) {
        timerRef.current = setTimeout(step, TIER_STEP_MS);
      }
    };

    if (finalTierIndex > 0) {
      timerRef.current = setTimeout(step, TIER_STEP_MS);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [finalTierIndex, prefersReducedMotion]);

  return (
    <>
      <div className="flex items-start gap-10 w-full">
        {/* ProfileParticleAvatar — same width as sidebar (w-md) */}
        <div className="relative shrink-0 aspect-square w-sm bg-primary/10 overflow-hidden">
          <ProfileParticleAvatar
            tierIndex={currentTierIndex}
            avatarUrl={profile.avatarUrl ?? ""}
            contentScale={0.8}
          />
          {profile.jobStatus && (
            <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
              <JobStatusIndicator status={profile.jobStatus} />
            </div>
          )}
        </div>

        {/* Profile Info Container — fills remaining width */}
        <div className="flex flex-1 flex-col self-stretch min-w-0">

          {/* Top bar: action buttons flush right */}
          <div className="flex items-start justify-end gap-3 pt-10 pr-10">
            {isOwner ? (
              <>
                {publicView ? (
                  /* On /members — switch back to private view */
                  <Button
                    variant="outline"
                    className="rounded-full h-10 px-6 text-sm font-semibold border-border text-foreground gap-2"
                    asChild
                  >
                    <a href={`${basePath}/profile`}>
                      <ArrowRightLeft className="h-4 w-4" />
                      Switch to private view
                    </a>
                  </Button>
                ) : (
                  <>
                    {/* Switch to public view */}
                    <Button
                      variant="outline"
                      className="rounded-full h-10 px-6 text-sm font-semibold border-border text-foreground gap-2"
                      asChild
                    >
                      <a href={`${basePath}/members/${profile.name.toLowerCase().replace(/\s+/g, "-")}`}>
                        <ArrowRightLeft className="h-4 w-4" />
                        Switch to public view
                      </a>
                    </Button>
                    {/* Edit button */}
                    <Button
                      variant="outline"
                      className="rounded-full h-10 px-6 text-sm font-medium border-primary text-primary hover:bg-primary hover:text-primary-foreground gap-2"
                      onClick={() => setEditOpen(true)}
                    >
                      <SquarePen className="h-4 w-4" />
                      Edit personal info
                    </Button>
                    {/* Settings icon button */}
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-border text-muted-foreground" onClick={() => setSettingsOpen(true)}>
                      <Settings className="h-4 w-4" />
                      <span className="sr-only">Settings</span>
                    </Button>
                  </>
                )}
              </>
            ) : null}
            {/* More options — visitor only */}
            {!isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-border text-muted-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {connectionDegree === "1st" && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={() => {
                        sessionStorage.setItem("circle.removed", profile.name);
                        setTimeout(() => { window.location.href = `${basePath}/profile`; }, 0);
                      }}
                    >
                      <UserRoundX className="h-4 w-4" />
                      Remove from circle
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setReportOpen(true)}>
                    <Flag className="h-4 w-4" />
                    Report user
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Profile Details Container */}
          <div className="flex flex-1 flex-col justify-end gap-8 pb-10">

            {/* Profile Details: badge + name + trusted-for + job status */}
            <div className="flex flex-col gap-3">
              {/* Tier badge (serif 2xl) + Name (serif 7xl) grouped tightly */}
              <div className="flex flex-col gap-1">
                <TrustTierBadge
                  tierIndex={currentTierIndex}
                  static
                  className="inline-flex items-center gap-1 text-2xl font-normal text-primary font-serif leading-8"
                  iconClassName="h-6 w-6 shrink-0"
                />
                <h1 className="font-serif text-7xl font-normal leading-none text-foreground">
                  {profile.name}
                </h1>
              </div>

              {/* Trusted for: label + pills on same row */}
              {profile.verifiedSkills.length > 0 && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-muted-foreground font-semibold uppercase whitespace-nowrap">
                    Trusted For
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {profile.verifiedSkills.slice(0, 3).map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="rounded-full border-border bg-background text-xs font-medium text-muted-foreground px-2 py-0.5"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {shouldShowUnconfirmedSkills && (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-semibold text-muted-foreground uppercase">Unconfirmed skills:</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {visibleUnvouchedSkills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="rounded-full border-border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-full text-sm font-semibold text-primary"
                    onClick={handleRequestEndorsement}
                  >
                    Request an endorsement
                  </Button>
                </div>
              )}
            </div>

            {/* User Actions Container */}
            <ProfileCTAs profile={profile} isOwner={isOwner} />
          </div>
        </div>
      </div>

      <EditProfileDialog
        key={editOpen ? "open" : "closed"}
        open={editOpen}
        onOpenChange={setEditOpen}
        profile={profile}
        availableSkills={availableSkills}
        onSave={onProfileUpdate}
      />

      <AccountSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        user={{
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: userEmail ?? "",
          avatar: profile.avatarUrl ?? "",
        }}
        initialNotif={currentUser.notificationSettings as any}
        initialBlockedUsers={currentUser.blockedUsers}
      />

      <UserReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        userName={profile.name}
        userAvatarUrl={profile.avatarUrl}
        onSubmit={(payload) => {
          // TODO: Implement actual report submission logic
          console.log("User report:", { userId: profile.id, ...payload });
        }}
      />

      <HelpRequestDialog
        mode="create"
        open={endorsementDialogOpen}
        onOpenChange={setEndorsementDialogOpen}
        categories={HELP_CATEGORIES}
        contacts={endorsementContacts}
        userUnvouchedSkills={profile.unvouchedSkills}
        initialCategories={["endorse"]}
        initialVouchType="skill"
        onSubmit={(payload) => {
          console.log("Endorsement request submitted:", payload);
        }}
      />
    </>
  );
}
