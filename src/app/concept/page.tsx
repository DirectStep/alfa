import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { AlfaLogo } from "@/components/ui/AlfaLogo";
import { HeroArtwork } from "@/components/hero/HeroArtwork";

export const metadata: Metadata = {
  title: "Концепция — Альфа-Дело",
  description:
    "Концепция приложения для молодых предпринимателей от команды VOLT для чемпионата Альфа-Будущее.",
};

export default function ConceptPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <Container className="flex h-[74px] items-center">
        <Link href="/" className="flex items-center gap-3">
          <AlfaLogo className="text-alfa-red" height={30} />
          <span className="text-[19px] font-bold tracking-tight">
            Альфа-Дело
          </span>
        </Link>
      </Container>

      <Container className="flex flex-1 flex-col items-center justify-center gap-10 py-16 laptop:flex-row laptop:justify-between laptop:py-24">
        <div className="max-w-[560px] text-center laptop:text-left">
          <p className="text-[13px] font-bold uppercase tracking-[0.04em] text-alfa-red">
            Концепция продукта
          </p>
          <h1 className="mt-4 text-[44px] font-bold leading-[1.02] tracking-tight laptop:text-[68px]">
            Альфа-Дело
          </h1>
          <p className="mt-6 text-[18px] leading-[1.5] text-text-secondary">
            Концепция приложения для молодых предпринимателей, разработанная
            командой VOLT в рамках чемпионата Альфа-Будущее.
          </p>
          <p className="mt-4 text-[15px] leading-[1.5] text-text-secondary">
            Лендинг демонстрирует идею продукта. Основные функции предполагается
            реализовать в отдельном приложении, а финансовые действия — в
            приложении Альфа-Банка.
          </p>

          <div className="mt-9 flex justify-center laptop:justify-start">
            <Link
              href="/"
              className="inline-flex h-14 items-center justify-center rounded-full bg-alfa-red px-7 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-alfa-red-bright"
            >
              Вернуться на главную
            </Link>
          </div>
        </div>

        <div className="h-[360px] w-full laptop:h-[440px] laptop:w-[480px] laptop:shrink-0">
          <HeroArtwork />
        </div>
      </Container>
    </main>
  );
}
