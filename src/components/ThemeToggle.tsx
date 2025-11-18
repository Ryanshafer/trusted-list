"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ThemeToggle = () => {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const root = document.documentElement;
    const stored = localStorage.getItem("prefers-dark") === "true";
    if (stored) {
      root.classList.add("dark");
      setIsDark(true);
      return;
    }
    setIsDark(root.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    if (next) {
      root.classList.add("dark");
      localStorage.setItem("prefers-dark", "true");
    } else {
      root.classList.remove("dark");
      localStorage.removeItem("prefers-dark");
    }
    setIsDark(next);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Toggle theme"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground transition hover:border-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Moon
              className={cn(
                "size-4 shrink-0 text-foreground transition",
                isDark ? "opacity-0 scale-75" : "opacity-100 scale-100"
              )}
            />
            <Sun
              className={cn(
                "absolute size-4 shrink-0 text-foreground transition",
                isDark ? "opacity-100 scale-100" : "opacity-0 scale-75"
              )}
            />
            <span className="sr-only">Toggle theme</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isDark ? "Switch to light" : "Switch to dark"}
        </TooltipContent>
     </Tooltip>
   </TooltipProvider>
 );
};

export default ThemeToggle;
