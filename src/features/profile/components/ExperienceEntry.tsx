"use client";

import { forwardRef, type ReactNode, useEffect, useState } from "react";
import { CalendarIcon, MoreHorizontal, Plus, SquarePen, Trash2, CircleX } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import type { EducationEntry, JobEntry } from "../types";

const DESCRIPTION_MAX = 220;
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

type WorkDraft = JobEntry & { id: string };
type EducationDraft = EducationEntry & { id: string };

interface ExperienceSectionProps {
  jobs: JobEntry[];
  education: EducationEntry[];
  firstName?: string;
  isOwner?: boolean;
  onSave?: (experience: { jobs: JobEntry[]; education: EducationEntry[] }) => void;
}

function parseDateToMs(date: string): number {
  if (date.toLowerCase() === "present") return Infinity;
  const normalized = date.replace("-", " ");
  const parsed = Date.parse(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function sortNewestFirst(jobs: JobEntry[]): JobEntry[] {
  return [...jobs].sort((a, b) => {
    const endDiff = parseDateToMs(b.endDate) - parseDateToMs(a.endDate);
    if (endDiff !== 0) return endDiff;
    return parseDateToMs(b.startDate) - parseDateToMs(a.startDate);
  });
}

function createWorkDrafts(jobs: JobEntry[]): WorkDraft[] {
  return jobs.map((job, index) => ({
    ...job,
    id: `work-${index}-${job.title}-${job.company}`.toLowerCase().replace(/\s+/g, "-"),
  }));
}

function createEducationDrafts(education: EducationEntry[]): EducationDraft[] {
  return education.map((entry, index) => ({
    ...entry,
    id: `education-${index}-${entry.institution}`.toLowerCase().replace(/\s+/g, "-"),
  }));
}

function stripWorkDrafts(jobs: WorkDraft[]): JobEntry[] {
  return jobs.map(({ id, ...job }) => job);
}

function stripEducationDrafts(education: EducationDraft[]): EducationEntry[] {
  return education.map(({ id, ...entry }) => entry);
}

function buildDateOptions(extraValues: string[] = []): string[] {
  const currentYear = new Date().getFullYear() + 1;
  const options: string[] = [];

  for (let year = currentYear; year >= 1970; year -= 1) {
    for (let month = MONTH_LABELS.length - 1; month >= 0; month -= 1) {
      options.push(`${MONTH_LABELS[month]} ${year}`);
    }
  }

  return Array.from(new Set([...extraValues.filter(Boolean), ...options]));
}

function parseMonthYearToDate(value: string): Date | undefined {
  if (!value || value.toLowerCase() === "present") return undefined;
  const parsed = Date.parse(`${value} 1`);
  if (Number.isNaN(parsed)) return undefined;
  const date = new Date(parsed);
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatMonthYear(value: Date): string {
  return `${MONTH_LABELS[value.getMonth()]} ${value.getFullYear()}`;
}

function getFallbackDate(value?: string): string {
  if (value && value.toLowerCase() !== "present") return value;
  return formatMonthYear(new Date());
}

function createEmptyWorkDraft(): WorkDraft {
  return {
    id: `work-new-${Date.now()}`,
    startDate: formatMonthYear(new Date()),
    endDate: "present",
    location: "",
    title: "",
    company: "",
    description: "",
  };
}

function createEmptyEducationDraft(): EducationDraft {
  return {
    id: `education-new-${Date.now()}`,
    graduationYear: formatMonthYear(new Date()),
    institution: "",
    location: "",
    degree: "",
    field: "",
  };
}

const IconActionButton = forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ children, className, variant = "outline", size = "icon", ...props }, ref) => {
  return (
    <Button
      ref={ref}
      type="button"
      variant={variant}
      size={size}
      className={`h-9 w-9 rounded-full border-border bg-background text-muted-foreground shadow-none hover:bg-accent ${className ?? ""}`}
      {...props}
    >
      {children}
    </Button>
  );
});
IconActionButton.displayName = "IconActionButton";

function SectionHeader({
  title,
  showAdd,
  onAdd,
}: {
  title: string;
  showAdd?: boolean;
  onAdd?: () => void;
}) {
  return (
    <div className="flex w-full items-center gap-4 pt-4 pr-10">
      <p className="whitespace-nowrap font-serif text-lg font-normal leading-7 text-foreground">
        {title}
      </p>
      <div className="h-px flex-1 bg-border" />
      {showAdd && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onAdd}
          className="h-9 w-9 rounded-full bg-secondary text-muted-foreground hover:bg-accent"
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add {title.toLowerCase()} entry</span>
        </Button>
      )}
    </div>
  );
}

function DatePickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const selected = parseMonthYearToDate(value);

  return (
    <div className="flex w-full flex-col gap-1">
      <label className="text-sm font-medium leading-5 text-foreground">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-8 justify-between rounded-sm border-border bg-background px-1.5 py-1 text-xs font-normal shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-background"
          >
            <span>{value}</span>
            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            captionLayout="dropdown"
            onSelect={(date) => {
              if (!date) return;
              onChange(formatMonthYear(date));
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex w-[550px] items-center gap-3">
      <label className="w-[120px] shrink-0 text-sm font-medium leading-5 text-secondary-foreground">
        {label}
      </label>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 rounded-lg border-border bg-background px-2 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
      />
    </div>
  );
}

function WorkDisplayEntry({
  job,
  showActions,
  onEdit,
  onDelete,
}: {
  job: JobEntry;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const endLabel = job.endDate === "present" ? "Present" : job.endDate;

  return (
    <div className="flex items-start gap-10 mr-10">
      <p className="w-40 shrink-0 text-sm leading-5 text-muted-foreground">
        {`${job.startDate} — ${endLabel}`}
      </p>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm leading-5 text-muted-foreground">{job.location}</p>
          <p className="font-serif text-2xl font-normal leading-8 text-foreground">{job.title}</p>
          <p className="text-base font-medium leading-6 text-foreground">{job.company}</p>
        </div>
        {job.description && (
          <p className="max-w-[448px] text-base leading-6 text-muted-foreground">
            {job.description}
          </p>
        )}
      </div>
      {showActions && (
        <div className="flex items-center gap-3">
          <IconActionButton onClick={onEdit}>
            <SquarePen className="h-4 w-4" />
          </IconActionButton>
          <EntryMenu onDelete={onDelete} />
        </div>
      )}
    </div>
  );
}

function EducationDisplayEntry({
  education,
  showActions,
  onEdit,
  onDelete,
}: {
  education: EducationEntry;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex items-start gap-10 mr-10">
      <p className="w-40 shrink-0 text-sm leading-5 text-muted-foreground">
        {education.graduationYear}
      </p>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm leading-5 text-muted-foreground">{education.location}</p>
        <p className="font-serif text-2xl font-normal leading-8 text-foreground">
          {education.institution}
        </p>
        <p className="text-base font-medium leading-6 text-foreground">
          {`${education.degree} — ${education.field}`}
        </p>
      </div>
      {showActions && (
        <div className="flex items-center gap-3">
          <IconActionButton onClick={onEdit}>
            <SquarePen className="h-4 w-4" />
          </IconActionButton>
          <EntryMenu onDelete={onDelete} />
        </div>
      )}
    </div>
  );
}

function EntryMenu({
  onDelete,
  onCancelEdit,
}: {
  onDelete?: () => void;
  onCancelEdit?: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconActionButton>
          <MoreHorizontal className="h-4 w-4" />
        </IconActionButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onCancelEdit && (
          <DropdownMenuItem onClick={onCancelEdit}>
            <CircleX className="h-4 w-4" />
            Cancel edits
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
          Delete entry
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function WorkEditEntry({
  job,
  onChange,
  onDelete,
  onCancelEdit,
}: {
  job: WorkDraft;
  onChange: (next: WorkDraft) => void;
  onDelete: () => void;
  onCancelEdit: () => void;
}) {
  const descriptionLength = job.description?.length ?? 0;
  const isCurrent = job.endDate.toLowerCase() === "present";

  return (
    <div className="flex items-start gap-10 mr-10">
      <div className="flex w-40 shrink-0 flex-col gap-4">
        <div className="flex h-6 items-center gap-2">
          <Switch
            checked={isCurrent}
            onCheckedChange={(checked) =>
              onChange({
                ...job,
                endDate: checked ? "present" : getFallbackDate(job.startDate),
              })
            }
            className="h-[18px] w-[33px]"
          />
          <span className="text-sm font-medium leading-5 text-foreground">Current Role</span>
        </div>
        <DatePickerField
          label="Start date"
          value={job.startDate}
          onChange={(value) => onChange({ ...job, startDate: value })}
        />
        {!isCurrent && (
          <DatePickerField
            label="End date"
            value={job.endDate}
            onChange={(value) => onChange({ ...job, endDate: value })}
          />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <TextField
          label="Location"
          value={job.location}
          onChange={(value) => onChange({ ...job, location: value })}
        />
        <TextField
          label="Role title"
          value={job.title}
          onChange={(value) => onChange({ ...job, title: value })}
        />
        <TextField
          label="Company"
          value={job.company}
          onChange={(value) => onChange({ ...job, company: value })}
        />
        <div className="flex flex-col items-start">
          <div className="flex w-[550px] items-center justify-end">
            <p className="text-sm leading-5 text-muted-foreground">
              <span className="text-foreground">{descriptionLength}</span>/{DESCRIPTION_MAX}
            </p>
          </div>
          <div className="flex w-[550px] items-start gap-3">
            <label className="flex h-9 w-[120px] shrink-0 items-center text-sm font-medium leading-5 text-secondary-foreground">
              Description
            </label>
            <Textarea
              value={job.description ?? ""}
              maxLength={DESCRIPTION_MAX}
              onChange={(event) =>
                onChange({ ...job, description: event.target.value.slice(0, DESCRIPTION_MAX) })
              }
              className="min-h-[76px] rounded-lg border-border bg-background px-2 py-2 text-sm leading-5 text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              placeholder="Add a description"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <EntryMenu onDelete={onDelete} onCancelEdit={onCancelEdit} />
      </div>
    </div>
  );
}

function EducationEditEntry({
  education,
  onChange,
  onDelete,
  onCancelEdit,
}: {
  education: EducationDraft;
  onChange: (next: EducationDraft) => void;
  onDelete: () => void;
  onCancelEdit: () => void;
}) {
  return (
    <div className="flex items-start gap-10 mr-10">
      <div className="w-40 shrink-0">
        <DatePickerField
          label="Graduation date"
          value={education.graduationYear}
          onChange={(value) => onChange({ ...education, graduationYear: value })}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <TextField
          label="Location"
          value={education.location}
          onChange={(value) => onChange({ ...education, location: value })}
        />
        <TextField
          label="School"
          value={education.institution}
          onChange={(value) => onChange({ ...education, institution: value })}
        />
        <TextField
          label="Degree"
          value={education.degree}
          onChange={(value) => onChange({ ...education, degree: value })}
        />
        <TextField
          label="Major"
          value={education.field}
          onChange={(value) => onChange({ ...education, field: value })}
        />
      </div>

      <div className="flex items-center gap-3">
        <EntryMenu onDelete={onDelete} onCancelEdit={onCancelEdit} />
      </div>
    </div>
  );
}

export function ExperienceSection({
  jobs,
  education,
  firstName,
  isOwner,
  onSave,
}: ExperienceSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftJobs, setDraftJobs] = useState<WorkDraft[]>(() => createWorkDrafts(jobs));
  const [draftEducation, setDraftEducation] = useState<EducationDraft[]>(() =>
    createEducationDrafts(education)
  );
  const [editingEntryIds, setEditingEntryIds] = useState<Record<string, true>>({});
  const [workSnapshots, setWorkSnapshots] = useState<Record<string, WorkDraft | undefined>>({});
  const [educationSnapshots, setEducationSnapshots] = useState<
    Record<string, EducationDraft | undefined>
  >({});

  useEffect(() => {
    if (!isEditing) {
      setDraftJobs(createWorkDrafts(jobs));
      setDraftEducation(createEducationDrafts(education));
      setEditingEntryIds({});
      setWorkSnapshots({});
      setEducationSnapshots({});
    }
  }, [education, isEditing, jobs]);

  if (!isOwner && !jobs.length && !education.length) return null;

  const beginSectionEdit = () => {
    setDraftJobs(createWorkDrafts(jobs));
    setDraftEducation(createEducationDrafts(education));
    setEditingEntryIds({});
    setWorkSnapshots({});
    setEducationSnapshots({});
    setIsEditing(true);
  };

  const cancelSectionEdit = () => {
    setDraftJobs(createWorkDrafts(jobs));
    setDraftEducation(createEducationDrafts(education));
    setEditingEntryIds({});
    setWorkSnapshots({});
    setEducationSnapshots({});
    setIsEditing(false);
  };

  const saveSectionEdit = () => {
    onSave?.({
      jobs: stripWorkDrafts(draftJobs),
      education: stripEducationDrafts(draftEducation),
    });
    setIsEditing(false);
  };

  const beginWorkEdit = (id: string) => {
    const current = draftJobs.find((job) => job.id === id);
    if (!current) return;
    setWorkSnapshots((prev) => (prev[id] ? prev : { ...prev, [id]: { ...current } }));
    setEditingEntryIds((prev) => ({ ...prev, [id]: true }));
  };

  const beginEducationEdit = (id: string) => {
    const current = draftEducation.find((entry) => entry.id === id);
    if (!current) return;
    setEducationSnapshots((prev) => (prev[id] ? prev : { ...prev, [id]: { ...current } }));
    setEditingEntryIds((prev) => ({ ...prev, [id]: true }));
  };

  const cancelWorkEdit = (id: string) => {
    const snapshot = workSnapshots[id];
    setEditingEntryIds((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    if (!snapshot) {
      setDraftJobs((prev) => prev.filter((job) => job.id !== id));
      return;
    }

    setDraftJobs((prev) => prev.map((job) => (job.id === id ? snapshot : job)));
  };

  const cancelEducationEdit = (id: string) => {
    const snapshot = educationSnapshots[id];
    setEditingEntryIds((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    if (!snapshot) {
      setDraftEducation((prev) => prev.filter((entry) => entry.id !== id));
      return;
    }

    setDraftEducation((prev) => prev.map((entry) => (entry.id === id ? snapshot : entry)));
  };

  const deleteWorkEntry = (id: string) => {
    setDraftJobs((prev) => prev.filter((job) => job.id !== id));
    setEditingEntryIds((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const deleteEducationEntry = (id: string) => {
    setDraftEducation((prev) => prev.filter((entry) => entry.id !== id));
    setEditingEntryIds((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const addWorkEntry = () => {
    const next = createEmptyWorkDraft();
    setDraftJobs((prev) => [next, ...prev]);
    setEditingEntryIds((prev) => ({ ...prev, [next.id]: true }));
    setWorkSnapshots((prev) => ({ ...prev, [next.id]: undefined }));
  };

  const addEducationEntry = () => {
    const next = createEmptyEducationDraft();
    setDraftEducation((prev) => [next, ...prev]);
    setEditingEntryIds((prev) => ({ ...prev, [next.id]: true }));
    setEducationSnapshots((prev) => ({ ...prev, [next.id]: undefined }));
  };

  return (
    <section
      id="experience"
      className={`flex flex-col gap-4 border-t py-8 ${isEditing ? "bg-card pl-6" : ""}`}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-serif text-3xl font-normal text-foreground">
          {firstName ? `${firstName}'s experience` : "Experience"}
        </h2>
        {isOwner && !isEditing && (
          <div className="mr-10">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="flex h-8 items-center gap-1.5 rounded-full text-xs font-medium text-card-foreground transition-colors hover:bg-accent"
              onClick={beginSectionEdit}
            >
              <SquarePen className="h-3 w-3" />
              Edit experiences
            </Button>
          </div>
        )}
        {isOwner && isEditing && (
          <div className="mr-10 flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 rounded-full px-3 text-xs font-medium text-foreground hover:bg-background"
              onClick={cancelSectionEdit}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-full px-3 text-xs font-medium"
              onClick={saveSectionEdit}
            >
              Save experiences
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-7">
        {(isEditing || jobs.length > 0) && (
          <>
            <SectionHeader title="Work" showAdd={isEditing} onAdd={addWorkEntry} />
            {(isEditing ? draftJobs : sortNewestFirst(jobs)).map((job, index) => {
              if (!isEditing) {
                return <WorkDisplayEntry key={`${job.title}-${index}`} job={job} />;
              }

              const draftJob = job as WorkDraft;
              const isEntryEditing = Boolean(editingEntryIds[draftJob.id]);

              if (isEntryEditing) {
                return (
                  <WorkEditEntry
                    key={draftJob.id}
                    job={draftJob}
                    onChange={(next) =>
                      setDraftJobs((prev) =>
                        prev.map((entry) => (entry.id === draftJob.id ? next : entry))
                      )
                    }
                    onDelete={() => deleteWorkEntry(draftJob.id)}
                    onCancelEdit={() => cancelWorkEdit(draftJob.id)}
                  />
                );
              }

              return (
                <WorkDisplayEntry
                  key={draftJob.id}
                  job={draftJob}
                  showActions
                  onEdit={() => beginWorkEdit(draftJob.id)}
                  onDelete={() => deleteWorkEntry(draftJob.id)}
                />
              );
            })}
          </>
        )}

        {(isEditing || education.length > 0) && (
          <>
            <SectionHeader title="Education" showAdd={isEditing} onAdd={addEducationEntry} />
            {(isEditing ? draftEducation : education).map((entry, index) => {
              if (!isEditing) {
                return (
                  <EducationDisplayEntry
                    key={`${entry.institution}-${index}`}
                    education={entry}
                  />
                );
              }

              const draftEntry = entry as EducationDraft;
              const isEntryEditing = Boolean(editingEntryIds[draftEntry.id]);

              if (isEntryEditing) {
                return (
                  <EducationEditEntry
                    key={draftEntry.id}
                    education={draftEntry}
                    onChange={(next) =>
                      setDraftEducation((prev) =>
                        prev.map((current) => (current.id === draftEntry.id ? next : current))
                      )
                    }
                    onDelete={() => deleteEducationEntry(draftEntry.id)}
                    onCancelEdit={() => cancelEducationEdit(draftEntry.id)}
                  />
                );
              }

              return (
                <EducationDisplayEntry
                  key={draftEntry.id}
                  education={draftEntry}
                  showActions
                  onEdit={() => beginEducationEdit(draftEntry.id)}
                  onDelete={() => deleteEducationEntry(draftEntry.id)}
                />
              );
            })}
          </>
        )}
      </div>
    </section>
  );
}
