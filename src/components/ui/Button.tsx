import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "dark" | "light";
type Size = "sm" | "md";

type BaseProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
};

type ButtonAsButton = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

const variantClasses: Record<Variant, string> = {
  primary: "bg-alfa-red text-white hover:bg-alfa-red-bright active:bg-alfa-red",
  secondary:
    "bg-transparent text-text-primary border border-border hover:border-text-primary",
  dark: "bg-black text-white hover:bg-black/85",
  light: "bg-white text-text-primary hover:bg-white/90",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-10 px-5 text-[14px]",
  md: "h-12 px-6 text-[14px]",
};

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "primary", size = "md", className = "" } = props;
  const classes = `inline-flex items-center justify-center rounded-full font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alfa-red ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  if (props.href !== undefined) {
    const { variant: _v, size: _s, className: _c, ...rest } = props;
    void _v;
    void _s;
    void _c;
    return <Link className={classes} {...rest} />;
  }

  const { variant: _v, size: _s, className: _c, href: _h, ...rest } = props;
  void _v;
  void _s;
  void _c;
  void _h;
  return <button type="button" className={classes} {...rest} />;
}
