import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "dark";
};

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-alfa-red text-white hover:bg-alfa-red-bright active:bg-alfa-red",
  secondary:
    "bg-transparent text-text-primary border border-border hover:border-text-primary",
  dark: "bg-black text-white hover:bg-black/85",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex h-[52px] items-center justify-center rounded-full px-7 text-[15px] font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alfa-red ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
