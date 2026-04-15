"use client"

import * as React from "react"
import { toast } from "@/features/admin/lib/toast"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ProductSettingsCard() {
  const [productName, setProductName] = React.useState("Pro Membership")
  const [price, setPrice] = React.useState("29.00")
  const [duration, setDuration] = React.useState("monthly")
  const [taxEnabled, setTaxEnabled] = React.useState(false)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const durationLabel: Record<string, string> = {
      biweekly: "Bi-Weekly", monthly: "Monthly", quarterly: "Quarterly",
      biannual: "Bi-Annual", annual: "Annual",
    }
    toast.success("Product settings saved", {
      description: `${productName} · $${price} · ${durationLabel[duration] ?? duration}`,
    })
  }

  return (
    <Card className="rounded-xl border border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">Subscription Product Settings</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Configure the default subscription product offered to members.
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Product Name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-name" className="text-xs font-medium text-muted-foreground">
                Product Name
              </Label>
              <Input
                id="product-name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Pro Membership"
                className="h-9 rounded-full text-sm"
              />
            </div>

            {/* Price */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-price" className="text-xs font-medium text-muted-foreground">
                Price (USD)
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">
                  $
                </span>
                <Input
                  id="product-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="h-9 rounded-full pl-6 text-sm tabular-nums"
                />
              </div>
            </div>

            {/* Duration */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-duration" className="text-xs font-medium text-muted-foreground">
                Duration
              </Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id="product-duration" className="h-9 rounded-full text-sm">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="biannual">Bi-Annual</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tax toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Global Tax Handling</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Automatically calculate and apply tax to all subscriptions.
              </p>
            </div>
            <Switch
              id="tax-handling"
              checked={taxEnabled}
              onCheckedChange={(checked) => {
                setTaxEnabled(checked)
                toast.info(
                  checked ? "Tax handling enabled" : "Tax handling disabled",
                  { description: checked ? "Tax will be calculated at checkout." : "Tax will not be applied." }
                )
              }}
              aria-label="Toggle global tax handling"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="sm" className="rounded-full font-semibold px-5">
              Save Settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
