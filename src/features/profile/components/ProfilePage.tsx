"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProfileHero } from "./ProfileHero";
import { ProfileSidebar } from "./ProfileSidebar";
import { CarouselWithCount } from "./CarouselWithCount";
import { ContributionCard } from "./ContributionCard";
import { RecommendationCard } from "./RecommendationCard";
import { OwnWordsEditDialog } from "./OwnWordsEditDialog";
import { EditRecommendationsDialog } from "./EditRecommendationsDialog";
import { StickyProfileBar } from "./StickyProfileBar";
import { OwnWordsGrid } from "./OwnWordsGrid";
import { ExperienceSection } from "./ExperienceEntry";
import type { ProfileData, ViewerData } from "../types";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

interface ProfilePageProps {
  profile: ProfileData;
  viewerData?: ViewerData;
  isOwner: boolean;
  publicView?: boolean;
  userEmail?: string;
  connectionDegree?: string | null;
  availableSkills?: string[];
  basePath?: string;
}

export function ProfilePage({
  profile: initialProfile,
  viewerData,
  isOwner,
  publicView = false,
  userEmail,
  connectionDegree,
  availableSkills = [],
  basePath = "/trusted-list",
}: ProfilePageProps) {
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [ownWordsDialogOpen, setOwnWordsDialogOpen] = useState(false);

  useEffect(() => {
    const removed = sessionStorage.getItem("circle.removed");
    if (!removed) return;
    sessionStorage.removeItem("circle.removed");
    toast(`${removed} removed from your circle`, {
      action: {
        label: "Undo",
        onClick: () => { window.history.back(); },
      },
    });
  }, []);
  const [editRecsDialogOpen, setEditRecsDialogOpen] = useState(false);
  const [hiddenRecs, setHiddenRecs] = useState<ProfileData["recommendations"]>([]);

  // Edit affordances are only shown in the private view, not on the public /members page
  const canEdit = isOwner && !publicView;

  const contributionCards = profile.contributions.items.map((item) => (
    <ContributionCard key={item.requestId} item={item} basePath={basePath} />
  ));

  const recommendationCards = profile.recommendations.map((rec, i) => (
    <RecommendationCard key={i} rec={rec} basePath={basePath} />
  ));
  const shouldShowRecommendationsSection =
    recommendationCards.length > 0 || (canEdit && hiddenRecs.length > 0);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden">
          <div className="flex items-center gap-3 border-b bg-background px-4 py-3 lg:hidden">
            <SidebarTrigger className="border border-border" />
          </div>
          <div className="w-full">
            {/* Hero zone — full width */}
            <div data-profile-hero>
              <ProfileHero
                profile={profile}
                isOwner={isOwner}
                publicView={publicView}
                basePath={basePath}
                userEmail={userEmail}
                connectionDegree={connectionDegree}
                availableSkills={availableSkills}
                onProfileUpdate={setProfile}
              />
            </div>

            {/* Body — sidebar + main content */}
            <div className="flex items-stretch gap-12">
              {/* Sidebar */}
              <ProfileSidebar
                profile={profile}
                viewerData={viewerData}
                isOwner={isOwner}
                publicView={publicView}
                connectionDegree={connectionDegree}
                basePath={basePath}
              />

              {/* Main content */}
              <div className="flex min-w-0 flex-1 flex-col gap-8 mb-10">
                {contributionCards.length > 0 && (
                  <CarouselWithCount
                    title={`${profile.firstName}'s contributions`}
                    totalCount={profile.contributions.items.length}
                    countLabel="Contributions"
                    filterLabel="Skills in action"
                    filterSkills={profile.contributions.skillsInAction}
                    items={contributionCards}
                    itemBasis="basis-96"
                  />
                )}

                {shouldShowRecommendationsSection && (
                  <CarouselWithCount
                    title="What colleagues say"
                    totalCount={profile.recommendations.length}
                    countLabel="Recommendations"
                    filterLabel={canEdit ? undefined : "Trusted for"}
                    filterSkills={canEdit ? [] : profile.verifiedSkills.slice(0, 3)}
                    actionLabel={canEdit ? "Edit recommendations" : undefined}
                    onActionClick={canEdit ? () => setEditRecsDialogOpen(true) : undefined}
                    items={recommendationCards}
                    itemBasis="basis-96"
                    showWhenEmpty={canEdit && hiddenRecs.length > 0}
                  />
                )}

                {profile.inTheirOwnWords.length > 0 && (
                  <OwnWordsGrid
                    firstName={profile.firstName}
                    entries={profile.inTheirOwnWords}
                    isOwner={canEdit}
                    onEditClick={() => setOwnWordsDialogOpen(true)}
                  />
                )}

                <ExperienceSection
                  jobs={profile.experience.jobs}
                  education={profile.experience.education}
                  firstName={profile.firstName}
                  isOwner={canEdit}
                  onSave={(experience) =>
                    setProfile((prev) => ({ ...prev, experience }))
                  }
                />
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
      {!isOwner && (
        <StickyProfileBar profile={profile} connectionDegree={connectionDegree} />
      )}
      <EditRecommendationsDialog
        open={editRecsDialogOpen}
        onOpenChange={setEditRecsDialogOpen}
        recommendations={profile.recommendations}
        hiddenRecommendations={hiddenRecs}
        onSave={({ visible, hidden }) => {
          setProfile((prev) => ({ ...prev, recommendations: visible }));
          setHiddenRecs(hidden);
        }}
      />
      <OwnWordsEditDialog
        open={ownWordsDialogOpen}
        onOpenChange={setOwnWordsDialogOpen}
        entries={profile.inTheirOwnWords}
        onSave={(updatedEntries) =>
          setProfile((prev) => ({ ...prev, inTheirOwnWords: updatedEntries }))
        }
      />
    </SidebarProvider>
  );
}
