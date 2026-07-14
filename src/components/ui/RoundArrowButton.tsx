import { ArrowUpRight } from "lucide-react";

export function RoundArrowButton({
  className = "",
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={{ width: size, height: size }}
    >
      <ArrowUpRight size={Math.round(size * 0.45)} />
    </span>
  );
}
