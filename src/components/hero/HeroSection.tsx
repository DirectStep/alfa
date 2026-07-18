import { ArrowDownRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { HeroArtwork } from "./HeroArtwork";

const tickerItems = [
  "Идея → запуск",
  "Знания → действие",
  "Сообщество → связи",
  "Первая оплата → рост",
];

const tickerSequence = [...tickerItems, ...tickerItems];

export function HeroSection() {
  return (
    <section id="top" className="bg-alfa-red text-white">
      <Container>
        <div className="relative grid min-h-[680px] overflow-hidden laptop:grid-cols-[0.92fr_1.08fr] laptop:items-stretch">
          <div className="relative z-10 flex flex-col justify-center py-12 laptop:py-16">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-bold uppercase tracking-[0.08em]">
              <span>Альфа-Дело</span>
              <span className="text-white/60">Концепт команды VOLT</span>
            </div>
            <h1 className="mt-5 max-w-[760px] text-[54px] font-bold leading-[0.92] tracking-[-0.055em] text-balance sm:text-[66px] laptop:text-[88px]">
              Твоё дело начинается здесь
            </h1>
            <p className="mt-7 max-w-[560px] text-[17px] leading-6 text-white/80 laptop:text-[19px] laptop:leading-7">
              Выбери задачу, получи понятный маршрут и переходи от идеи к первым продажам вместе с Альфой.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#scenario" className="inline-flex h-13 items-center justify-center rounded-[14px] bg-future-green px-6 text-[14px] font-bold text-black transition-transform hover:-translate-y-0.5">Собрать свой маршрут</a>
              <a href="#how-it-works" className="inline-flex h-13 items-center justify-center gap-2 rounded-[14px] border border-white/50 px-6 text-[14px] font-bold text-white transition-colors hover:bg-white hover:text-black">Как это работает <ArrowDownRight size={18} /></a>
            </div>
          </div>
          <HeroArtwork />
        </div>
      </Container>

      <div className="overflow-hidden border-t border-black/10 bg-future-green py-3 text-black">
        <div className="animate-hero-ticker flex min-w-max text-[16px] font-bold uppercase tracking-[-0.02em] sm:text-[18px]">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center gap-8 pr-8" aria-hidden={copy === 1}>
              {tickerSequence.map((item, index) => (
                <span key={`${item}-${index}`} className="flex items-center gap-8"><span>{item}</span><span aria-hidden>✦</span></span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
