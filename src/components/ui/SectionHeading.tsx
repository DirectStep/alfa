type SectionHeadingProps = {
  label?: string;
  title: string;
  subtitle?: string;
  className?: string;
};

export function SectionHeading({
  label,
  title,
  subtitle,
  className = "",
}: SectionHeadingProps) {
  return (
    <div className={className}>
      {label && (
        <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-alfa-red">
          {label}
        </p>
      )}
      <h2 className="mt-3 max-w-[780px] text-[30px] font-bold leading-[1.12] tracking-[-0.02em] text-text-primary md:text-[36px] laptop:text-[40px] laptop:leading-[1.2]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 max-w-[620px] text-[15px] leading-6 text-text-secondary laptop:text-[16px]">
          {subtitle}
        </p>
      )}
    </div>
  );
}
