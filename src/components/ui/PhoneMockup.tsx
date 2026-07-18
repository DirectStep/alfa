import type { ReactNode } from "react";

type PhoneMockupProps = {
  headerClass: string;
  className?: string;
  /** Кастомный контент экрана — если не передан, рендерится стандартный список. */
  children?: ReactNode;
};

/** Сверстанный кодом мокап мобилки — заглушка под реальные скрины приложения. */
export function PhoneMockup({ headerClass, className = "", children }: PhoneMockupProps) {
  return (
    <div
      className={`relative aspect-[9/19] rounded-[26px] bg-black p-1.5 shadow-2xl ${className}`}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[20px] bg-white">
        <div className="absolute left-1/2 top-1.5 z-10 h-3.5 w-14 -translate-x-1/2 rounded-full bg-black/80" />

        <div className={`px-3 pb-3 pt-8 ${headerClass}`}>
          <div className="h-2.5 w-16 rounded-full bg-white/75" />
          <div className="mt-2 h-2 w-24 rounded-full bg-white/45" />
        </div>

        {children ?? (
          <div className="space-y-2 p-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-xl bg-surface p-2"
              >
                <div className="h-7 w-7 shrink-0 rounded-full bg-border" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2 w-3/4 rounded-full bg-border" />
                  <div className="h-2 w-1/2 rounded-full bg-border/70" />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 flex h-8 items-center justify-around border-t border-border bg-white">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full ${i === 0 ? "bg-alfa-red" : "bg-border"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
