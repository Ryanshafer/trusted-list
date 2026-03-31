"use client";
import { useMemo, useState } from "react";
import { ArrowUpDown, Flag, MoreHorizontal, Search, UserRoundX } from "lucide-react";
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

type SortOrder = "recent" | "asc" | "desc";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function sortMembers(members: CircleMember[], order: SortOrder): CircleMember[] {
  if (order === "asc") return [...members].sort((a, b) => a.name.localeCompare(b.name));
  if (order === "desc") return [...members].sort((a, b) => b.name.localeCompare(a.name));
  // "recent" — awaiting (pending invites) float to top, then preserve insertion order
  return [...members].sort((a, b) => (b.awaiting ? 1 : 0) - (a.awaiting ? 1 : 0));
}

function filterMembers(members: CircleMember[], query: string): CircleMember[] {
  if (!query.trim()) return members;
  const q = query.toLowerCase();
  return members.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.verifiedSkills?.some((s) => s.toLowerCase().includes(q))
  );
}

interface MemberRowProps {
  member: CircleMember;
  isSponsor?: boolean;
  isOwner?: boolean;
  basePath?: string;
}

function MemberRow({ member, isSponsor, isOwner, basePath = "/trusted-list" }: MemberRowProps) {
  const [sent, setSent] = useState(false);

  const profileHref = member.awaiting
    ? undefined
    : `${basePath}/members/${member.name.toLowerCase().replace(/\s+/g, "-")}`;
  const skills = member.verifiedSkills?.length
    ? `Trusted for ${member.verifiedSkills.join(", ")}`
    : null;

  const handleRemind = () => {
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  const InfoBlock = (
    <>
      <Avatar className="h-[60px] w-[60px] shrink-0 border-[3px] border-background transition-colors group-hover:border-primary shadow-md">
        {!member.awaiting && <AvatarImage src={member.avatarUrl ?? undefined} alt={member.name} />}
        <AvatarFallback className="text-sm font-semibold">
          {getInitials(member.name)}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
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
        {skills && !member.awaiting && (
          <p className="w-full truncate text-xs text-muted-foreground leading-4">{skills}</p>
        )}
      </div>
    </>
  );

  return (
    <div className="flex items-center gap-3 py-3">
      {member.awaiting ? (
        <div className="flex min-w-0 flex-1 items-center gap-3">{InfoBlock}</div>
      ) : (
        <a href={profileHref} className="group flex min-w-0 flex-1 items-center gap-3">{InfoBlock}</a>
      )}

      {/* Actions */}
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
              onClick={handleRemind}
            >
              Remind to join
            </Button>
          )
        )}
        {!member.awaiting && <DropdownMenu>
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
        </DropdownMenu>}
      </div>
    </div>
  );
}

interface MemberListProps {
  members: CircleMember[];
  viewerUserId?: string;
  isOwner?: boolean;
  basePath?: string;
}

function MemberList({ members, viewerUserId, isOwner, basePath }: MemberListProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOrder>("recent");

  const visible = useMemo(
    () => sortMembers(filterMembers(members, query), sort),
    [members, query, sort]
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Search + Sort toolbar — sticky, does not scroll */}
      <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-4 bg-background">
        <div className="relative w-[320px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or skill"
            className="rounded-full pl-9 h-9 text-sm"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOrder)}>
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

      {/* Rows — scrollable */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No members found.</p>
        ) : (
          visible.map((member) => (
            <MemberRow
              key={member.userId}
              member={member}
              isSponsor={!!viewerUserId && member.invitedBy === viewerUserId}
              isOwner={isOwner}
              basePath={basePath}
            />
          ))
        )}
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

export function CircleModal({
  open,
  onOpenChange,
  firstName,
  members,
  viewerUserId,
  isOwner,
  basePath,
}: CircleModalProps) {
  const contacts = useMemo(() => members.filter((m) => !m.awaiting), [members]);
  const nominations = useMemo(() => members.filter((m) => m.invitedByMe), [members]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[672px] max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden rounded-2xl [&>button]:bg-card [&>button]:border [&>button]:border-border [&>button]:rounded-full [&>button]:shadow-sm [&>button]:h-9 [&>button]:w-9 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:opacity-100 [&>button]:hover:opacity-80 [&>button]:hover:bg-accent [&>button]:right-4 [&>button]:top-4">
        <DialogHeader className="px-6 py-4 shrink-0">
          <DialogTitle className="font-serif text-2xl font-normal">
            {firstName}&apos;s Circle
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="contacts" className="flex flex-col flex-1 min-h-0">
          {/* Tab switcher — centered */}
          <div className="flex justify-center px-6 shrink-0">
            <TabsList className="bg-accent rounded-[10px] p-[3px] h-auto gap-0">
              <TabsTrigger
                value="contacts"
                className="rounded-[8px] px-3 py-1 text-sm font-medium data-[state=active]:bg-popover data-[state=active]:text-popover-foreground data-[state=active]:shadow-sm"
              >
                Contacts
              </TabsTrigger>
              <TabsTrigger
                value="nominations"
                className="rounded-[8px] px-3 py-1 text-sm font-medium data-[state=active]:bg-popover data-[state=active]:text-popover-foreground data-[state=active]:shadow-sm"
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
            />
          </TabsContent>

          <TabsContent value="nominations" className="flex flex-col flex-1 min-h-0 mt-0">
            <MemberList
              members={nominations}
              viewerUserId={viewerUserId}
              isOwner={isOwner}
              basePath={basePath}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
