"use client";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import type { TrustScoreDimension } from "../types";

interface TrustScoreRadarChartProps {
  data: TrustScoreDimension[];
}

const chartConfig = {
  value: {
    label: "Score",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig;

export function TrustScoreRadarChart({ data }: TrustScoreRadarChartProps) {
  return (
    <section className="flex w-full flex-col gap-3.5">
      <div className="flex items-center gap-2">
        <span className="text-sm uppercase text-muted-foreground">
          What shapes your trust score
        </span>
        <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0 h-4 rounded-full -translate-y-[0.5px]">
          Private
        </Badge>
      </div>
      <ChartContainer
        config={chartConfig}
        className="mx-auto w-full max-w-82 aspect-square"
      >
        <RadarChart data={data} margin={{ top: 20, right: 40, bottom: 0, left: 40 }}>
          <PolarGrid
            gridType="polygon"
            stroke="var(--border)"
            strokeOpacity={0.6}
          />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{
              fill: "var(--muted-foreground)",
              fontSize: 10,
              fontFamily: "var(--font-sans)",
            }}
          />
          <Radar
            dataKey="value"
            fill="var(--color-primary)"
            fillOpacity={0.15}
            stroke="var(--color-primary)"
            strokeWidth={1.5}
            dot={false}
          />
        </RadarChart>
      </ChartContainer>
    </section>
  );
}
