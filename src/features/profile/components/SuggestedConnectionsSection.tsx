"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HelpRequestDialog, HELP_CATEGORIES } from "@/features/requests/components/HelpRequestDialog";
import type { SuggestedConnection } from "../types";

interface SuggestedConnectionsSectionProps {
  connections: SuggestedConnection[];
  onConnect: (connection: SuggestedConnection) => void;
  basePath?: string;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function SuggestedConnectionCard({
  connection,
  onConnect,
  basePath = "/trusted-list",
}: {
  connection: SuggestedConnection;
  onConnect: (c: SuggestedConnection) => void;
  basePath?: string;
}) {
  const [sent, setSent] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const slug = connection.name.toLowerCase().replace(/\s+/g, "-");
  const detail = <em>{connection.reasonDetail}</em>;
  const reasonLabel =
    connection.reason === "company" ? <>Worked together at {detail}</>
    : connection.reason === "university" ? <>Studied together at {detail}</>
    : <>You helped with {detail}</>;
  const href = `${basePath}/members/${slug}`;

  const profileUser = {
    id: connection.userId,
    name: connection.name,
    role: connection.role,
    avatarUrl: connection.avatarUrl ?? undefined,
  };

  return (
    <div className="flex w-full flex-col gap-3 py-4 first:pt-3 last:pb-0">
      <a href={href} className="group flex w-full items-start gap-3">
        <Avatar className="h-12 w-12 shrink-0 border-[3px] border-primary-foreground shadow-md transition-colors group-hover:border-primary">
          <AvatarImage src={connection.avatarUrl ?? undefined} alt={connection.name} className="object-cover" />
          <AvatarFallback className="text-xs font-semibold">{getInitials(connection.name)}</AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold text-card-foreground transition-colors group-hover:text-primary">
              {connection.name}
            </span>
            <Badge
              variant="outline"
              className="rounded-full border-border px-1.5 py-0 text-xs font-semibold text-muted-foreground"
            >
              {connection.connectionDegree}
            </Badge>
          </div>

          <span className="text-xs leading-4 text-muted-foreground">{reasonLabel}</span>

          {/* <div className="mt-0.5 flex items-center gap-1">
            <ShieldCheck className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">{connection.trustTier}</span>
          </div> */}
        </div>
      </a>

      <div className="flex justify-end">
        {sent ? (
          <Badge className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            Request sent
          </Badge>
        ) : (
          <Button
            variant="link"
            size="sm"
            className="h-7 rounded-full border-primary px-3 text-xs font-semibold text-primary hover:bg-muted hover:text-primary hover:no-underline"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="size-3" />
            Request to connect
          </Button>
        )}
      </div>

      <HelpRequestDialog
        mode="create"
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categories={HELP_CATEGORIES}
        contacts={[profileUser]}
        initialSelectedContacts={[profileUser]}
        connectRequestMode
        overrideTitle={`Connect with ${connection.name}`}
        onSubmit={(payload) => {
          console.log("Connect request submitted:", payload);
          onConnect(connection);
          setSent(true);
        }}
      />
    </div>
  );
}

export function SuggestedConnectionsSection({ connections, onConnect, basePath }: SuggestedConnectionsSectionProps) {
  const sorted = [...connections].sort((a, b) => {
    const rank = (deg: string) => (deg === "2nd" ? 0 : 1);
    return rank(a.connectionDegree) - rank(b.connectionDegree);
  });

  return (
    <section className="flex w-full flex-col gap-3.5">
      <span className="text-sm text-muted-foreground uppercase">Suggested Connections</span>
      <div className="flex w-full flex-col divide-y divide-border">
        {sorted.map((c) => (
          <SuggestedConnectionCard key={c.userId} connection={c} onConnect={onConnect} basePath={basePath} />
        ))}
      </div>
    </section>
  );
}
