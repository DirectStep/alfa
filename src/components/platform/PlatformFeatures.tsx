import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { assetPath } from "@/lib/assetPath";

type PlatformCard = {
  title: string;
  subtitle: string;
  img: string;
  bg: string;
  text: string;
  imgClass: string;
};

const cards: PlatformCard[] = [
  {
    title: "Сообщество",
    subtitle: "Люди, идеи, поддержка",
    img: assetPath("/assets/platform/community.png"),
    bg: "bg-alfa-red",
    text: "text-white",
    imgClass: "bottom-0 left-1/2 h-[58%] -translate-x-1/2",
  },
  {
    title: "База знаний",
    subtitle: "Статьи, шаблоны, инструкции",
    img: assetPath("/assets/platform/knowledge.png"),
    bg: "bg-lavender",
    text: "text-text-primary",
    imgClass: "bottom-1 right-3 h-[56%]",
  },
  {
    title: "Мини-курсы",
    subtitle: "Короткие уроки для роста",
    img: assetPath("/assets/platform/courses.png"),
    bg: "bg-surface",
    text: "text-text-primary",
    imgClass: "bottom-2 right-3 h-[54%]",
  },
  {
    title: "Нетворкинг",
    subtitle: "Контакты и партнеры",
    img: assetPath("/assets/platform/networking.png"),
    bg: "bg-black",
    text: "text-white",
    imgClass: "bottom-0 left-1/2 h-[60%] -translate-x-1/2",
  },
  {
    title: "Возможности",
    subtitle: "Подбор под вашу задачу",
    img: assetPath("/assets/platform/opportunities.png"),
    bg: "bg-pink",
    text: "text-text-primary",
    imgClass: "bottom-3 right-4 h-[50%]",
  },
  {
    title: "Профиль",
    subtitle: "Ваши данные и достижения",
    img: assetPath("/assets/platform/profile.png"),
    bg: "bg-light-green",
    text: "text-text-primary",
    imgClass: "bottom-2 right-3 h-[54%]",
  },
];

export function PlatformFeatures() {
  return (
    <section id="platform" className="pt-[88px] laptop:pt-[104px]">
      <Container>
        <SectionHeading label="В приложении" title="Что внутри платформы" />

        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 laptop:grid-cols-3 laptop:gap-5">
          {cards.map((card) => (
            <li
              key={card.title}
              className={`group relative h-[290px] overflow-hidden rounded-[28px] p-7 transition-transform duration-300 hover:-translate-y-[3px] laptop:h-[300px] ${card.bg} ${card.text}`}
            >
              <p className="text-[24px] font-bold leading-tight">{card.title}</p>
              <p className="mt-1.5 text-[15px] opacity-70">{card.subtitle}</p>

              <Image
                src={card.img}
                alt=""
                width={640}
                height={480}
                sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 90vw"
                className={`pointer-events-none absolute w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03] ${card.imgClass}`}
              />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
