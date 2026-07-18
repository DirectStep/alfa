import type { ReactNode } from "react";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1480px] px-5 sm:px-8 md:px-10 ${className}`}>
      {children}
    </div>
  );
}
