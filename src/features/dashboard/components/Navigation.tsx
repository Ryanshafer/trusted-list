import * as React from "react";
import { Menu } from "lucide-react";

import type { NavLink, UserProfile } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export type NavigationProps = {
  navLinks: NavLink[];
  userProfile: UserProfile;
};

export const AppSidebar = ({ navLinks, userProfile }: NavigationProps) => (
  <aside className="fixed inset-y-0 left-0 hidden h-screen w-72 flex-col border-r bg-background/90 p-6 backdrop-blur lg:flex">
    <NavigationContent navLinks={navLinks} userProfile={userProfile} />
  </aside>
);

export const MobileNavBar = ({ navLinks, userProfile }: NavigationProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex items-center justify-between border-b bg-background px-4 py-3 sm:px-6 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="border border-border">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open navigation</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 border-r bg-background/95 p-0">
          <NavigationContent navLinks={navLinks} userProfile={userProfile} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <span className="text-base font-semibold">The Trusted List</span>
      <UserMenu userProfile={userProfile} compact />
    </div>
  );
};

type NavigationContentProps = NavigationProps & {
  onNavigate?: () => void;
};

const NavigationContent = ({ navLinks, userProfile, onNavigate }: NavigationContentProps) => {
  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Trusted</p>
        <p className="text-xl font-bold text-foreground">The Trusted List</p>
      </div>
      <nav className="space-y-1">
        {navLinks.map((link) => (
          <Button
            key={link.label}
            variant={link.active ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={onNavigate}
          >
            {link.label}
          </Button>
        ))}
      </nav>
      <Button onClick={onNavigate}>Invite a trusted person</Button>
      <div className="mt-auto pt-6">
        <UserMenu userProfile={userProfile} />
      </div>
    </div>
  );
};

type UserMenuProps = {
  userProfile: UserProfile;
  compact?: boolean;
};

const UserMenu = ({ userProfile, compact = false }: UserMenuProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        type="button"
        className={`flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2 transition hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          compact ? "border border-border bg-card/60 px-2 py-1" : "bg-card/50"
        } ${compact ? "" : "w-full"}`}
      >
        <div className="relative">
          <Avatar className={compact ? "h-9 w-9" : "h-10 w-10"}>
            <AvatarImage src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=80" />
            <AvatarFallback>
              {userProfile.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-destructive" />
        </div>
        {!compact ? (
          <div className="text-left">
            <p className="text-sm font-semibold leading-tight">{userProfile.name}</p>
            <p className="text-xs text-muted-foreground">{userProfile.role}</p>
          </div>
        ) : null}
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56">
      <DropdownMenuLabel>{userProfile.name}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem>Notifications</DropdownMenuItem>
      <DropdownMenuItem>Account settings</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);
