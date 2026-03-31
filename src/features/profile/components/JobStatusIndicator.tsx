import type { JobStatus } from "../types";

export const JOB_STATUS_CONFIG = {
  open_to_right_role: {
    dot: "bg-blue-500",
    halo: "bg-blue-400/30",
    bg: "bg-blue-100/50",
    shadow: "shadow-[0_0_8px_rgba(59,130,246,0.3)]",
    label: "Open to talking",
  },
  actively_looking: {
    dot: "bg-green-500",
    halo: "bg-green-400/30",
    bg: "bg-green-100/50",
    shadow: "shadow-[0_0_8px_rgba(34,197,94,0.3)]",
    label: "Actively looking for a new role",
  },
} satisfies Record<NonNullable<JobStatus>, { dot: string; halo: string; bg: string; shadow: string; label: string }>;

export function JobStatusDot({ status }: { status: NonNullable<JobStatus> }) {
  const { dot, halo, bg, shadow } = JOB_STATUS_CONFIG[status];
  return (
    <div className={`inline-flex shrink-0 items-center justify-center h-4 w-4 rounded-full ${halo} ring-1 ring-white/10 shadow-sm`}>
      <div className={`h-2 w-2 shrink-0 rounded-full ${dot} ${shadow}`} />
    </div>
  );
}

interface JobStatusIndicatorProps {
  status: JobStatus;
}

export function JobStatusIndicator({ status }: JobStatusIndicatorProps) {
  if (!status) return null;

  const { dot, halo, bg, shadow, label } = JOB_STATUS_CONFIG[status];

  return (
    <div className={`inline-flex w-fit items-center gap-2 whitespace-nowrap rounded-lg border border-border px-2 py-1 text-base font-medium text-muted-foreground ${bg} backdrop-blur-md shadow-md`}>
      <div className={`flex items-center justify-center h-4 w-4 rounded-full ${halo} ring-1 ring-white/10`}>
        <div className={`h-2 w-2 shrink-0 rounded-full ${dot} ${shadow}`} />
      </div>
      {label}
    </div>
  );
}
