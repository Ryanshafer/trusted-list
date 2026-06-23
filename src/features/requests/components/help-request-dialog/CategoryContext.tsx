import { AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BicepsFlexed, Briefcase, Check, Link, Paperclip, X } from "lucide-react";
import type { DialogErrors } from "@/features/requests/utils/help-request-dialog";
import type { AskContact } from "@/features/requests/components/HelpRequestDialog";
import type { CategoryContextState } from "@/features/requests/hooks/useCategoryContextState";
import { Fade } from "./Fade";
import { ContactSearchInput } from "./ContactSearchInput";

const toggleItemClassName =
  "rounded-lg border border-border-75 bg-muted/20 h-9 text-sm font-semibold hover:bg-muted-50 data-[state=on]:bg-primary-25 data-[state=on]:border-primary data-[state=on]:text-accent-foreground";

export function categoryHasContextStep(category: string | undefined): boolean {
  return ["introduction", "opportunity", "endorse", "connect", "mentorship", "feedback"].includes(
    category ?? "",
  );
}

export function categoryRequiresContextStep(category: string | undefined): boolean {
  return ["introduction", "opportunity", "endorse", "mentorship"].includes(category ?? "");
}

export function getContextStepTitle(category: string | undefined): string {
  switch (category) {
    case "introduction": return "Who would you like to be introduced to?";
    case "opportunity": return "What are you looking to do?";
    case "endorse": return "What should the recommendation cover?";
    case "mentorship": return "What kind of mentorship are you looking for?";
    case "feedback": return "Anything you'd like them to look at?";
    case "connect": return "Where do you know each other?";
    default: return "A few more details";
  }
}

export function CategoryContextFields({
  categoryContext,
  filteredIntroContacts,
  companies,
  userUnvouchedSkills,
  clearError,
}: {
  categoryContext: CategoryContextState;
  filteredIntroContacts: AskContact[];
  companies: string[];
  userUnvouchedSkills: string[];
  clearError: (key: keyof DialogErrors) => void;
}) {
  const {
    isIntroduction, isOpportunity, isMentorship, isVouch, isConnect, isFeedback,
    introSearchTerm, setIntroSearchTerm, selectedIntroContact, setSelectedIntroContact,
    opportunityIntent, setOpportunityIntent,
    mentorshipDuration, setMentorshipDuration,
    vouchType, setVouchType, vouchSkill, setVouchSkill, vouchSkillOpen, setVouchSkillOpen,
    connectCompany, setConnectCompany, connectCompanyOpen, setConnectCompanyOpen,
    feedbackAttachment, setFeedbackAttachment, feedbackLink, setFeedbackLink, feedbackFile, setFeedbackFile,
  } = categoryContext;

  if (isIntroduction) {
    return selectedIntroContact ? (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted-25 px-3 py-2">
        <Avatar className="h-8 w-8 shrink-0 border-2 border-primary-foreground shadow-md">
          <AvatarImage src={selectedIntroContact.avatarUrl} alt={selectedIntroContact.name} className="object-cover" />
          <AvatarFallback className="text-sm font-semibold">{selectedIntroContact.name[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <p className="text-sm font-semibold text-foreground">{selectedIntroContact.name}</p>
          <p className="text-xs text-muted-foreground">{selectedIntroContact.role}</p>
        </div>
        <button
          type="button"
          onClick={() => { setSelectedIntroContact(null); setIntroSearchTerm(""); }}
          aria-label={`Remove ${selectedIntroContact.name}`}
          className="ml-auto flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    ) : (
      <div className="space-y-2 p-0.5">
        <ContactSearchInput
          placeholder="Search by name or role…"
          searchTerm={introSearchTerm}
          filteredContacts={filteredIntroContacts}
          onSearchChange={setIntroSearchTerm}
          onSelect={(contact) => { setSelectedIntroContact(contact); setIntroSearchTerm(""); }}
        />
      </div>
    );
  }

  if (isOpportunity) {
    return (
      <ToggleGroup
        type="single"
        value={opportunityIntent}
        onValueChange={(v) => { if (v) { setOpportunityIntent(v as "hire" | "get-hired"); clearError("context"); } }}
        className="grid grid-cols-2 gap-2"
      >
        <ToggleGroupItem value="get-hired" className={toggleItemClassName}>
          I'm Job Hunting
        </ToggleGroupItem>
        <ToggleGroupItem value="hire" className={toggleItemClassName}>
          I'm Hiring
        </ToggleGroupItem>
      </ToggleGroup>
    );
  }

  if (isVouch) {
    return (
      <div className="space-y-3">
        <ToggleGroup
          type="single"
          value={vouchType}
          onValueChange={(v) => {
            if (v) { setVouchType(v as "myself" | "skill"); setVouchSkill(null); setVouchSkillOpen(false); clearError("context"); }
          }}
          className="grid grid-cols-2 gap-2"
        >
          <ToggleGroupItem value="myself" className={toggleItemClassName}>
            My Character
          </ToggleGroupItem>
          <ToggleGroupItem value="skill" className={toggleItemClassName}>
            A Specific Skill
          </ToggleGroupItem>
        </ToggleGroup>
        <AnimatePresence initial={false}>
          {vouchType === "skill" && userUnvouchedSkills.length > 0 && (
            <Fade key="vouch-skill">
              <Popover open={vouchSkillOpen} onOpenChange={setVouchSkillOpen}>
                <PopoverTrigger asChild>
                  <button type="button" className="flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-background px-3 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <BicepsFlexed className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className={`flex-1 text-sm ${vouchSkill ? "text-foreground" : "text-muted-foreground"}`}>
                      {vouchSkill ?? "Select a skill…"}
                    </span>
                    {vouchSkill && (
                      <span role="button" aria-label="Clear skill" onClick={(e) => { e.stopPropagation(); setVouchSkill(null); }} className="text-muted-foreground hover:text-foreground">
                        <X className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" side="top">
                  <Command>
                    <CommandInput placeholder="Search skills…" />
                    <CommandList>
                      <CommandEmpty>No skills found.</CommandEmpty>
                      <CommandGroup>
                        {userUnvouchedSkills.map((skill) => (
                          <CommandItem key={skill} value={skill} onSelect={() => { setVouchSkill(skill); setVouchSkillOpen(false); }}>
                            <Check className={`mr-2 h-4 w-4 ${vouchSkill === skill ? "opacity-100" : "opacity-0"}`} />
                            {skill}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </Fade>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (isConnect && companies.length > 0) {
    return (
      <Popover open={connectCompanyOpen} onOpenChange={setConnectCompanyOpen}>
        <PopoverTrigger asChild>
          <button type="button" className="flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-background px-3 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className={`flex-1 text-sm ${connectCompany ? "text-foreground" : "text-muted-foreground"}`}>
              {connectCompany ?? "Select a company…"}
            </span>
            {connectCompany && (
              <span role="button" aria-label="Clear company" onClick={(e) => { e.stopPropagation(); setConnectCompany(null); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" side="top">
          <Command>
            <CommandInput placeholder="Search companies…" />
            <CommandList>
              <CommandEmpty>No companies found.</CommandEmpty>
              <CommandGroup>
                {companies.map((company) => (
                  <CommandItem key={company} value={company} onSelect={() => { setConnectCompany(company); setConnectCompanyOpen(false); }}>
                    <Check className={`mr-2 h-4 w-4 ${connectCompany === company ? "opacity-100" : "opacity-0"}`} />
                    {company}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  if (isMentorship) {
    return (
      <ToggleGroup
        type="single"
        value={mentorshipDuration}
        onValueChange={(v) => { if (v) { setMentorshipDuration(v as "short-term" | "long-term"); clearError("context"); } }}
        className="grid grid-cols-2 gap-2"
      >
        <ToggleGroupItem value="short-term" className={toggleItemClassName}>
          A Few Sessions
        </ToggleGroupItem>
        <ToggleGroupItem value="long-term" className={toggleItemClassName}>
          An Ongoing Mentor
        </ToggleGroupItem>
      </ToggleGroup>
    );
  }

  if (isFeedback) {
    return (
      <div className="space-y-3">
        <ToggleGroup
          type="single"
          value={feedbackAttachment}
          onValueChange={(v) => {
            setFeedbackAttachment((v || "") as "link" | "file" | ""); setFeedbackLink(""); setFeedbackFile(null);
          }}
          className="grid grid-cols-2 gap-2"
        >
          <ToggleGroupItem value="link" className={toggleItemClassName}>
            A Link
          </ToggleGroupItem>
          <ToggleGroupItem value="file" className={toggleItemClassName}>
            A File
          </ToggleGroupItem>
        </ToggleGroup>
        <AnimatePresence mode="wait" initial={false}>
          {feedbackAttachment === "link" && (
            <Fade key="feedback-link">
              <div className="relative">
                <Link className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="Paste a link…"
                  className="rounded-lg bg-background pl-9 shadow-none border-border"
                  value={feedbackLink}
                  onChange={(e) => setFeedbackLink(e.target.value)}
                />
              </div>
            </Fade>
          )}
          {feedbackAttachment === "file" && (
            <Fade key="feedback-file">
              <label className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                <Paperclip className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{feedbackFile ? feedbackFile.name : "Choose a file…"}</span>
                {feedbackFile && (
                  <span role="button" aria-label="Remove file" onClick={(e) => { e.preventDefault(); setFeedbackFile(null); }} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </span>
                )}
                <input type="file" className="sr-only" onChange={(e) => setFeedbackFile(e.target.files?.[0] ?? null)} />
              </label>
            </Fade>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
}
