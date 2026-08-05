"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { assetPath } from "@/lib/assetPath";

type Review = {
  quote: string;
  name: string;
  role: string;
  avatar: string;
};

// Заглушки — заменить на реальные отзывы.
const reviews: Review[] = [
  {
    quote:
      "Пришел с идеей, но совсем не понимал, с чего начать. AI-навигатор разложил все по шагам: что делать сегодня, а что можно спокойно отложить. За три месяца дошел от наброска в заметках до первых продаж. Самое ценное — что не нужно держать весь план в голове.",
    name: "Илья П.",
    role: "Свое дело, 21 год",
    avatar: assetPath("/assets/community/feed-01.png"),
  },
  {
    quote:
      "Самое ценное здесь — сообщество. За первую неделю нашла двух партнеров и человека, который помог разобраться с документами. Одной это заняло бы месяцы, а тут просто спрашиваешь — и отвечают те, кто уже прошел через то же самое.",
    name: "Анна К.",
    role: "Дизайн-студия, 23 года",
    avatar: assetPath("/assets/community/feed-02.png"),
  },
  {
    quote:
      "Вообще не понимал, как принимать оплату и с чего начинать с банком. Подключил СБП и платежную ссылку буквально за пару минут — без походов в отделение, звонков и лишних бумаг. Первые деньги от клиента пришли в тот же день.",
    name: "Максим Т.",
    role: "Кофейня, 24 года",
    avatar: assetPath("/assets/community/feed-03.png"),
  },
  {
    quote:
      "Мини-курсы короткие и без воды — как раз то, что нужно, когда учишься и работаешь одновременно. Смотрела по дороге в универ, а на выходных уже применяла на своем проекте. Через месяц запустила первую линейку и вышла на окупаемость.",
    name: "Дарья С.",
    role: "Студентка, 19 лет",
    avatar: assetPath("/assets/community/feed-04.png"),
  },
  {
    quote:
      "Шаблоны документов сэкономили кучу времени и нервов: не пришлось искать по форумам и гадать, все ли сделал правильно. Здесь собрано в одном месте и знание, и люди, и инструменты банка. Для старта это закрывает почти все вопросы.",
    name: "Егор В.",
    role: "Онлайн-школа, 22 года",
    avatar: assetPath("/assets/community/feed-05.png"),
  },
];

export function ReviewsSection() {
  const trackRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  const scrollByCard = (direction: number) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector("li");
    const step = card ? card.getBoundingClientRect().width + 16 : 380;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  return (
    <section id="reviews" className="pt-[88px] laptop:pt-[104px]">
      <Container>
        <div className="flex items-center justify-between gap-6">
          <h2 className="text-[34px] font-bold leading-[1.03] tracking-tight laptop:text-[52px]">
            Отзывы
          </h2>

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              aria-label="Предыдущие отзывы"
              onClick={() => scrollByCard(-1)}
              disabled={atStart}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface text-text-primary transition-colors hover:bg-border disabled:opacity-35"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              aria-label="Следующие отзывы"
              onClick={() => scrollByCard(1)}
              disabled={atEnd}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface text-text-primary transition-colors hover:bg-border disabled:opacity-35"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <ul
          ref={trackRef}
          onScroll={update}
          className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {reviews.map((review) => (
            <li
              key={review.name}
              className="w-[300px] shrink-0 snap-start sm:w-[364px]"
            >
              <article className="flex h-[360px] flex-col justify-between rounded-[20px] bg-alfa-red p-6">
                <p className="text-[18px] font-medium leading-[110%] tracking-[-0.54px] text-white">
                  {review.quote}
                </p>

                <div className="flex items-center gap-3">
                  <Image
                    src={review.avatar}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 rounded-full object-cover object-top"
                  />
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold leading-tight text-white">
                      {review.name}
                    </p>
                    <p className="mt-0.5 text-[13px] leading-tight text-white/70">
                      {review.role}
                    </p>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
