import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { HeroArtwork } from "./HeroArtwork";
import { HeroFeatureCards } from "./HeroFeatureCards";

export function HeroSection() {
  return (
    <section id="top" className="pt-8 pb-0 laptop:pt-12">
      <Container className="flex flex-col gap-8 laptop:flex-row laptop:items-stretch laptop:gap-6">
        <div className="flex flex-col justify-center laptop:w-[47%]">
          <h1 className="text-[44px] font-black leading-[0.98] tracking-tight laptop:text-[76px]">
            Сообщество
            <br />
            для тех,
            <br />
            кто делает
            <br />
            свое дело
          </h1>

          <p className="mt-6 max-w-[480px] text-[17px] leading-[1.45] text-text-secondary">
            Платформа для молодых предпринимателей 17-25 лет: сообщество,
            знания, AI-помощник и инструменты Альфа-Банка в одном месте.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button variant="primary" className="sm:px-9">
              Начать путь
            </Button>
            <Button variant="secondary">Смотреть возможности</Button>
          </div>
        </div>

        <div className="laptop:flex-1">
          <HeroArtwork />
        </div>

        <div className="laptop:w-[224px] laptop:shrink-0">
          <HeroFeatureCards />
        </div>
      </Container>
    </section>
  );
}
