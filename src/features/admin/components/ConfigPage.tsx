"use client"

import * as React from "react"
import { Plus, Trash2, BicepsFlexed, ArrowRight, X, Briefcase } from "lucide-react"
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AdminPageLayout } from "./AdminShell"
import skillsRaw from "../../../../data/skills.json"
import skillsActiveRaw from "../../../../data/skills-active.json"
import jobTitlesRaw from "../../../../data/job-titles.json"
import jobTitlesActiveRaw from "../../../../data/job-titles-active.json"
import { Separator } from "@/components/ui/separator"

// ── Skills data ───────────────────────────────────────────────────────────────

const ALL_SKILLS: string[] = skillsRaw as string[]
const ACTIVE_SKILLS_SET = new Set(skillsActiveRaw as string[])

const INITIAL_ACTIVE_SKILLS = ALL_SKILLS.filter((s) => ACTIVE_SKILLS_SET.has(s)).sort()
const INITIAL_INACTIVE_SKILLS = ALL_SKILLS.filter((s) => !ACTIVE_SKILLS_SET.has(s)).sort()

// ── Job Titles data ───────────────────────────────────────────────────────────

const ALL_JOB_TITLES: string[] = jobTitlesRaw as string[]
const ACTIVE_JOB_TITLES_SET = new Set(jobTitlesActiveRaw as string[])

const INITIAL_ACTIVE_JOB_TITLES = ALL_JOB_TITLES.filter((t) => ACTIVE_JOB_TITLES_SET.has(t)).sort()
const INITIAL_INACTIVE_JOB_TITLES = ALL_JOB_TITLES.filter((t) => !ACTIVE_JOB_TITLES_SET.has(t)).sort()

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ConfigPage() {
  // Skills state
  const [activeSkills, setActiveSkills] = React.useState<string[]>(INITIAL_ACTIVE_SKILLS)
  const [inactiveSkills, setInactiveSkills] = React.useState<string[]>(INITIAL_INACTIVE_SKILLS)
  const [skillSearch, setSkillSearch] = React.useState("")
  const [activeSkillSearch, setActiveSkillSearch] = React.useState("")
  const [pendingDeleteSkill, setPendingDeleteSkill] = React.useState<string | null>(null)

  // Job Titles state
  const [activeJT, setActiveJT] = React.useState<string[]>(INITIAL_ACTIVE_JOB_TITLES)
  const [inactiveJT, setInactiveJT] = React.useState<string[]>(INITIAL_INACTIVE_JOB_TITLES)
  const [jtSearch, setJtSearch] = React.useState("")
  const [activeJtSearch, setActiveJtSearch] = React.useState("")
  const [pendingDeleteJT, setPendingDeleteJT] = React.useState<string | null>(null)

  // ── Skills logic ────────────────────────────────────────────────────────────

  const skillTrimmed = skillSearch.trim()

  const filteredInactiveSkills = React.useMemo(() => {
    if (!skillTrimmed) return inactiveSkills
    const q = skillTrimmed.toLowerCase()
    return inactiveSkills.filter((s) => s.toLowerCase().includes(q))
  }, [inactiveSkills, skillTrimmed])

  const filteredActiveSkills = React.useMemo(() => {
    if (!activeSkillSearch) return activeSkills
    const q = activeSkillSearch.toLowerCase()
    return activeSkills.filter((s) => s.toLowerCase().includes(q))
  }, [activeSkills, activeSkillSearch])

  const isNewSkill =
    skillTrimmed.length > 0 &&
    !activeSkills.some((s) => s.toLowerCase() === skillTrimmed.toLowerCase()) &&
    !inactiveSkills.some((s) => s.toLowerCase() === skillTrimmed.toLowerCase())

  function activateSkill(skill: string) {
    setInactiveSkills((prev) => prev.filter((s) => s !== skill).sort())
    setActiveSkills((prev) => [...prev, skill].sort())
    setSkillSearch("")
    toast.success(`"${skill}" activated`, { description: "Now visible to members for profile selection." })
  }

  function deactivateSkill(skill: string) {
    setActiveSkills((prev) => prev.filter((s) => s !== skill).sort())
    setInactiveSkills((prev) => [...prev, skill].sort())
    toast.info(`"${skill}" deactivated`, { description: "Moved back to the skill library." })
  }

  function createSkill(name: string) {
    const skill = name.trim()
    if (!skill) return
    setInactiveSkills((prev) => [...prev, skill].sort())
    setSkillSearch("")
    toast.success(`"${skill}" created`, { description: "Skill added to the library. Activate it to make it available to members." })
  }

  function handleDeleteSkillConfirmed() {
    if (!pendingDeleteSkill) return
    const skill = pendingDeleteSkill
    setInactiveSkills((prev) => prev.filter((s) => s !== skill))
    setPendingDeleteSkill(null)
    toast.success(`"${skill}" deleted`, { description: "Skill permanently removed from the platform." })
  }

  // ── Job Titles logic ────────────────────────────────────────────────────────

  const jtTrimmed = jtSearch.trim()

  const filteredInactiveJT = React.useMemo(() => {
    if (!jtTrimmed) return inactiveJT
    const q = jtTrimmed.toLowerCase()
    return inactiveJT.filter((t) => t.toLowerCase().includes(q))
  }, [inactiveJT, jtTrimmed])

  const filteredActiveJT = React.useMemo(() => {
    if (!activeJtSearch) return activeJT
    const q = activeJtSearch.toLowerCase()
    return activeJT.filter((t) => t.toLowerCase().includes(q))
  }, [activeJT, activeJtSearch])

  const isNewJT =
    jtTrimmed.length > 0 &&
    !activeJT.some((t) => t.toLowerCase() === jtTrimmed.toLowerCase()) &&
    !inactiveJT.some((t) => t.toLowerCase() === jtTrimmed.toLowerCase())

  function activateJT(title: string) {
    setInactiveJT((prev) => prev.filter((t) => t !== title).sort())
    setActiveJT((prev) => [...prev, title].sort())
    setJtSearch("")
    toast.success(`"${title}" activated`, { description: "Now visible to members for profile selection." })
  }

  function deactivateJT(title: string) {
    setActiveJT((prev) => prev.filter((t) => t !== title).sort())
    setInactiveJT((prev) => [...prev, title].sort())
    toast.info(`"${title}" deactivated`, { description: "Moved back to the job title library." })
  }

  function createJT(name: string) {
    const title = name.trim()
    if (!title) return
    setInactiveJT((prev) => [...prev, title].sort())
    setJtSearch("")
    toast.success(`"${title}" created`, { description: "Job title added to the library. Activate it to make it available to members." })
  }

  function handleDeleteJTConfirmed() {
    if (!pendingDeleteJT) return
    const title = pendingDeleteJT
    setInactiveJT((prev) => prev.filter((t) => t !== title))
    setPendingDeleteJT(null)
    toast.success(`"${title}" deleted`, { description: "Job title permanently removed from the platform." })
  }

  return (
    <AdminPageLayout>
      <div className="flex flex-col gap-6">
        {/* Page header */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Configurations</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage the skills and job titles available to members on their profiles.
          </p>
        </div>

        <Tabs defaultValue="skills" className="flex flex-col gap-6">
          <div className="flex justify-center">
            <TabsList className="rounded-full bg-muted/30">
              <TabsTrigger
                value="skills"
                className="rounded-full px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Skills
              </TabsTrigger>
              <TabsTrigger
                value="job-titles"
                className="rounded-full px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Job Titles
              </TabsTrigger>
            </TabsList>
          </div>

          <Separator />

          {/* ── Skills tab ──────────────────────────────────────────────────── */}
          <TabsContent value="skills">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">

              {/* Left: Skill Library */}
              <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Skill Library</h2>
                    <p className="text-xs text-muted-foreground">Search and click to activate the skill</p>
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-full border-border bg-muted/50 px-2.5 text-[11px] font-semibold tabular-nums text-muted-foreground"
                  >
                    {inactiveSkills.length}
                  </Badge>
                </div>

                <Command shouldFilter={false} className="rounded-none border-0 bg-transparent">
                  <div className="relative">
                    <CommandInput
                      placeholder="Search or create a skill…"
                      value={skillSearch}
                      onValueChange={setSkillSearch}
                      className={skillSearch ? "pr-8" : ""}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && isNewSkill) {
                          e.preventDefault()
                          createSkill(skillTrimmed)
                        }
                        if (e.key === "Escape" && skillSearch) {
                          e.preventDefault()
                          setSkillSearch("")
                        }
                      }}
                    />
                    {skillSearch && (
                      <button
                        type="button"
                        onClick={() => setSkillSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label="Clear search"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <CommandList className="max-h-[100px] lg:max-h-[380px]">
                    {isNewSkill && (
                      <CommandGroup heading="Create new">
                        <CommandItem
                          value={`__create__${skillTrimmed}`}
                          onSelect={() => createSkill(skillTrimmed)}
                          className="gap-2"
                        >
                          <Plus className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span>
                            Create <span className="font-medium text-foreground">"{skillTrimmed}"</span>
                          </span>
                          <span className="ml-auto text-[10px] text-muted-foreground">Press Enter</span>
                        </CommandItem>
                      </CommandGroup>
                    )}
                    {filteredInactiveSkills.length > 0 ? (
                      <CommandGroup heading={skillTrimmed ? "Matching" : "All skills in library"}>
                        {filteredInactiveSkills.map((skill) => (
                          <CommandItem
                            key={skill}
                            value={skill}
                            onSelect={() => activateSkill(skill)}
                            className="group/item flex cursor-pointer items-center justify-between data-[selected=true]:bg-accent/60"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <BicepsFlexed className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                              <span className="truncate text-sm">{skill}</span>
                              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/0 transition-colors group-hover/item:text-muted-foreground/50" />
                            </div>
                            <div className="ml-3 flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover/item:opacity-100 data-[selected=true]:opacity-100">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setPendingDeleteSkill(skill) }}
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
                    ) : !isNewSkill ? (
                      <CommandEmpty>
                        {skillTrimmed
                          ? `No skills match "${skillTrimmed}" — press Enter to create it.`
                          : "The library is empty."}
                      </CommandEmpty>
                    ) : null}
                  </CommandList>
                </Command>
              </div>

              {/* Right: Active Skills */}
              <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Active Skills</h2>
                    <p className="text-xs text-muted-foreground">Visible to members on their profiles</p>
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-full border-primary/30 bg-primary/10 px-2.5 text-[11px] font-semibold tabular-nums text-primary"
                  >
                    {activeSkills.length}
                  </Badge>
                </div>

                <Command shouldFilter={false} className="rounded-none border-0 bg-transparent">
                  <div className="relative">
                    <CommandInput
                      placeholder="Search active skills…"
                      value={activeSkillSearch}
                      onValueChange={setActiveSkillSearch}
                      className={activeSkillSearch ? "pr-8" : ""}
                      onKeyDown={(e) => {
                        if (e.key === "Escape" && activeSkillSearch) {
                          e.preventDefault()
                          setActiveSkillSearch("")
                        }
                      }}
                    />
                    {activeSkillSearch && (
                      <button
                        type="button"
                        onClick={() => setActiveSkillSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label="Clear search"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <CommandList className="max-h-[220px] lg:max-h-[380px]">
                    {activeSkills.length === 0 ? (
                      <CommandEmpty>
                        <div className="flex flex-col items-center gap-2 py-4">
                          <BicepsFlexed className="h-7 w-7 text-muted-foreground/30" />
                          <p className="text-sm font-medium text-muted-foreground">No active skills</p>
                          <p className="text-xs text-muted-foreground/60">Activate skills from the library.</p>
                        </div>
                      </CommandEmpty>
                    ) : filteredActiveSkills.length > 0 ? (
                      <CommandGroup heading={activeSkillSearch ? "Matching" : "All active skills"}>
                        {filteredActiveSkills.map((skill) => (
                          <CommandItem
                            key={skill}
                            value={skill}
                            onSelect={() => {}}
                            className="group/item flex items-center justify-between data-[selected=true]:bg-accent/60"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <BicepsFlexed className="h-3.5 w-3.5 shrink-0 text-primary/50" />
                              <span className="truncate text-sm">{skill}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => deactivateSkill(skill)}
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
                      <CommandEmpty>No active skills match "{activeSkillSearch}".</CommandEmpty>
                    )}
                  </CommandList>
                </Command>
              </div>
            </div>
          </TabsContent>

          {/* ── Job Titles tab ──────────────────────────────────────────────── */}
          <TabsContent value="job-titles">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">

              {/* Left: Job Title Library */}
              <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Job Title Library</h2>
                    <p className="text-xs text-muted-foreground">Search and click to activate the title</p>
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-full border-border bg-muted/50 px-2.5 text-[11px] font-semibold tabular-nums text-muted-foreground"
                  >
                    {inactiveJT.length}
                  </Badge>
                </div>

                <Command shouldFilter={false} className="rounded-none border-0 bg-transparent">
                  <div className="relative">
                    <CommandInput
                      placeholder="Search or create a job title…"
                      value={jtSearch}
                      onValueChange={setJtSearch}
                      className={jtSearch ? "pr-8" : ""}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && isNewJT) {
                          e.preventDefault()
                          createJT(jtTrimmed)
                        }
                        if (e.key === "Escape" && jtSearch) {
                          e.preventDefault()
                          setJtSearch("")
                        }
                      }}
                    />
                    {jtSearch && (
                      <button
                        type="button"
                        onClick={() => setJtSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label="Clear search"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <CommandList className="max-h-[100px] lg:max-h-[380px]">
                    {isNewJT && (
                      <CommandGroup heading="Create new">
                        <CommandItem
                          value={`__create__${jtTrimmed}`}
                          onSelect={() => createJT(jtTrimmed)}
                          className="gap-2"
                        >
                          <Plus className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span>
                            Create <span className="font-medium text-foreground">"{jtTrimmed}"</span>
                          </span>
                          <span className="ml-auto text-[10px] text-muted-foreground">Press Enter</span>
                        </CommandItem>
                      </CommandGroup>
                    )}
                    {filteredInactiveJT.length > 0 ? (
                      <CommandGroup heading={jtTrimmed ? "Matching" : "All job titles in library"}>
                        {filteredInactiveJT.map((title) => (
                          <CommandItem
                            key={title}
                            value={title}
                            onSelect={() => activateJT(title)}
                            className="group/item flex cursor-pointer items-center justify-between data-[selected=true]:bg-accent/60"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Briefcase className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                              <span className="truncate text-sm">{title}</span>
                              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/0 transition-colors group-hover/item:text-muted-foreground/50" />
                            </div>
                            <div className="ml-3 flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover/item:opacity-100 data-[selected=true]:opacity-100">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setPendingDeleteJT(title) }}
                                className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                aria-label={`Delete ${title}`}
                                title="Delete permanently"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ) : !isNewJT ? (
                      <CommandEmpty>
                        {jtTrimmed
                          ? `No job titles match "${jtTrimmed}" — press Enter to create it.`
                          : "The library is empty."}
                      </CommandEmpty>
                    ) : null}
                  </CommandList>
                </Command>
              </div>

              {/* Right: Active Job Titles */}
              <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Active Job Titles</h2>
                    <p className="text-xs text-muted-foreground">Visible to members on their profiles</p>
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-full border-primary/30 bg-primary/10 px-2.5 text-[11px] font-semibold tabular-nums text-primary"
                  >
                    {activeJT.length}
                  </Badge>
                </div>

                <Command shouldFilter={false} className="rounded-none border-0 bg-transparent">
                  <div className="relative">
                    <CommandInput
                      placeholder="Search active job titles…"
                      value={activeJtSearch}
                      onValueChange={setActiveJtSearch}
                      className={activeJtSearch ? "pr-8" : ""}
                      onKeyDown={(e) => {
                        if (e.key === "Escape" && activeJtSearch) {
                          e.preventDefault()
                          setActiveJtSearch("")
                        }
                      }}
                    />
                    {activeJtSearch && (
                      <button
                        type="button"
                        onClick={() => setActiveJtSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label="Clear search"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <CommandList className="max-h-[220px] lg:max-h-[380px]">
                    {activeJT.length === 0 ? (
                      <CommandEmpty>
                        <div className="flex flex-col items-center gap-2 py-4">
                          <Briefcase className="h-7 w-7 text-muted-foreground/30" />
                          <p className="text-sm font-medium text-muted-foreground">No active job titles</p>
                          <p className="text-xs text-muted-foreground/60">Activate job titles from the library.</p>
                        </div>
                      </CommandEmpty>
                    ) : filteredActiveJT.length > 0 ? (
                      <CommandGroup heading={activeJtSearch ? "Matching" : "All active job titles"}>
                        {filteredActiveJT.map((title) => (
                          <CommandItem
                            key={title}
                            value={title}
                            onSelect={() => {}}
                            className="group/item flex items-center justify-between data-[selected=true]:bg-accent/60"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Briefcase className="h-3.5 w-3.5 shrink-0 text-primary/50" />
                              <span className="truncate text-sm">{title}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => deactivateJT(title)}
                              className="ml-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-destructive border border-destructive/30 opacity-0 transition-colors hover:bg-muted hover:text-foreground group-hover/item:opacity-100 data-[selected=true]:opacity-100"
                              aria-label={`Deactivate ${title}`}
                              title="Deactivate — returns to library"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ) : (
                      <CommandEmpty>No active job titles match "{activeJtSearch}".</CommandEmpty>
                    )}
                  </CommandList>
                </Command>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Skills delete confirmation */}
      <AlertDialog
        open={pendingDeleteSkill !== null}
        onOpenChange={(open) => { if (!open) setPendingDeleteSkill(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete skill permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">"{pendingDeleteSkill}"</span> will be
              permanently removed from the platform. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteSkillConfirmed}
            >
              Delete skill
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Job Titles delete confirmation */}
      <AlertDialog
        open={pendingDeleteJT !== null}
        onOpenChange={(open) => { if (!open) setPendingDeleteJT(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete job title permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">"{pendingDeleteJT}"</span> will be
              permanently removed from the platform. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteJTConfirmed}
            >
              Delete job title
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageLayout>
  )
}
