"use client";
import { useMemo, useState } from "react";
import { ArrowUpDown, Flag, MoreHorizontal, Search, UserRoundX, X } from "lucide-react";
import { HelpRequestDialog, REQUEST_CONNECTION_CATEGORY, type AskContact } from "@/features/requests/components/HelpRequestDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CircleMember } from "../types";
import { getInitials } from "@/lib/utils";
import {
  filterMembers,
  sortMembers,
  type SortOrder,
} from "@/features/profile/utils/circle-utils";

const DEFAULT_BASE_PATH = "/trusted-list";
const REQUEST_CONNECTION_ROLE = "Trust Network Member";

function getMemberProfileHref(member: CircleMember, basePath: string) {
  if (member.awaiting) {
    return undefined;
  }

  return member.connectionDegree === "You"
    ? `${basePath}/profile`
    : `${basePath}/members/${member.name.toLowerCase().replace(/\s+/g, "-")}`;
}

function getMemberSkillsLabel(member: CircleMember) {
  return member.verifiedSkills?.length
    ? `Trusted for ${member.verifiedSkills.join(", ")}`
    : null;
}

function isRequestConnectEligible(member: CircleMember) {
  return (
    !member.awaiting &&
    !!member.connectionDegree &&
    member.connectionDegree !== "1st" &&
    member.connectionDegree !== "You"
  );
}

function getConnectTarget(member: CircleMember): AskContact {
  return {
    id: member.userId,
    name: member.name,
    role: member.verifiedSkills?.length
      ? `Trusted for ${member.verifiedSkills[0]}`
      : REQUEST_CONNECTION_ROLE,
    avatarUrl: member.avatarUrl ?? undefined,
  };
}

interface MemberRowProps {
  member: CircleMember;
  isSponsor?: boolean;
  isOwner?: boolean;
  basePath?: string;
  onRequestConnect?: (member: CircleMember) => void;
}

function MemberIdentity({
  member,
  isOwner,
  isSponsor,
}: {
  member: CircleMember;
  isOwner?: boolean;
  isSponsor?: boolean;
}) {
  const skillsLabel = getMemberSkillsLabel(member);

  return (
    <>
      <Avatar className="h-[60px] w-[60px] shrink-0 border-[3px] border-background transition-colors group-hover:border-primary shadow-md">
        {!member.awaiting && <AvatarImage src={member.avatarUrl ?? undefined} alt={member.name} />}
        <AvatarFallback className="text-sm font-semibold">
          {getInitials(member.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-center gap-3">
          <span className={`text-lg font-bold whitespace-nowrap ${member.awaiting ? "text-muted-foreground" : "text-card-foreground group-hover:text-primary"}`}>
            {member.name}
          </span>
          {isSponsor && (
            <Badge
              variant="outline"
              className="rounded-full border-neutral-200 bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-800 -translate-y-[0.5px]"
            >
              Your sponsor
            </Badge>
          )}
          {!isSponsor && !isOwner && member.connectionDegree && !member.awaiting && (
            <Badge
              variant="outline"
              className="rounded-full border-neutral-200 bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-800 -translate-y-[0.5px]"
            >
              {member.connectionDegree}
            </Badge>
          )}
          {member.awaiting && (
            <Badge
              variant="outline"
              className="rounded-full border-neutral-200 bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-800 -translate-y-[0.5px]"
            >
              Awaiting
            </Badge>
          )}
        </div>
        {skillsLabel && !member.awaiting && (
          <p className="w-full truncate text-xs text-muted-foreground leading-4">{skillsLabel}</p>
        )}
      </div>
    </>
  );
}

function MemberActions({
  member,
  isOwner,
  sent,
  onRemind,
  onRequestConnect,
}: {
  member: CircleMember;
  isOwner?: boolean;
  sent: boolean;
  onRemind: () => void;
  onRequestConnect?: (member: CircleMember) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      {member.awaiting && (
        sent ? (
          <span className="text-xs font-semibold text-success-600 px-3 h-8 flex items-center">
            Message sent!
          </span>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full font-semibold h-8 px-3 text-xs"
            onClick={onRemind}
          >
            Remind to join
          </Button>
        )
      )}
      {isRequestConnectEligible(member) && (
        <Button
          variant="outline"
          size="sm"
          className="rounded-full font-semibold h-8 px-3 text-xs"
          onClick={() => onRequestConnect?.(member)}
        >
          Request to connect
        </Button>
      )}
      {!member.awaiting && member.connectionDegree !== "You" && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-muted-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwner && (
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
      )}
    </div>
  );
}

function MemberRow({
  member,
  isSponsor,
  isOwner,
  basePath = DEFAULT_BASE_PATH,
  onRequestConnect,
}: MemberRowProps) {
  const [sent, setSent] = useState(false);
  const profileHref = getMemberProfileHref(member, basePath);

  const handleRemind = () => {
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="flex items-center gap-3 py-3">
      {member.awaiting ? (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <MemberIdentity member={member} isOwner={isOwner} isSponsor={isSponsor} />
        </div>
      ) : (
        <a href={profileHref} className="group flex min-w-0 flex-1 items-center gap-3">
          <MemberIdentity member={member} isOwner={isOwner} isSponsor={isSponsor} />
        </a>
      )}
      <MemberActions
        member={member}
        isOwner={isOwner}
        sent={sent}
        onRemind={handleRemind}
        onRequestConnect={onRequestConnect}
      />
    </div>
  );
}

interface MemberListProps {
  members: CircleMember[];
  viewerUserId?: string;
  isOwner?: boolean;
  basePath?: string;
  onRequestConnect?: (member: CircleMember) => void;
}

function MemberListToolbar({
  query,
  sort,
  onQueryChange,
  onSortChange,
}: {
  query: string;
  sort: SortOrder;
  onQueryChange: (query: string) => void;
  onSortChange: (sort: SortOrder) => void;
}) {
  return (
    <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-4 bg-background">
      <div className="relative w-[320px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by name or skill"
          className="rounded-full pl-9 h-9 text-sm pr-8"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <Select value={sort} onValueChange={(value) => onSortChange(value as SortOrder)}>
        <SelectTrigger className="h-9 w-[172px] rounded-lg text-sm gap-2">
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Recently added</SelectItem>
          <SelectItem value="asc">Alpha (A–Z)</SelectItem>
          <SelectItem value="desc">Alpha (Z–A)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function MemberListRows({
  members,
  viewerUserId,
  isOwner,
  basePath,
  onRequestConnect,
}: MemberListProps) {
  if (members.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">No members found.</p>
    );
  }

  return (
    <>
      {members.map((member) => (
        <MemberRow
          key={member.userId}
          member={member}
          isSponsor={!!viewerUserId && member.invitedBy === viewerUserId}
          isOwner={isOwner}
          basePath={basePath}
          onRequestConnect={onRequestConnect}
        />
      ))}
    </>
  );
}

function MemberList({ members, viewerUserId, isOwner, basePath, onRequestConnect }: MemberListProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOrder>("recent");

  const visible = useMemo(
    () => sortMembers(filterMembers(members, query), sort),
    [members, query, sort]
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <MemberListToolbar
        query={query}
        sort={sort}
        onQueryChange={setQuery}
        onSortChange={setSort}
      />
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <MemberListRows
          members={visible}
          viewerUserId={viewerUserId}
          isOwner={isOwner}
          basePath={basePath}
          onRequestConnect={onRequestConnect}
        />
      </div>
    </div>
  );
}

export interface CircleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  firstName: string;
  members: CircleMember[];
  /** The viewer's own userId — used to identify their sponsor */
  viewerUserId?: string;
  /** True when the viewer is the profile owner — enables "Remove from circle" */
  isOwner?: boolean;
  basePath?: string;
}

function CircleModalTabs({
  contacts,
  nominations,
  viewerUserId,
  isOwner,
  basePath,
  onRequestConnect,
}: {
  contacts: CircleMember[];
  nominations: CircleMember[];
  viewerUserId?: string;
  isOwner?: boolean;
  basePath?: string;
  onRequestConnect: (member: CircleMember) => void;
}) {
  return (
    <Tabs defaultValue="contacts" className="flex flex-col flex-1 min-h-0">
      <div className="flex justify-center px-6 shrink-0">
        <TabsList className="bg-accent rounded-full p-1 h-auto gap-0">
          <TabsTrigger
            value="contacts"
            className="rounded-full px-3 py-1 text-sm font-medium data-[state=active]:bg-popover data-[state=active]:text-popover-foreground data-[state=active]:shadow-sm"
          >
            Contacts
          </TabsTrigger>
          <TabsTrigger
            value="nominations"
            className="rounded-full px-3 py-1 text-sm font-medium data-[state=active]:bg-popover data-[state=active]:text-popover-foreground data-[state=active]:shadow-sm"
          >
            Nominations
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="contacts" className="flex flex-col flex-1 min-h-0 mt-0">
        <MemberList
          members={contacts}
          viewerUserId={viewerUserId}
          isOwner={isOwner}
          basePath={basePath}
          onRequestConnect={onRequestConnect}
        />
      </TabsContent>

      <TabsContent value="nominations" className="flex flex-col flex-1 min-h-0 mt-0">
        <MemberList
          members={nominations}
          viewerUserId={viewerUserId}
          isOwner={isOwner}
          basePath={basePath}
          onRequestConnect={onRequestConnect}
        />
      </TabsContent>
    </Tabs>
  );
}

function CircleConnectionRequestDialog({
  target,
  onClose,
}: {
  target: AskContact | null;
  onClose: () => void;
}) {
  if (!target) {
    return null;
  }

  return (
    <HelpRequestDialog
      mode="create"
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      categories={[REQUEST_CONNECTION_CATEGORY]}
      contacts={[target]}
      initialSelectedContacts={[target]}
      initialCategories={[REQUEST_CONNECTION_CATEGORY.value]}
      onSubmit={(payload) => {
        console.log("Connection request submitted:", payload);
        onClose();
      }}
    />
  );
}

export function CircleModal({
  open,
  onOpenChange,
  firstName,
  members,
  viewerUserId,
  isOwner,
  basePath = DEFAULT_BASE_PATH,
}: CircleModalProps) {
  const contacts = useMemo(() => members.filter((m) => !m.awaiting), [members]);
  const nominations = useMemo(() => members.filter((m) => m.invitedByMe), [members]);
  const [connectTarget, setConnectTarget] = useState<AskContact | null>(null);

  const handleRequestConnect = (member: CircleMember) => {
    onOpenChange(false);
    setConnectTarget(getConnectTarget(member));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[672px] max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden rounded-2xl [&>button]:bg-card [&>button]:border [&>button]:border-border [&>button]:rounded-full [&>button]:shadow-sm [&>button]:h-9 [&>button]:w-9 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:opacity-100 [&>button]:hover:opacity-80 [&>button]:hover:bg-accent [&>button]:right-4 [&>button]:top-4">
          <DialogHeader className="px-6 py-4 shrink-0">
            <DialogTitle className="font-serif text-2xl font-normal">
              {firstName}&apos;s Circle
            </DialogTitle>
          </DialogHeader>
          <CircleModalTabs
            contacts={contacts}
            nominations={nominations}
            viewerUserId={viewerUserId}
            isOwner={isOwner}
            basePath={basePath}
            onRequestConnect={handleRequestConnect}
          />
        </DialogContent>
      </Dialog>
      <CircleConnectionRequestDialog
        target={connectTarget}
        onClose={() => setConnectTarget(null)}
      />
    </>
  );
}
