import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { AutoClumpVectorField } from "@/components/landing/AutoClumpVectorField"

const base = import.meta.env.BASE_URL ?? "/"
const logoLight = `${base}logo-light.svg`
const logoDark = `${base}logo-dark.svg`

interface AuthCardProps {
  className?: string
  contentClassName?: string
  children: React.ReactNode
  onSubmit?: (e: React.FormEvent) => void
}

export function AuthCard({ className, contentClassName, children, onSubmit }: AuthCardProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card className="overflow-hidden shadow-md border-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:px-14 md:py-9" onSubmit={onSubmit} noValidate>
            <div className={cn("flex flex-col gap-12", contentClassName)}>
              {children}
            </div>
          </form>
          <div className="relative hidden overflow-hidden bg-muted md:block">
            <div className="absolute inset-x-0 top-1/2 h-[720px] -translate-y-1/2">
              <AutoClumpVectorField
                showControls={false}
                activateOnVisible
                quiet
              />
            </div>
            <div
              className="pointer-events-none absolute inset-0 z-10"
              style={{
                backgroundImage: [
                  "linear-gradient(to bottom, rgba(0,163,173,0.4) 0%, rgba(0,163,173,0) 12%)",
                  "linear-gradient(to top,    rgba(0,163,173,0.4) 0%, rgba(0,163,173,0) 12%)",
                  "linear-gradient(to right,  rgba(0,163,173,0.3) 0%, rgba(0,163,173,0) 8%)",
                  "linear-gradient(to left,   rgba(0,163,173,0.3) 0%, rgba(0,163,173,0) 8%)",
                ].join(", "),
              }}
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        By continuing, you agree to our <a href="#">Terms &amp; Conditions</a>{", "} <a href="#">Privacy Policy</a>{", "} <a href="#">Communication Guidelines</a>{" "} and <a href="#">Community Rules</a>.
      </div>
    </div>
  )
}

export function AuthCardHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-18">
      <div>
        <img src={logoLight} alt="The Trusted List" className="h-8 w-auto mt-4 dark:hidden" />
        <img src={logoDark} alt="The Trusted List" className="h-8 w-auto mt-4 hidden dark:block" />
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-4xl font-thin mb-1">{title}</h1>
        <p className="text-base text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
