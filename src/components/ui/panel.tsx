import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "canopy" | "tide" | "sun" | "coral" | "berry" | "neutral";

/** Icon chip colours. Kept in one place so a tone means the same thing everywhere. */
export const TONE_CHIP: Record<Tone, string> = {
  canopy: "bg-canopy-soft text-canopy-deep",
  tide: "bg-tide-soft text-tide-deep",
  sun: "bg-sun-soft text-sun-deep",
  coral: "bg-coral-soft text-coral-deep",
  berry: "bg-berry-soft text-berry",
  neutral: "bg-surface-high text-ink-soft",
};

/**
 * Raised container.
 *
 * Deep corners and a green tinted shadow, so a card reads as a physical tile
 * the way the game's own panels do. A neutral shadow on a green page looks like
 * dirt; a tinted one looks like light.
 */
export function Panel({
  children,
  className = "",
  lift = true,
}: {
  children: ReactNode;
  className?: string;
  /** Turn off for panels holding their own hover behaviour, such as tables. */
  lift?: boolean;
}) {
  const resting =
    "shadow-[0_1px_2px_rgba(20,48,28,0.05),0_8px_22px_-12px_rgba(20,48,28,0.18)]";

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-line bg-surface ${
        lift ? "card-lift" : resting
      } ${className}`}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  detail,
  icon: Icon,
  tone = "neutral",
  action,
}: {
  title: string;
  detail?: string;
  icon?: LucideIcon;
  tone?: Tone;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${TONE_CHIP[tone]}`}
          >
            <Icon size={17} strokeWidth={2} />
          </span>
        ) : null}

        <div className="min-w-0">
          <h2 className="font-display text-[16px] font-semibold tracking-tight text-ink">
            {title}
          </h2>
          {detail ? <p className="mt-0.5 text-[13px] text-ink-soft">{detail}</p> : null}
        </div>
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

/**
 * Page title block, used once at the top of every route.
 *
 * Set in the display face at a size that would be shouting in an ordinary admin
 * tool. That is the point. This console sits behind a children's game, and a
 * timid heading made it feel like something else entirely.
 */
export function PageHeading({
  title,
  detail,
  eyebrow,
  action,
}: {
  title: string;
  detail: string;
  eyebrow?: string;
  action?: ReactNode;
}) {
  return (
    <div className="reveal-item flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 inline-flex items-center rounded-full bg-canopy-soft px-3 py-1 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-canopy-deep">
            {eyebrow}
          </p>
        ) : null}

        <h1 className="font-display text-[26px] font-semibold leading-tight tracking-tight text-ink sm:text-[32px]">
          {title}
        </h1>

        {/* Capped by character count rather than a fixed width, so the line
            length stays readable at any container size. */}
        <p className="mt-2 max-w-[68ch] text-[14px] leading-relaxed text-ink-soft">{detail}</p>
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Pill used for counts, statuses and inline labels. */
export function Chip({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ${TONE_CHIP[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
