import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { RoundArrowButton } from "@/components/ui/RoundArrowButton";
import { benefitCards } from "@/data/benefits";

const variantClasses = {
  red: "bg-alfa-red text-white",
  lavender: "bg-lavender text-text-primary",
  "light-green": "bg-light-green text-text-primary",
} as const;

export function BenefitCards() {
  return (
    <section className="pt-12 pb-0 laptop:pt-16">
      <Container>
        <h2 className="text-[32px] font-bold laptop:text-[44px]">
          Что вы получите
        </h2>

        <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 laptop:grid-cols-3">
          {benefitCards.map((card) => (
            <li
              key={card.id}
              className={`group relative flex min-h-[440px] flex-col justify-between overflow-hidden rounded-[28px] p-6 transition-transform duration-300 hover:-translate-y-1 laptop:min-h-[460px] ${variantClasses[card.variant]}`}
            >
              <div className="relative z-10">
                <h3 className="text-[28px] font-bold">{card.title}</h3>
                <p className="mt-2 max-w-[85%] text-[16px] leading-snug opacity-80">
                  {card.description}
                </p>
              </div>

              <div className="absolute inset-x-0 bottom-0 h-[80%]">
                <Image
                  src={card.image}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-contain object-bottom p-2 transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <RoundArrowButton
                size={48}
                className="relative z-10 self-start bg-white text-black"
              />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
