"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { CountUp } from "@/components/count-up";
import { TONE_CHIP } from "@/components/ui/panel";

type Tone = "canopy" | "tide" | "sun" | "coral" | "berry" | "neutral";

const TONE_EDGE: Record<Tone, string> = {
  canopy: "bg-canopy",
  tide: "bg-tide",
  sun: "bg-sun",
  coral: "bg-coral",
  berry: "bg-berry",
  neutral: "bg-line-strong",
};

export function MetricCard({
  label,
  value,
  format,
  detail,
  icon: Icon,
  tone = "canopy",
  footer,
}: {
  label: string;
  value: number;
  format?: (input: number) => string;
  detail?: string;
  icon: LucideIcon;
  tone?: Tone;
  footer?: ReactNode;
}) {
  return (
    <div className="reveal-item card-lift group relative overflow-hidden rounded-2xl border border-line bg-surface p-5">
      <span aria-hidden className={`absolute inset-x-0 top-0 h-1 ${TONE_EDGE[tone]}`} />

      <div className="flex items-start justify-between gap-3">
        <p className="text-[12.5px] font-medium tracking-wide text-ink-soft">{label}</p>

        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-500 ease-[cubic-bezier(0.34,1.4,0.5,1)] group-hover:scale-110 ${TONE_CHIP[tone]}`}
        >
          <Icon size={17} strokeWidth={2} />
        </span>
      </div>

      <p className="mt-3 font-display text-[34px] font-semibold leading-none tracking-tight text-ink">
        <CountUp value={value} format={format} />
      </p>

      {detail ? <p className="mt-2.5 text-[12.5px] text-ink-faint">{detail}</p> : null}

      {footer ? <div className="mt-3">{footer}</div> : null}
    </div>
  );
}

export function MetricGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
  );
}
