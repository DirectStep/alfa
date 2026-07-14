import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { HeroArtwork } from "./HeroArtwork";

export function HeroSection() {
  return (
    <section id="top" className="pt-10 pb-16 laptop:pt-14 laptop:pb-24">
      <Container className="flex flex-col gap-12 laptop:flex-row laptop:items-center laptop:gap-8">
        <div className="laptop:w-[48%]">
          <h1 className="text-[44px] font-black leading-[0.98] tracking-tight laptop:text-[84px]">
            Сообщество
            <br />
            для тех,
            <br />
            кто делает
            <br />
            свое дело
          </h1>

          <p className="mt-6 max-w-md text-[17px] leading-relaxed text-text-secondary">
            Платформа для молодых предпринимателей 17-25 лет: сообщество,
            знания, AI-помощник и инструменты Альфа-Банка в одном месте.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button variant="primary">Начать путь</Button>
            <Button variant="secondary">Смотреть возможности</Button>
          </div>
        </div>

        <div className="laptop:w-[52%]">
          <HeroArtwork />
        </div>
      </Container>
    </section>
  );
}
