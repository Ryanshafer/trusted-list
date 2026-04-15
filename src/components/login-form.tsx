"use client"
import { useState } from "react"
import { Eye, EyeClosed, Lock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthCard, AuthCardHeader } from "@/components/auth-card"

export function LoginForm({ className }: { className?: string }) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <AuthCard className={className}>
      <AuthCardHeader title="Welcome back" description="Continue helping our network, together." />
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
            autoFocus
            required
            className="shadow-none focus-visible:ring-2 pl-9"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            className="shadow-none focus-visible:ring-2 pl-9 pr-10"
            required
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
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <Checkbox id="remember-me" />
            <Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer">
              Remember me
            </Label>
          </div>
          <a
            href="/trusted-list/forgot-password"
            className="ml-auto text-sm underline-offset-2 hover:underline"
          >
            Forgot password?
          </a>
        </div>
      </div>
      <Button type="submit" className="w-full rounded-full font-semibold">
        Sign in
      </Button>
      <div className="text-center text-sm mb-4">
        Don&apos;t have an account?{" "}
        <a href="/trusted-list/signup" className="underline underline-offset-4">
          Sign up
        </a>
      </div>
    </AuthCard>
  )
}
