"use client";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AboutSection } from "./AboutSection";
import { CircleAvatarStack } from "./CircleAvatarStack";
import { OpenRequestCard } from "./OpenRequestCard";
import { ConnectionPath } from "@/features/requests/components/ConnectionPath";
import { ChatMultiHelperModal } from "@/features/dashboard/components/ChatMultiHelperModal";
import type { ProfileData, OpenRequest, ViewerData } from "../types";
import type { ConnectionPathNode } from "@/features/requests/components/ConnectionPath";

interface ProfileSidebarProps {
  profile: ProfileData;
  viewerData?: ViewerData;
  isOwner: boolean;
  connectionDegree?: string | null;
  basePath?: string;
}

export function ProfileSidebar({
  profile,
  viewerData,
  isOwner,
  connectionDegree,
  basePath = "/trusted-list",
}: ProfileSidebarProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<OpenRequest | null>(null);
  const visibleOpenRequests = profile.openRequests.filter((request) => {
    const isOpen = (request.status ?? "Open") === "Open";
    const isPromotable = ["circle", "community"].includes(request.type ?? "circle");
    const isActive = !isPromotable || request.promoted !== false;
    return isOpen && isActive;
  });

  function handleOfferToHelp(requestId: string) {
    const req = visibleOpenRequests.find((r) => r.requestId === requestId);
    if (req) {
      setActiveRequest(req);
      setModalOpen(true);
    }
  }

  // The ConnectionPath component expects its own node type — map from profile's node shape
  const connectionPathNodes = profile.connectionPath.map((n) => ({
    type: n.type,
    name: n.name,
    role: n.role,
    avatarUrl: n.avatarUrl,
    relationship: n.relationship,
  })) as ConnectionPathNode[];

  function resolveConnectionNode(node: ConnectionPathNode) {
    if (node.type === "you" && viewerData) {
      return {
        name: viewerData.name,
        role: viewerData.role,
        avatarUrl: viewerData.avatarUrl,
      };
    }
    return {
      name: node.name ?? profile.name,
      role: node.role,
      avatarUrl: node.avatarUrl ?? null,
    };
  }

  const showConnectionPath =
    !isOwner && connectionDegree && connectionDegree !== "none" && connectionPathNodes.length >= 2;

  const viewerContact = {
    id: "viewer",
    name: viewerData?.name ?? "You",
    role: viewerData?.role ?? "Member",
    avatarUrl: viewerData?.avatarUrl ?? null,
  };

  return (
    <aside className="relative flex min-h-full w-sm shrink-0 flex-col items-start gap-6 border-r border-border bg-card px-7 pb-20">
      {/* About */}
      <div className="flex w-full flex-col gap-5 pt-6 rounded-2xl">
        <AboutSection profile={profile} />
      </div>

      {/* Circle */}
      {profile.circle.length > 0 && (
        <>
          <div className="h-px w-full shrink-0 bg-border" />
          <CircleAvatarStack
            firstName={profile.firstName}
            members={profile.circle}
            sharedConnectionIds={viewerData?.sharedConnectionIds}
            viewerUserId={viewerData?.userId}
            isOwner={isOwner}
            basePath={basePath}
          />
        </>
      )}

      {/* Connection path — connected visitor only */}
      {showConnectionPath && viewerData && (
        <>
          <div className="h-px w-full shrink-0 bg-border" />
          <section className="flex w-full flex-col gap-3.5">
            <span className="text-sm text-muted-foreground uppercase">
              YOUR CONNECTION TO {profile.firstName.toUpperCase()}
            </span>
            <ConnectionPath
              connectionPath={connectionPathNodes}
              connectionDegree={connectionDegree!}
              resolveNode={resolveConnectionNode}
              basePath={basePath}
              hideHeader={true}
            />
          </section>
        </>
      )}

      {/* Open requests */}
      {visibleOpenRequests.length > 0 && (
        <>
          <div className="h-px w-full shrink-0 bg-border" />
          <section id="open-requests" className="flex w-full flex-col gap-3.5 py-5 rounded-2xl scroll-mt-36">
            <div className="flex w-full items-center justify-between">
              <span className="text-sm text-muted-foreground uppercase">
                OPEN REQUESTS FOR HELP
              </span>
              {visibleOpenRequests.length > 2 && (
                <Button
                  variant="ghost"
                  asChild
                  className="h-6 gap-1.5 px-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  <a href="#open-requests">
                    View all {visibleOpenRequests.length} requests
                    <ChevronRight className="h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
            <div className="flex w-full flex-col gap-3">
              {visibleOpenRequests.slice(0, 2).map((req) => (
                <OpenRequestCard
                  key={req.requestId}
                  request={req}
                  isOwner={isOwner}
                  basePath={basePath}
                  onOfferToHelp={handleOfferToHelp}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {/* Chat modal for "Offer to help" on cards */}
      {activeRequest && (
        <ChatMultiHelperModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          title={activeRequest.title}
          requesterName={profile.firstName}
          contacts={[viewerContact]}
          messages={[]}
        />
      )}
    </aside>
  );
}
