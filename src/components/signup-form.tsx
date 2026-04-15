import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Eye, EyeClosed, Loader2, Lock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SearchCombobox, type ComboboxItem } from "@/components/SearchCombobox"
import { AuthCard, AuthCardHeader } from "@/components/auth-card"
import { cn } from "@/lib/utils"

// ── Types ──────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5

type SignupData = {
  firstName: string
  lastName: string
  email: string
  password: string
}
type SignupErrors = Record<string, string | undefined>

// ── Mock API ───────────────────────────────────────────────────────────────────

async function searchSkills(query: string): Promise<ComboboxItem[]> {
  await new Promise((r) => setTimeout(r, 280))
  const { default: all } = await import("../../data/skills.json")
  const q = query.toLowerCase()
  return (all as string[])
    .filter((s) => s.toLowerCase().includes(q))
    .slice(0, 10)
    .map((skill) => ({ label: skill, value: skill }))
}

// ── Constants ──────────────────────────────────────────────────────────────────

const ABOUT_QUESTIONS = [
  "What help do people come to you for?",
  "What problems do you love solving?",
  "What does a great work day look like?",
]
const MAX_ANSWER_LENGTH = 220
const EMPTY_DATA: SignupData = { firstName: "", lastName: "", email: "", password: "" }
const EMPTY_ANSWERS = ["", "", ""]

// ── Sub-components ─────────────────────────────────────────────────────────────

const StepIndicator = ({ step }: { step: Step }) => (
  <div className="flex items-center justify-center gap-1.5">
    {([1, 2, 3, 4, 5] as const).map((s) => (
      <div
        key={s}
        className={cn(
          "h-1.5 rounded-full transition-all duration-300",
          s === step ? "w-6 bg-neutral-700" : "w-1.5 bg-neutral-300",
        )}
      />
    ))}
  </div>
)

const stepVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

// ── Validation ─────────────────────────────────────────────────────────────────

function validateStep1(data: SignupData): SignupErrors {
  const errors: SignupErrors = {}
  if (!data.firstName) errors.firstName = "First name is required"
  if (!data.lastName) errors.lastName = "Last name is required"
  if (!data.email) errors.email = "Email is required"
  if (!data.password) errors.password = "Password is required"
  return errors
}

// ── Shared question step ───────────────────────────────────────────────────────

function QuestionStep({
  step,
  question,
  answer,
  error,
  onAnswer,
  onBack,
  onNext,
  isLast = false,
  isSubmitting = false,
}: {
  step: Step
  question: string
  answer: string
  error: string | undefined
  onAnswer: (value: string) => void
  onBack: () => void
  onNext: () => void
  isLast?: boolean
  isSubmitting?: boolean
}) {
  return (
    <motion.div key={`step-${step}`} variants={stepVariants} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col gap-6">
      <AuthCardHeader title="In your own words" description="Help others understand how you can help." />
      <div className="grid gap-1.5">
        <Label className="text-lg my-2">{question}</Label>
        <Textarea
          rows={7}
          maxLength={MAX_ANSWER_LENGTH}
          value={answer}
          autoFocus
          onChange={(e) => onAnswer(e.target.value)}
          className={cn("resize-none shadow-none focus-visible:ring-2", error && "border-destructive")}
        />
        <div className="flex justify-between">
          {error ? <p className="text-xs text-destructive">{error}</p> : <span />}
          <span className="text-xs text-muted-foreground">{answer.length}/{MAX_ANSWER_LENGTH}</span>
        </div>
      </div>
      <div className="mt-auto flex flex-col gap-4">
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1 rounded-full font-semibold" onClick={onBack}>
            Back
          </Button>
          <Button type="button" className="flex-1 rounded-full font-semibold" disabled={isSubmitting} onClick={onNext}>
            {isLast
              ? isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving</> : "Create account"
              : "Continue"}
          </Button>
        </div>
        <StepIndicator step={step} />
      </div>
    </motion.div>
  )
}

// ── SignupForm ─────────────────────────────────────────────────────────────────

export function SignupForm({ className }: { className?: string }) {
  const [step, setStep] = useState<Step>(1)
  const [showPassword, setShowPassword] = useState(false)
  const [data, setData] = useState<SignupData>(EMPTY_DATA)
  const [errors, setErrors] = useState<SignupErrors>({})

  const [selectedSkills, setSelectedSkills] = useState<ComboboxItem[]>([])
  const [skillError, setSkillError] = useState<string | undefined>()

  const [answers, setAnswers] = useState(EMPTY_ANSWERS)
  const [answerErrors, setAnswerErrors] = useState<(string | undefined)[]>([undefined, undefined, undefined])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleFieldChange =
    (field: keyof SignupData) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setData((prev) => ({ ...prev, [field]: e.target.value }))

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors = validateStep1(data)
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    setErrors({})
    setStep(2)
  }

  const handleStep2Next = () => {
    if (selectedSkills.length === 0) { setSkillError("Add at least one skill to continue"); return }
    setSkillError(undefined)
    setStep(3)
  }

  const handleAnswerNext = (index: number, nextStep: Step) => {
    if (!answers[index].trim()) {
      const next = [...answerErrors]
      next[index] = "This field is required"
      setAnswerErrors(next)
      return
    }
    const next = [...answerErrors]
    next[index] = undefined
    setAnswerErrors(next)
    setStep(nextStep)
  }

  const handleSubmit = async () => {
    if (!answers[2].trim()) {
      setAnswerErrors((prev) => { const n = [...prev]; n[2] = "This field is required"; return n })
      return
    }
    setIsSubmitting(true)
    await new Promise((r) => setTimeout(r, 1800))
    setIsSubmitting(false)
    setIsSuccess(true)
  }

  const handleSkillSelect = useCallback(
    (item: ComboboxItem) => {
      if (selectedSkills.some((s) => s.label === item.label)) return
      setSelectedSkills((prev) => [...prev, item])
      setSkillError(undefined)
    },
    [selectedSkills],
  )

  const setAnswer = (index: number) => (value: string) => {
    const next = [...answers]
    next[index] = value
    setAnswers(next)
  }

  if (isSuccess) {
    return (
      <AuthCard className={className}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center text-center py-8 gap-6"
        >
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="font-serif text-3xl font-thin mb-2">You're in!</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Your account is ready. Welcome to The Trusted List.
            </p>
          </div>
          <Button asChild className="rounded-full font-semibold">
            <a href="/trusted-list/">Go to dashboard</a>
          </Button>
        </motion.div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      className={className}
      contentClassName="min-h-[400px]"
      onSubmit={step === 1 ? handleStep1Next : undefined}
    >
      <AnimatePresence mode="wait" initial={false}>

        {/* ── Step 1: Account details ───────────────────────────────────── */}
        {step === 1 && (
          <motion.div key="step-1" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col gap-6">
            <AuthCardHeader title="A network built on action, not noise." description="Providing the help you need when it matters most." />
            <div className="grid grid-cols-2 gap-3 mt-8">
              <div className="grid gap-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="First"
                  autoFocus
                  value={data.firstName}
                  onChange={handleFieldChange("firstName")}
                  className={cn("shadow-none focus-visible:ring-2", errors.firstName && "border-destructive")}
                />
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Last"
                  value={data.lastName}
                  onChange={handleFieldChange("lastName")}
                  className={cn("shadow-none focus-visible:ring-2", errors.lastName && "border-destructive")}
                />
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={data.email}
                  onChange={handleFieldChange("email")}
                  className={cn("shadow-none focus-visible:ring-2 pl-9", errors.email && "border-destructive")}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={data.password}
                  onChange={handleFieldChange("password")}
                  className={cn("shadow-none focus-visible:ring-2 pl-9 pr-10", errors.password && "border-destructive")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeClosed className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            <div className="mt-auto flex flex-col gap-4">
              <Button type="submit" className="w-full rounded-full font-semibold">
                Continue
              </Button>
              <StepIndicator step={1} />
              <div className="text-center text-sm mt-6">
                Already have an account?{" "}
                <a href="/trusted-list/login" className="underline underline-offset-4">
                  Sign in
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Skills ────────────────────────────────────────────── */}
        {step === 2 && (
          <motion.div key="step-2" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col gap-6">
            <AuthCardHeader title="Your skills" description="What do you bring to the table?" />
            <div className="grid gap-2">
              <SearchCombobox
                placeholder="Search skills…"
                onSelect={handleSkillSelect}
                searchFn={searchSkills}
                keepOpenOnSelect
                side="top"
              />
              {skillError && <p className="text-xs text-destructive">{skillError}</p>}
              {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedSkills.map((skill) => (
                    <span
                      key={skill.label}
                      className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium"
                    >
                      {skill.label}
                      <button
                        type="button"
                        onClick={() => setSelectedSkills((prev) => prev.filter((s) => s.label !== skill.label))}
                        className="ml-0.5 rounded-full hover:text-destructive transition-colors"
                        aria-label={`Remove ${skill.label}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-auto flex flex-col gap-4">
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1 rounded-full font-semibold" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="button" className="flex-1 rounded-full font-semibold" onClick={handleStep2Next}>
                  Continue
                </Button>
              </div>
              <StepIndicator step={2} />
            </div>
          </motion.div>
        )}

        {/* ── Steps 3–5: One question each ──────────────────────────────── */}
        {step === 3 && (
          <QuestionStep
            step={3}
            question={ABOUT_QUESTIONS[0]}
            answer={answers[0]}
            error={answerErrors[0]}
            onAnswer={setAnswer(0)}
            onBack={() => setStep(2)}
            onNext={() => handleAnswerNext(0, 4)}
          />
        )}
        {step === 4 && (
          <QuestionStep
            step={4}
            question={ABOUT_QUESTIONS[1]}
            answer={answers[1]}
            error={answerErrors[1]}
            onAnswer={setAnswer(1)}
            onBack={() => setStep(3)}
            onNext={() => handleAnswerNext(1, 5)}
          />
        )}
        {step === 5 && (
          <QuestionStep
            step={5}
            question={ABOUT_QUESTIONS[2]}
            answer={answers[2]}
            error={answerErrors[2]}
            onAnswer={setAnswer(2)}
            onBack={() => setStep(4)}
            onNext={handleSubmit}
            isLast
            isSubmitting={isSubmitting}
          />
        )}

      </AnimatePresence>
    </AuthCard>
  )
}
