import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronsRight } from "lucide-react";
import { getInitials } from "@/lib/utils";

export type ConnectionPathNode = {
  type: "you" | "connector" | "requester";
  name?: string;
  role: string;
  avatarUrl?: string | null;
  relationship: string | null;
};

export type ResolvedNode = {
  name: string;
  role: string;
  avatarUrl: string | null;
};

export interface ConnectionPathProps {
  connectionPath: ConnectionPathNode[];
  connectionDegree: string;
  resolveNode: (node: ConnectionPathNode) => ResolvedNode;
  basePath?: string;
  hideHeader?: boolean;
}



function formatRelationship(rel: string): string {
  return rel.startsWith("Colleagues ") ? rel.slice("Colleagues ".length) : rel;
}

function ConnectionNode({
  name,
  role,
  avatarUrl,
  href,
}: {
  name: string;
  role: string;
  avatarUrl: string | null;
  href?: string;
}) {
  const inner = (
    <>
      <Avatar
        className={`h-10 w-10 shrink-0 border-2 border-background shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] transition-colors${
          href ? " group-hover/member:border-primary" : ""
        }`}
      >
        <AvatarImage src={avatarUrl ?? undefined} alt={name} />
        <AvatarFallback className="text-xs font-semibold">{getInitials(name)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span
          className={`text-base font-semibold text-card-foreground leading-tight transition-colors${
            href ? " group-hover/member:text-primary" : ""
          }`}
        >
          {name}
        </span>
        <span className="text-xs text-muted-foreground">{role}</span>
      </div>
    </>
  );

  if (href) {
    return (
      <a href={href} className="flex items-center gap-2 group/member">
        {inner}
      </a>
    );
  }
  return <div className="flex items-center gap-2">{inner}</div>;
}

function RelationshipRow({ label }: { label: string }) {
  return (
    <div className="ml-5 border-l border-border pl-5 h-9 flex items-center gap-3.5">
      <div className="flex items-center gap-0.5 min-w-0">
        <ChevronsRight className="h-3 w-3 text-muted-foreground/75 shrink-0 mb-px" />
        <p className="text-xs text-muted-foreground/75 leading-none truncate">{label}</p>
      </div>
    </div>
  );
}

export function ConnectionPath({
  connectionPath,
  connectionDegree,
  resolveNode,
  basePath = "/trusted-list",
  hideHeader = false,
}: ConnectionPathProps) {
  const collapsed =
    connectionDegree === "3rd+" ||
    connectionDegree === "3rd" ||
    connectionDegree === "none";

  const youNode = resolveNode(connectionPath[0]);
  const lastNode = connectionPath[connectionPath.length - 1];
  const requesterNode = resolveNode(lastNode);

  const memberHref = (name: string) =>
    `${basePath}/members/${name.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="flex flex-col gap-3.5">
      {!hideHeader && (
        <p className="text-xs text-muted-foreground tracking-widest uppercase">Your Connection</p>
      )}
      <div className="flex flex-col">
        {collapsed ? (
          <>
            <ConnectionNode
              name={youNode.name}
              role={youNode.role}
              avatarUrl={youNode.avatarUrl}
              href={`${basePath}/profile`}
            />
            <RelationshipRow
              label={connectionDegree === "none" ? "Not connected" : "Connected indirectly"}
            />
            <ConnectionNode
              name={requesterNode.name}
              role={requesterNode.role}
              avatarUrl={requesterNode.avatarUrl}
              href={memberHref(requesterNode.name)}
            />
          </>
        ) : (
          connectionPath.map((node, i) => {
            const resolved = resolveNode(node);
            return (
              <React.Fragment key={i}>
                {i > 0 && node.relationship && (
                  <RelationshipRow label={formatRelationship(node.relationship)} />
                )}
                <ConnectionNode
                  name={resolved.name}
                  role={resolved.role}
                  avatarUrl={resolved.avatarUrl}
                  href={node.type === "you" ? `${basePath}/profile` : memberHref(resolved.name)}
                />
              </React.Fragment>
            );
          })
        )}
      </div>
    </div>
  );
}
