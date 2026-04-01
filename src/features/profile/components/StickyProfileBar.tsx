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
              <div className="flex items-center gap-3">
                <div className="relative h-[60px] w-[60px] shrink-0">
                  <div className="absolute inset-0 overflow-hidden rounded-full border-[3.5px] border-background shadow-[0px_12px_18px_-2px_rgba(0,0,0,0.1),0px_6px_12px_-3px_rgba(0,0,0,0.1)]">
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={profile.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-lg font-bold leading-7 text-card-foreground whitespace-nowrap">
                      {profile.name}
                    </span>
                    {connectionDegree && (
                      <span className="rounded-full border border-muted-foreground bg-background px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                        {connectionDegree}
                      </span>
                    )}
                  </div>
                  {profile.verifiedSkills.length > 0 && (
                    <p className="text-sm font-normal leading-4 text-muted-foreground">
                      Trusted for {profile.verifiedSkills.slice(0, 3).join(", ")}
                    </p>
                  )}
                </div>
              </div>

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
