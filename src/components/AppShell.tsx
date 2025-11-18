"use client";

import * as React from "react";
import { ArrowUpRight } from "lucide-react";

import ThemeToggle from "./ThemeToggle";
import { Button } from "./ui/button";

const heroLinks = [
  {
    href: "https://tweakcn.com/editor/theme",
    label: "Open Theme Tool",
    variant: "default" as const,
  },
  {
    href: "https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server",
    label: "View Figma MCP Guide",
    variant: "outline" as const,
  },
];

const steps = [
  {
    label: "Step 1",
    title: "Dial in theming",
    body: (
      <>
        Paste the shadcn theme snippet into the <strong>Theme Drop Zone</strong> inside{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">src/styles/global.css</code>. Update the Google
        Fonts import if your palette uses a different family or weights.
      </>
    ),
    bullets: [
      "✅ Keep Template Extensions untouched.",
      "✅ Run `npm run dev` to preview colors + typography.",
    ],
  },
  {
    label: "Step 2",
    title: "Sync UI from Figma",
    body: (
      <>
        Before coding screens, fetch the referenced frames via the Figma MCP server so spacing, typography, and icon
        choices match exactly.
      </>
    ),
    bullets: [
      "🎯 Map icons to Lucide equivalents.",
      "📥 Import `data/figma-tailwind-variables.json` into Figma Variables so spacing + radii match Tailwind.",
      "🧱 Check `src/components/ui` for existing shadcn primitives.",
      "➕ Need more? Run `npx shadcn@latest add <component>`.",
    ],
  },
  {
    label: "Step 3",
    title: "Prompt the AI teammate",
    body: (
      <>
        Open your preferred AI chat (e.g. GPT, Claude) and ask it to act as an expert prompt engineer. Have it craft
        a concise system prompt for the agent working in this repo, describing the UI or flow you want to prototype.
      </>
    ),
    bullets: [
      "🧠 Share constraints: data shape, interactions, accessibility goals.",
      "📋 Copy that prompt into the agent session here to kick off implementation.",
      "🚀 Iterate by describing refinements; run `npm run build` before commits.",
      "🌿 Push work to a branch per variant and trigger the GitHub Action to publish its own preview URL.",
    ],
  },
];

/**
 * Default onboarding shell rendered on the homepage. Feel free to delete everything. AppShell is ready—the markup
 * below is only meant to showcase how React + shadcn/ui + tokens work together.
 */
const AppShell = () => {
  return (
    <section className="px-page pb-page pt-16">
      <div className="page-shell stack-xl">
        <div className="flex flex-col items-end gap-4 sm:flex-row sm:justify-end">
          <ThemeToggle />
        </div>
        <div className="stack-md text-center">
          <p className="text-label-xs text-muted-foreground tracking-widest uppercase">Astro · React · shadcn/ui</p>
          <h1 className="text-display-lg leading-display-lg tracking-display-lg text-foreground">Your sandbox is ready.</h1>
          <p className="text-body-lg text-lime-500 mx-auto max-w-2xl">
            Use this page as a starting point for prototyping. Swap the theme, design in Figma using tailwind tokens, and then
            use Figma MCP and your AI of choice to build out realistic UI and flows.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {heroLinks.map((link) => (
              <Button
                key={link.href}
                variant={link.variant}
                asChild
                className="h-auto rounded-full px-5 py-2 text-sm font-semibold"
              >
                <a href={link.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
                  {link.label}
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </a>
              </Button>
            ))}
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <article key={step.title} className="surface-card card-padding stack-sm rounded-2xl border border-border shadow-ambient">
              <p className="text-label-xs text-primary uppercase">{step.label}</p>
              <h2 className="text-title-sm text-foreground">{step.title}</h2>
              <p className="text-body-md text-muted-foreground">{step.body}</p>
              <ul className="space-y-2 text-body-sm text-muted-foreground">
                {step.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AppShell;
