import type { SegmentOption } from "@/types";

const activeClasses = {
  dark: "bg-black text-white",
  "outline-red": "bg-white border border-alfa-red text-alfa-red",
} as const;

export function SegmentedControl({
  options,
  activeId,
  onSelect,
  variant,
  "aria-label": ariaLabel,
}: {
  options: SegmentOption[];
  activeId: string;
  onSelect: (id: string) => void;
  variant: keyof typeof activeClasses;
  "aria-label": string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex flex-wrap gap-2 rounded-[20px] bg-surface p-1.5 laptop:rounded-full"
    >
      {options.map((option) => {
        const isActive = option.id === activeId;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(option.id)}
            className={`rounded-full px-4 py-2.5 text-[14px] font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alfa-red ${
              isActive
                ? activeClasses[variant]
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
