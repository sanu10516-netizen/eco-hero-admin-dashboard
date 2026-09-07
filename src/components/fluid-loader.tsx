"use client";

/**
 * Quiet activity indicator. A wave travels inside a circle, the way water
 * settles through a filter bed. It does not spin, because a spinner reads as
 * "something is stuck" once it runs for more than a second or two.
 */
export function FluidLoader({
  size = 44,
  label,
}: {
  size?: number;
  label?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        role="img"
        aria-label={label ?? "Working"}
      >
        <defs>
          <clipPath id="fluid-bowl">
            <circle cx="50" cy="50" r="38" />
          </clipPath>
        </defs>

        {/* Vessel */}
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          stroke="rgba(20,48,28,0.14)"
          strokeWidth="1.5"
        />

        <g clipPath="url(#fluid-bowl)">
          {/* Two waves at different speeds so the surface never looks like a
              single rigid shape sliding past. */}
          <path
            d="M-100 56 q 25 -9 50 0 t 50 0 t 50 0 t 50 0 t 50 0 v 60 h -300 z"
            fill="rgba(28,156,224,0.42)"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              from="0 0"
              to="100 0"
              dur="4.2s"
              repeatCount="indefinite"
            />
          </path>

          <path
            d="M-100 62 q 25 -7 50 0 t 50 0 t 50 0 t 50 0 t 50 0 v 60 h -300 z"
            fill="rgba(47,168,79,0.68)"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              from="0 0"
              to="100 0"
              dur="2.8s"
              repeatCount="indefinite"
            />
          </path>
        </g>
      </svg>

      {label ? (
        <p className="font-display text-[14px] font-medium text-ink-soft">{label}</p>
      ) : null}
    </div>
  );
}
