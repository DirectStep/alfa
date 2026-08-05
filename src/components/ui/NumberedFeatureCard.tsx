import Image from "next/image";

type NumberedFeatureCardProps = {
  number: string;
  numberImage?: string;
  title: string;
  text: string;
  tone: string;
  className?: string;
  prominentNumber?: boolean;
};

export function NumberedFeatureCard({
  number,
  numberImage,
  title,
  text,
  tone,
  className = "",
  prominentNumber = false,
}: NumberedFeatureCardProps) {
  return (
    <li className={`${tone} grid grid-cols-[auto_minmax(0,1fr)] gap-5 rounded-[26px] p-6 sm:p-7 ${className}`}>
      {numberImage ? (
        <Image
          src={numberImage}
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 shrink-0 object-contain"
          aria-hidden="true"
        />
      ) : (
        <span className={prominentNumber
          ? "min-w-10 text-[56px] font-black leading-[0.78] tracking-[-0.06em] text-future-green sm:min-w-12 sm:text-[64px]"
          : "text-[13px] font-bold opacity-60"}
        >
          {number}
        </span>
      )}
      <div className="min-w-0">
        <h3 className="text-[24px] font-bold leading-none tracking-[-0.025em]">{title}</h3>
        <p className="mt-3 max-w-[560px] text-[15px] leading-5 opacity-70">{text}</p>
      </div>
    </li>
  );
}
