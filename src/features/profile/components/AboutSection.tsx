import {
  BriefcaseBusiness,
  ChevronRight,
  Info,
  Github,
  Globe,
  Linkedin,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProfileData } from "../types";

interface AboutSectionProps {
  profile: ProfileData;
}

interface MetadataItem {
  key: string;
  icon: LucideIcon;
  label: ReactNode;
  href?: string;
}

function formatLinkLabel(url: string) {
  return url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
}

function MetadataRow({ icon: Icon, label, href }: MetadataItem) {
  const content = href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="min-w-0 break-all text-base text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
    >
      {label}
    </a>
  ) : (
    <p className="min-w-0 text-base text-muted-foreground">{label}</p>
  );

  return (
    <li className="flex items-start gap-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">{content}</div>
    </li>
  );
}

export function AboutSection({ profile }: AboutSectionProps) {
  const { about, title, company } = profile;
  const hasExperience = profile.experience.jobs.length > 0 || profile.experience.education.length > 0;

  const roleLine = [title, company].filter(Boolean).join(" · ");
  const metadataItems = [
    roleLine
      ? {
        key: "role",
        icon: BriefcaseBusiness,
        label: roleLine,
      }
      : null,
    about.bio
      ? {
        key: "bio",
        icon: Info,
        label: about.bio,
      }
      : null,
    about.location
      ? {
        key: "location",
        icon: MapPin,
        label: about.location,
      }
      : null,
    about.websiteUrl
      ? {
        key: "website",
        icon: Globe,
        label: formatLinkLabel(about.websiteUrl),
        href: about.websiteUrl,
      }
      : null,
    about.linkedInUrl
      ? {
        key: "linkedin",
        icon: Linkedin,
        label: formatLinkLabel(about.linkedInUrl),
        href: about.linkedInUrl,
      }
      : null,
    about.githubUrl
      ? {
        key: "github",
        icon: Github,
        label: formatLinkLabel(about.githubUrl),
        href: about.githubUrl,
      }
      : null,
  ].filter(Boolean) as MetadataItem[];

  return (
    <section className="flex w-full flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">ABOUT</span>
        {hasExperience && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1.5 rounded-full text-xs font-medium text-foreground hover:bg-muted"
          >
            <a href="#experience">
              See full experience
              <ChevronRight className="h-3 w-3" />
            </a>
          </Button>
        )}
      </div>

      <ul className={cn("flex flex-col gap-3", metadataItems.length === 0 && "hidden")}>
        {metadataItems.map(({ key, ...item }) => (
          <MetadataRow key={key} {...item} />
        ))}
      </ul>
    </section>
  );
}
