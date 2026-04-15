"use client"

import * as React from "react"
import { Plus, Trash2, Lightbulb, ArrowRight, X } from "lucide-react"
import { toast } from "@/features/admin/lib/toast"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { AdminPageLayout } from "./AdminShell"
import skillsRaw from "../../../../data/skills.json"
import { Separator } from "@/components/ui/separator"

// ── Initial data split ────────────────────────────────────────────────────────
// Skills that start active (visible to members) vs. in the library (inactive)

const ALL_SKILLS: string[] = skillsRaw as string[]

const INITIALLY_ACTIVE = new Set([
  "Product Design",
  "UX Research",
  "Interaction Design",
  "Visual Design",
  "Design Systems",
  "Frontend Engineering",
  "Backend Engineering",
  "React",
  "TypeScript",
  "Product Management",
  "Product Strategy",
  "Brand Strategy",
  "B2B SaaS",
  "AI / ML",
  "Executive Leadership",
  "Community Building",
  "Growth",
  "Fundraising",
])

const INITIAL_ACTIVE = ALL_SKILLS.filter((s) => INITIALLY_ACTIVE.has(s)).sort()
const INITIAL_INACTIVE = ALL_SKILLS.filter((s) => !INITIALLY_ACTIVE.has(s)).sort()

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SkillsPage() {
  const [active, setActive] = React.useState<string[]>(INITIAL_ACTIVE)
  const [inactive, setInactive] = React.useState<string[]>(INITIAL_INACTIVE)
  const [search, setSearch] = React.useState("")
  const [activeSearch, setActiveSearch] = React.useState("")
  const [pendingDelete, setPendingDelete] = React.useState<string | null>(null)

  const trimmed = search.trim()

  const filteredInactive = React.useMemo(() => {
    if (!trimmed) return inactive
    const q = trimmed.toLowerCase()
    return inactive.filter((s) => s.toLowerCase().includes(q))
  }, [inactive, trimmed])

  const filteredActive = React.useMemo(() => {
    if (!activeSearch) return active
    const q = activeSearch.toLowerCase()
    return active.filter((s) => s.toLowerCase().includes(q))
  }, [active, activeSearch])

  const isNew =
    trimmed.length > 0 &&
    !active.some((s) => s.toLowerCase() === trimmed.toLowerCase()) &&
    !inactive.some((s) => s.toLowerCase() === trimmed.toLowerCase())

  // Move skill from inactive library → active
  function activate(skill: string) {
    setInactive((prev) => prev.filter((s) => s !== skill).sort())
    setActive((prev) => [...prev, skill].sort())
    setSearch("")
    toast.success(`"${skill}" activated`, { description: "Now visible to members for profile selection." })
  }

  // Move skill from active → inactive library
  function deactivate(skill: string) {
    setActive((prev) => prev.filter((s) => s !== skill).sort())
    setInactive((prev) => [...prev, skill].sort())
    toast.info(`"${skill}" deactivated`, { description: "Moved back to the skill library." })
  }

  // Create brand-new skill in library (inactive by default)
  function createSkill(name: string) {
    const skill = name.trim()
    if (!skill) return
    setInactive((prev) => [...prev, skill].sort())
    setSearch("")
    toast.success(`"${skill}" created`, { description: "Skill added to the library. Activate it to make it available to members." })
  }

  // Permanently delete from library
  function handleDeleteConfirmed() {
    if (!pendingDelete) return
    const skill = pendingDelete
    setInactive((prev) => prev.filter((s) => s !== skill))
    setPendingDelete(null)
    toast.success(`"${skill}" deleted`, { description: "Skill permanently removed from the platform." })
  }

  return (
    <AdminPageLayout>
      <div className="flex flex-col gap-6">
        {/* Page header */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Skills</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Activate skills from the library to make them available to members. Deactivating returns them to the library.
          </p>
        </div>
        
        <Separator />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">

          {/* ── Left: Skill Library ─────────────────────────────────────── */}
          <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Skill Library</h2>
                <p className="text-xs text-muted-foreground">
                  Search and click to activate the skill
                </p>
              </div>
              <Badge
                variant="outline"
                className="rounded-full border-border bg-muted/50 px-2.5 text-[11px] font-semibold tabular-nums text-muted-foreground"
              >
                {inactive.length}
              </Badge>
            </div>

            {/* Command search + list */}
            <Command shouldFilter={false} className="rounded-none border-0 bg-transparent">
              <div className="relative">
                <CommandInput
                  placeholder="Search or create a skill…"
                  value={search}
                  onValueChange={setSearch}
                  className={search ? "pr-8" : ""}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && isNew) {
                      e.preventDefault()
                      createSkill(trimmed)
                    }
                    if (e.key === "Escape" && search) {
                      e.preventDefault()
                      setSearch("")
                    }
                  }}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <CommandList className="max-h-[100px] lg:max-h-[380px]">
                {/* Create new */}
                {isNew && (
                  <CommandGroup heading="Create new">
                    <CommandItem
                      value={`__create__${trimmed}`}
                      onSelect={() => createSkill(trimmed)}
                      className="gap-2"
                    >
                      <Plus className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>
                        Create{" "}
                        <span className="font-medium text-foreground">"{trimmed}"</span>
                      </span>
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        Press Enter
                      </span>
                    </CommandItem>
                  </CommandGroup>
                )}

                {/* Inactive skills list */}
                {filteredInactive.length > 0 ? (
                  <CommandGroup heading={trimmed ? "Matching" : "All skills in library"}>
                    {filteredInactive.map((skill) => (
                      <CommandItem
                        key={skill}
                        value={skill}
                        // prevent cmdk's built-in select from triggering
                        onSelect={() => activate(skill)}
                        className="group/item flex cursor-pointer items-center justify-between data-[selected=true]:bg-accent/60"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Lightbulb className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                          <span className="truncate text-sm">{skill}</span>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/0 transition-colors group-hover/item:text-muted-foreground/50" />
                        </div>
                        <div className="ml-3 flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover/item:opacity-100 data-[selected=true]:opacity-100">
                          {/* Permanently delete */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setPendingDelete(skill) }}
                            className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Delete ${skill}`}
                            title="Delete permanently"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : !isNew ? (
                  <CommandEmpty>
                    {trimmed
                      ? `No skills match "${trimmed}" — press Enter to create it.`
                      : "The library is empty."}
                  </CommandEmpty>
                ) : null}
              </CommandList>
            </Command>
          </div>

          {/* ── Right: Active Skills ────────────────────────────────────── */}
          <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Active Skills</h2>
                <p className="text-xs text-muted-foreground">
                  Visible to members on their profiles
                </p>
              </div>
              <Badge
                variant="outline"
                className="rounded-full border-primary/30 bg-primary/10 px-2.5 text-[11px] font-semibold tabular-nums text-primary"
              >
                {active.length}
              </Badge>
            </div>

            {/* Active skills search + list */}
            <Command shouldFilter={false} className="rounded-none border-0 bg-transparent">
              <div className="relative">
                <CommandInput
                  placeholder="Search active skills…"
                  value={activeSearch}
                  onValueChange={setActiveSearch}
                  className={activeSearch ? "pr-8" : ""}
                  onKeyDown={(e) => {
                    if (e.key === "Escape" && activeSearch) {
                      e.preventDefault()
                      setActiveSearch("")
                    }
                  }}
                />
                {activeSearch && (
                  <button
                    type="button"
                    onClick={() => setActiveSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <CommandList className="max-h-[220px] lg:max-h-[380px]">
                {active.length === 0 ? (
                  <CommandEmpty>
                    <div className="flex flex-col items-center gap-2 py-4">
                      <Lightbulb className="h-7 w-7 text-muted-foreground/30" />
                      <p className="text-sm font-medium text-muted-foreground">No active skills</p>
                      <p className="text-xs text-muted-foreground/60">
                        Activate skills from the library.
                      </p>
                    </div>
                  </CommandEmpty>
                ) : filteredActive.length > 0 ? (
                  <CommandGroup heading={activeSearch ? "Matching" : "All active skills"}>
                    {filteredActive.map((skill) => (
                      <CommandItem
                        key={skill}
                        value={skill}
                        onSelect={() => {}}
                        className="group/item flex items-center justify-between data-[selected=true]:bg-accent/60"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Lightbulb className="h-3.5 w-3.5 shrink-0 text-primary/50" />
                          <span className="truncate text-sm">{skill}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => deactivate(skill)}
                          className="ml-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-destructive border border-destructive/30 opacity-0 transition-colors hover:bg-muted hover:text-foreground group-hover/item:opacity-100 data-[selected=true]:opacity-100"
                          aria-label={`Deactivate ${skill}`}
                          title="Deactivate — returns to library"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : (
                  <CommandEmpty>No active skills match "{activeSearch}".</CommandEmpty>
                )}
              </CommandList>
            </Command>
          </div>
        </div>
      </div>

      {/* Permanent delete confirmation */}
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => { if (!open) setPendingDelete(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete skill permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">"{pendingDelete}"</span> will be
              permanently removed from the platform. It won't appear in the library or be available
              for activation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirmed}
            >
              Delete skill
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageLayout>
  )
}
