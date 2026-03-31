"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChatMultiHelperModal } from "@/features/dashboard/components/ChatMultiHelperModal";
import { HelpRequestDialog, HELP_CATEGORIES, type AskContact } from "@/features/requests/components/HelpRequestDialog";
import type { OpenRequest, ProfileData } from "../types";

interface ProfileCTAsProps {
  profile: ProfileData;
  isOwner: boolean;
}

export function ProfileCTAs({ profile, isOwner }: ProfileCTAsProps) {
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  const profileUser: AskContact = {
    id: profile.id,
    name: `${profile.firstName} ${profile.lastName}`,
    role: profile.title || "Trust Network Member",
    avatarUrl: profile.avatarUrl ?? undefined,
  };

  if (isOwner) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {/* Primary: opens help request creation dialog */}
        <Button
          className="rounded-full font-medium h-10 px-6 text-sm"
          onClick={() => setHelpDialogOpen(true)}
        >
          Request help from {profile.firstName}
        </Button>

        {/* Secondary: anchors to help requests in the sidebar aside, only if requests exist */}
        {profile.openRequests.length > 0 && (
          <Button
            variant="outline"
            asChild
            className="rounded-full font-medium h-10 px-6 text-sm border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <a href="#open-requests">
              Help {profile.firstName}
            </a>
          </Button>
        )}
      </div>

      <HelpRequestDialog
        mode="create"
        open={helpDialogOpen}
        onOpenChange={setHelpDialogOpen}
        categories={HELP_CATEGORIES}
        contacts={[profileUser]}
        initialSelectedContacts={[profileUser]}
        onSubmit={(payload) => {
          console.log("Help request submitted:", payload);
          // Actual submission logic would go here
        }}
      />
    </>
  );
}
