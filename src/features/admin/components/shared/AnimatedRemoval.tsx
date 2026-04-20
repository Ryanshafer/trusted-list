import * as React from "react"

export function AnimatedRemoval({
  isExiting,
  children,
}: {
  isExiting: boolean
  children: React.ReactNode
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [height, setHeight] = React.useState<number | undefined>()

  React.useEffect(() => {
    if (!isExiting || !ref.current) return
    const nextHeight = ref.current.scrollHeight
    setHeight(nextHeight)
    requestAnimationFrame(() => requestAnimationFrame(() => setHeight(0)))
  }, [isExiting])

  return (
    <div
      ref={ref}
      style={height !== undefined ? { height, overflow: "hidden" } : undefined}
      className={`transition-all duration-300 ${
        isExiting ? "pointer-events-none -translate-y-2 scale-95 opacity-0" : "scale-100 opacity-100"
      }`}
    >
      {children}
    </div>
  )
}
