import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthCard, AuthCardHeader } from "@/components/auth-card"

export function ForgotPasswordForm({ className }: { className?: string }) {
  return (
    <AuthCard className={className}>
      <AuthCardHeader title="Reset your password" description="Enter your email and we'll send a reset link." />
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="email"
            type="email"
            placeholder="Enter email address"
            autoFocus
            required
            className="shadow-none focus-visible:ring-2 pl-9"
          />
        </div>
      </div>
      <Button type="submit" className="w-full rounded-full font-semibold">
        Reset password
      </Button>
      <div className="text-center text-sm">
        Remembered your password?{" "}
        <a href="/trusted-list/login" className="underline underline-offset-4">
          Sign in
        </a>
      </div>
    </AuthCard>
  )
}
