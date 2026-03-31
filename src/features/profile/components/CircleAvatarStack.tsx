"use client";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CircleModal } from "./CircleModal";
import type { CircleMember } from "../types";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface CircleAvatarStackProps {
  firstName: string;
  members: CircleMember[];
  /** IDs of members who are also connected to the viewer — surfaced first */
  sharedConnectionIds?: string[];
  /** The viewer's own userId — used to identify their sponsor in the modal */
  viewerUserId?: string;
  /** True when the viewer is the profile owner — enables "Remove from circle" in the modal */
  isOwner?: boolean;
  basePath?: string;
}

const MAX_SHOWN = 5;

export function CircleAvatarStack({
  firstName,
  members,
  sharedConnectionIds = [],
  viewerUserId,
  isOwner,
  basePath = "/trusted-list",
}: CircleAvatarStackProps) {
  const [modalOpen, setModalOpen] = useState(false);

  // Sort: shared connections first, then the rest
  const sorted = [...members].sort((a, b) => {
    const aShared = sharedConnectionIds.includes(a.userId);
    const bShared = sharedConnectionIds.includes(b.userId);
    if (aShared && !bShared) return -1;
    if (!aShared && bShared) return 1;
    return 0;
  });

  const shown = sorted.slice(0, MAX_SHOWN);
  const overflow = members.length - shown.length;

  return (
    <>
      <section className="flex w-full flex-col gap-5">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground uppercase">
            {firstName}&apos;s Circle
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 rounded-full text-xs font-medium text-foreground hover:bg-muted"
            onClick={() => setModalOpen(true)}
          >
            View full circle
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>

        {/* Avatar stack */}
        <div className="flex items-center">
          {shown.map((member, i) => (
            <a
              key={member.userId}
              href={`${basePath}/members/${member.name.toLowerCase().replace(/\s+/g, "-")}`}
              className="group/av relative shrink-0"
              style={{ marginLeft: i === 0 ? 0 : "-12px", zIndex: MAX_SHOWN - i }}
              aria-label={member.name}
            >
              <Avatar className="h-12 w-12 border-[3px] border-background shadow-md transition-colors group-hover/av:border-primary">
                <AvatarImage src={member.avatarUrl ?? undefined} alt={member.name} />
                <AvatarFallback className="text-xs font-semibold">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
            </a>
          ))}
          {overflow > 0 && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              aria-label={`View ${overflow} more circle members`}
              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-border bg-background shadow-md text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              style={{ marginLeft: "-12px", zIndex: 0 }}
            >
              +{overflow}
            </button>
          )}
        </div>
      </section>

      <CircleModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        firstName={firstName}
        members={members}
        viewerUserId={viewerUserId}
        isOwner={isOwner}
        basePath={basePath}
      />
    </>
  );
}
