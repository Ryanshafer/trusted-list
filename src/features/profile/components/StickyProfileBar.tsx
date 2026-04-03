"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Flag, MoreHorizontal, UserRoundX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { UserIdentityLink } from "@/components/UserIdentityLink";
import {
  HelpRequestDialog,
  HELP_CATEGORIES,
  type AskContact,
} from "@/features/requests/components/HelpRequestDialog";
import type { ProfileData } from "../types";

interface StickyProfileBarProps {
  profile: ProfileData;
  connectionDegree?: string | null;
}

export function StickyProfileBar({ profile, connectionDegree }: StickyProfileBarProps) {
  const [visible, setVisible] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { state: sidebarState } = useSidebar();

  useEffect(() => {
    const hero = document.querySelector("[data-profile-hero]") as HTMLElement | null;
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  const profileUser: AskContact = {
    id: profile.id,
    name: `${profile.firstName} ${profile.lastName}`,
    role: profile.title || "Trust Network Member",
    avatarUrl: profile.avatarUrl ?? undefined,
  };

  const leftOffset =
    sidebarState === "expanded"
      ? "var(--sidebar-width, 0px)"
      : "var(--sidebar-width-icon, 0px)";

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { duration: 0.3, ease: "easeInOut" }
            }
            className="fixed top-4 z-50 px-4"
            style={{ left: leftOffset, right: 0 }}
          >
            <div className="flex w-full items-center justify-between rounded-lg bg-popover p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]">
              {/* Left: avatar + name + badge + trusted-for */}
              <UserIdentityLink
                avatarUrl={profile.avatarUrl}
                name={profile.name}
                connectionDegree={connectionDegree || undefined}
                trustedFor={profile.verifiedSkills}
                avatarSize="md"
                avatarBorderClass="border-background"
                showTrustedFor={profile.verifiedSkills.length > 0}
              />

              {/* Right: action buttons */}
              <div className="flex items-center gap-3">
                <Button
                  className="h-10 rounded-full px-6 text-sm font-medium"
                  onClick={() => setHelpDialogOpen(true)}
                >
                  Request help from {profile.firstName}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-full border-border text-muted-foreground"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {connectionDegree === "1st" && (
                      <DropdownMenuItem className="text-destructive focus:text-destructive">
                        <UserRoundX className="h-4 w-4" />
                        Remove from circle
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                      <Flag className="h-4 w-4" />
                      Report abuse
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <HelpRequestDialog
        mode="create"
        open={helpDialogOpen}
        onOpenChange={setHelpDialogOpen}
        categories={HELP_CATEGORIES}
        contacts={[profileUser]}
        initialSelectedContacts={[profileUser]}
        onSubmit={(payload) => {
          console.log("Help request submitted:", payload);
        }}
      />
    </>
  );
}
