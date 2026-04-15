import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, ArrowRight, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { SearchCombobox, type ComboboxItem } from "@/components/SearchCombobox";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type Referrer = { firstName: string; lastName: string; id: string };
type JoinFormData = {
  firstName: string;
  lastName: string;
  email: string;
  linkedin: string;
  agreedToTerms: boolean;
};
type JoinFormErrors = Record<string, string | undefined>;
type InviteState = {
  referrer: Referrer;
  formData: JoinFormData;
};

// ── Mock API ──────────────────────────────────────────────────────────────────

async function searchSkills(query: string): Promise<ComboboxItem[]> {
  await new Promise((r) => setTimeout(r, 280));
  const { default: all } = await import("../../../data/skills.json");
  const q = query.toLowerCase();
  return (all as string[])
    .filter((s) => s.toLowerCase().includes(q))
    .slice(0, 10)
    .map((s) => ({ value: s, label: s }));
}

// ── Constants ─────────────────────────────────────────────────────────────────

const OWN_WORDS_QUESTIONS = [
  "What help do people come to you for?",
  "What problems do you love solving?",
  "What does a great work day look like?",
];

const MAX_ANSWER_LENGTH = 220;
const EMPTY_FORM: JoinFormData = {
  firstName: "",
  lastName: "",
  email: "",
  linkedin: "",
  agreedToTerms: false,
};
const INVITED_PREFILL: JoinFormData = {
  firstName: "Jordan",
  lastName: "Rivera",
  email: "jordan.rivera@acme.com",
  linkedin: "https://linkedin.com/in/jordanrivera",
  agreedToTerms: false,
};
const EMPTY_ANSWERS = ["", "", ""];
const EMPTY_ANSWER_ERRORS = [undefined, undefined, undefined];

function parseInviteParams(search: string): InviteState | null {
  const params = new URLSearchParams(search);
  const refId = params.get("ref");
  const firstName = params.get("first_name") || params.get("firstName");
  const lastName = params.get("last_name") || params.get("lastName");
  const fullName = params.get("name") || params.get("referrer_name");

  if (!refId || !(firstName || fullName)) {
    return null;
  }

  const inviteFirstName = firstName || fullName?.split(" ")[0] || "";
  const inviteLastName = lastName || fullName?.split(" ").slice(1).join(" ") || "";

  return {
    referrer: { firstName: inviteFirstName, lastName: inviteLastName, id: refId },
    formData: INVITED_PREFILL,
  };
}

function validateStep1(formData: JoinFormData): JoinFormErrors {
  const nextErrors: Record<string, string> = {};

  if (!formData.firstName) nextErrors.firstName = "Your first name is required";
  if (!formData.lastName) nextErrors.lastName = "Your last name is required";
  if (!formData.email) nextErrors.email = "Your email is required";
  if (!formData.linkedin) nextErrors.linkedin = "Your LinkedIn is required";
  if (!formData.agreedToTerms) nextErrors.agreedToTerms = "You must agree to the terms";

  return nextErrors;
}

function validateAnswers(answers: string[]) {
  return answers.map((answer) =>
    answer.trim() ? undefined : "This field is required",
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

const ReferrerBadge = ({ name }: { name: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="inline-flex items-center gap-2 rounded-full bg-primary-500/10 px-4 py-2 text-sm font-bold text-primary-500 mb-6"
  >
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
    </span>
    {name} invited you to join The Trusted List
  </motion.div>
);

const StepIndicator = ({ step }: { step: 1 | 2 | 3 }) => (
  <div className="flex items-center justify-center gap-1.5 mt-6">
    {([1, 2, 3] as const).map((s) => (
      <div
        key={s}
        className={cn(
          "h-1.5 rounded-full transition-all duration-300",
          s === step ? "w-6 bg-neutral-700" : "w-1.5 bg-neutral-300",
        )}
      />
    ))}
  </div>
);

const stepVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

// ── JoinForm ──────────────────────────────────────────────────────────────────

export const JoinForm = () => {
  // ── State ──────────────────────────────────────────────────────────────────

  const [referrer, setReferrer] = useState<Referrer | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<JoinFormErrors>({});

  // Step 2 — skills
  const [selectedSkills, setSelectedSkills] = useState<ComboboxItem[]>([]);
  const [skillError, setSkillError] = useState<string | undefined>();

  // Step 3 — own words
  const [answers, setAnswers] = useState(EMPTY_ANSWERS);
  const [answerErrors, setAnswerErrors] = useState<(string | undefined)[]>([
    undefined,
    undefined,
    undefined,
  ]);

  const initialInviteRef = React.useRef<InviteState | null>(null);

  // ── Reset ──────────────────────────────────────────────────────────────────

  const resetMultiStepState = () => {
    setStep(1);
    setSelectedSkills([]);
    setSkillError(undefined);
    setAnswers(EMPTY_ANSWERS);
    setAnswerErrors(EMPTY_ANSWER_ERRORS);
    setIsSubmitting(false);
    setIsSuccess(false);
  };

  const applyInviteState = (invite: InviteState) => {
    setReferrer(invite.referrer);
    setIsExpanded(true);
    setFormData(invite.formData);
    setErrors({});
  };

  // ── URL param / event wiring ───────────────────────────────────────────────

  useEffect(() => {
    const invite = parseInviteParams(window.location.search);

    if (invite) {
      initialInviteRef.current = invite;
      applyInviteState(invite);
    }
  }, []);

  useEffect(() => {
    const handleOpenWaitlist = (event?: Event) => {
      const preserveInvite = (
        event as CustomEvent<{ preserveInvite?: boolean }> | undefined
      )?.detail?.preserveInvite;
      const initialInvite = initialInviteRef.current;

      resetMultiStepState();

      if (preserveInvite && initialInvite) {
        applyInviteState(initialInvite);
        return;
      }

      setReferrer(null);
      setIsExpanded(true);
      setFormData(EMPTY_FORM);
      setErrors({});
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('open-waitlist', handleOpenWaitlist);
      if (window.location.hash === '#waitlist') handleOpenWaitlist();
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('open-waitlist', handleOpenWaitlist);
      }
    };
  }, []);

  // ── Field helpers ──────────────────────────────────────────────────────────

  const handleFieldChange =
    (field: keyof typeof EMPTY_FORM) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((current) => ({ ...current, [field]: event.target.value }));
    };

  // ── Step handlers ──────────────────────────────────────────────────────────

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateStep1(formData);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setStep(2);
  };

  const handleStep2Next = () => {
    if (selectedSkills.length === 0) {
      setSkillError("Add at least one skill to continue");
      return;
    }
    setSkillError(undefined);
    setStep(3);
  };

  const handleStep3Submit = async () => {
    const newErrors = validateAnswers(answers);
    if (newErrors.some(Boolean)) {
      setAnswerErrors(newErrors);
      return;
    }
    setAnswerErrors(EMPTY_ANSWER_ERRORS);
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1800));

    if (referrer) {
      window.location.href = "/trusted-list/";
    } else {
      setIsSubmitting(false);
      setIsSuccess(true);
    }
  };

  const handleSkillSelect = useCallback(
    (item: ComboboxItem) => {
      if (selectedSkills.some((s) => s.label === item.label)) return;
      setSelectedSkills((prev) => [...prev, item]);
      setSkillError(undefined);
    },
    [selectedSkills],
  );

  // ── Success view (waitlist only) ───────────────────────────────────────────

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-8 bg-white/75 backdrop-blur-sm rounded-3xl shadow-xl border border-white/25 text-center min-h-[400px]"
      >
        <div className="h-16 w-16 bg-primary-500/10 rounded-full flex items-center justify-center mb-6">
          <Check className="h-8 w-8 text-primary-500" />
        </div>
        <h3 className="text-xl font-semibold text-neutral-600 mb-2">
          You’re on the waitlist!
        </h3>
        <p className="text-neutral-600 max-w-xs mx-auto">
          We’ll review your details and send you an invitation as soon as a spot opens. If you know a current member, ask them to nominate you to speed things up.
        </p>
      </motion.div>
    );
  }

  // ── Collapsed view ─────────────────────────────────────────────────────────

  if (!isExpanded) {
    return (
      <div className={cn("relative", "lg:mt-8")} id="join-waitlist">
        <motion.div
          layout
          transition={{ layout: { type: "spring", bounce: 0.2, duration: 0.6 } }}
          className="bg-white/10 backdrop-blur-sm rounded-3xl shadow-2xl shadow-primary-500/10 border border-white/50 p-8 md:p-10 overflow-hidden"
        >
          {referrer && (
            <ReferrerBadge
              name={`${referrer.firstName} ${referrer.lastName}`.trim()}
            />
          )}
          <div className="mb-8">
            <h2 className="text-3xl font-serif font-normal text-neutral-900 mb-2">
              {referrer
                ? `${referrer.firstName} nominated you.`
                : "Don't have an invite?"}
            </h2>
            <p className="text-neutral-600">
              {referrer ? (
                "Your invitation is waiting — we just need to confirm a few details."
              ) : (
                <>
                  <span className="block">
                    If you know a member, ask them for an invite.
                  </span>
                  <span className="mt-3 block">
                    We grow by invitation to protect trust. Join the waitlist
                    and we'll let you in when space opens up.
                  </span>
                </>
              )}
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="w-full h-12 text-base font-bold bg-neutral-600 hover:bg-neutral-800 text-white rounded-full leading-none"
          >
            {referrer ? (
              "Join the list"
            ) : (
              <>
                Join the waitlist
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── Expanded / multi-step ──────────────────────────────────────────────────

  return (
    <div className="relative" id="join-waitlist">
      <motion.div
        layout
        transition={{ layout: { type: "spring", bounce: 0.2, duration: 0.6 } }}
        className="bg-white/10 backdrop-blur-sm rounded-3xl shadow-2xl shadow-primary-500/10 border border-white/50 p-8 md:p-10 overflow-hidden"
      >
        {referrer && (
          <ReferrerBadge
            name={`${referrer.firstName} ${referrer.lastName}`.trim()}
          />
        )}

        <AnimatePresence mode="wait" initial={false}>
          {/* ── Step 1: Confirm details ──────────────────────────────────── */}
          {step === 1 && (
            <motion.div key="step-1" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <div className="mb-6">
                <h2 className="text-3xl font-serif font-normal text-neutral-600 mb-2">
                  {referrer
                    ? `${referrer.firstName} nominated you.`
                    : "Join the waitlist"}
                </h2>
                <p className="text-neutral-600">
                  {referrer
                    ? "Confirm your details to claim your invitation."
                    : "We'll let you know when your invitation is ready."}
                </p>
              </div>

              <form onSubmit={handleStep1Next} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="First name"
                      className={cn(
                        "h-12 rounded-xl bg-white/50",
                        errors.firstName && "border-red-500",
                      )}
                      value={formData.firstName}
                      onChange={handleFieldChange("firstName")}
                    />
                    {errors.firstName && (
                      <p className="text-sm text-red-500">{errors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Last name"
                      className={cn(
                        "h-12 rounded-xl bg-white/50",
                        errors.lastName && "border-red-500",
                      )}
                      value={formData.lastName}
                      onChange={handleFieldChange("lastName")}
                    />
                    {errors.lastName && (
                      <p className="text-sm text-red-500">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jane@company.com"
                    className={cn(
                      "h-12 rounded-xl bg-white/50",
                      errors.email && "border-red-500",
                    )}
                    value={formData.email}
                    onChange={handleFieldChange("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    placeholder="linkedin.com/in/janedoe"
                    className={cn(
                      "h-12 rounded-xl bg-white/50",
                      errors.linkedin && "border-red-500",
                    )}
                    value={formData.linkedin}
                    onChange={handleFieldChange("linkedin")}
                  />
                  {errors.linkedin && (
                    <p className="text-sm text-red-500">{errors.linkedin}</p>
                  )}
                </div>

                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox
                    id="agreedToTerms"
                    checked={formData.agreedToTerms}
                    onCheckedChange={(checked) => {
                      setFormData((current) => ({
                        ...current,
                        agreedToTerms: checked as boolean,
                      }));
                      if (checked) {
                        setErrors((current) => ({
                          ...current,
                          agreedToTerms: undefined,
                        }));
                      }
                    }}
                    required
                  />
                  <div className="flex flex-col">
                    <Label
                      htmlFor="agreedToTerms"
                      className="text-sm text-neutral-600 leading-snug"
                    >
                      I agree to the{" "}
                      <a href="/terms" className="underline hover:no-underline">
                        Terms &amp; Conditions
                      </a>
                      ,{" "}
                      <a
                        href="/privacy"
                        className="underline hover:no-underline"
                      >
                        Privacy Policy
                      </a>
                      ,{" "}
                      <a
                        href="/communication-guidelines"
                        className="underline hover:no-underline"
                      >
                        Communication Guidelines
                      </a>{" "}
                      and{" "}
                      <a
                        href="/community-rules"
                        className="underline hover:no-underline"
                      >
                        Community Rules
                      </a>
                      .
                    </Label>
                    {errors.agreedToTerms && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.agreedToTerms}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold bg-neutral-900 hover:bg-neutral-800 text-white rounded-full mt-2 leading-none"
                >
                  Continue
                </Button>
              </form>
            </motion.div>
          )}

          {/* ── Step 2: Unvouched skills ─────────────────────────────────── */}
          {step === 2 && (
            <motion.div key="step-2" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <div className="mb-6">
                <h2 className="text-3xl font-serif font-normal text-neutral-600 mb-2">
                  Add your skills
                </h2>
                <p className="text-neutral-600">
                  Choose the skills you want to be known for. Your connections will verify them before they appear on your profile.
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <Label>Skills</Label>
                <SearchCombobox
                  searchFn={searchSkills}
                  placeholder="Search skills…"
                  keepOpenOnSelect
                  side="top"
                  onSelect={handleSkillSelect}
                />
                {skillError && (
                  <p className="text-sm text-red-500">{skillError}</p>
                )}

                {selectedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedSkills.map((skill) => (
                      <button
                        key={
                          skill.value === "__other__"
                            ? `other-${skill.label}`
                            : skill.value
                        }
                        type="button"
                        onClick={() =>
                          setSelectedSkills((prev) =>
                            prev.filter((s) => s.label !== skill.label),
                          )
                        }
                        aria-label={`Remove ${skill.label}`}
                        className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-sm font-semibold leading-none text-foreground transition-colors hover:bg-accent hover:border-destructive/40 hover:text-destructive"
                      >
                        {skill.label}
                        <X className="h-3 w-3 opacity-50" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="button"
                onClick={handleStep2Next}
                className="w-full h-12 text-base font-bold bg-neutral-900 hover:bg-neutral-800 text-white rounded-full mt-8 leading-none"
              >
                Add skills
              </Button>
            </motion.div>
          )}

          {/* ── Step 3: In your own words ────────────────────────────────── */}
          {step === 3 && (
            <motion.div key="step-3" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <div className="mb-6">
                <h2 className="text-3xl font-serif font-normal text-neutral-600 mb-2">
                  In your own words
                </h2>
                <p className="text-neutral-600">
                  These answers will appear on your profile.
                </p>
              </div>

              <div className="flex flex-col gap-8">
                {OWN_WORDS_QUESTIONS.map((question, index) => {
                  const length = answers[index].length;
                  return (
                    <div key={question} className="flex flex-col gap-1.5">
                      <div className="flex items-start justify-between gap-6">
                        <Label
                          htmlFor={`own-words-${index}`}
                          className="text-base font-medium leading-5"
                        >
                          {question}
                        </Label>
                        <p className="shrink-0 text-sm font-normal text-muted-foreground">
                          <span className="text-foreground">{length}</span>/
                          {MAX_ANSWER_LENGTH}
                        </p>
                      </div>
                      <Textarea
                        id={`own-words-${index}`}
                        value={answers[index]}
                        rows={3}
                        maxLength={MAX_ANSWER_LENGTH}
                        className={cn(
                          "resize-none rounded-xl bg-white/50",
                          answerErrors[index] && "border-red-500",
                        )}
                        onChange={(e) => {
                          const clamped = e.target.value.slice(
                            0,
                            MAX_ANSWER_LENGTH,
                          );
                          setAnswers((prev) => {
                            const next = [...prev];
                            next[index] = clamped;
                            return next;
                          });
                          if (answerErrors[index]) {
                            setAnswerErrors((prev) => {
                              const next = [...prev];
                              next[index] = undefined;
                              return next;
                            });
                          }
                        }}
                      />
                      {answerErrors[index] && (
                        <p className="text-sm text-red-500">
                          {answerErrors[index]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <Button
                type="button"
                onClick={handleStep3Submit}
                disabled={isSubmitting}
                className="w-full h-12 text-base font-bold bg-neutral-900 hover:bg-neutral-800 text-white rounded-full mt-8 leading-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  "Save answers"
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <StepIndicator step={step} />
      </motion.div>
    </div>
  );
};
