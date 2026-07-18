import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { HeroArtwork } from "./HeroArtwork";

export function HeroSection() {
  return (
    <section id="top" className="pt-8">
      <Container>
        <div className="grid overflow-hidden rounded-[28px] bg-[#f2f3f5] laptop:min-h-[570px] laptop:grid-cols-[1.04fr_0.96fr] laptop:rounded-[32px]">
          <div className="flex flex-col justify-center px-6 py-10 sm:px-9 laptop:px-12 laptop:py-14">
            <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-alfa-red">Альфа-Дело</p>
            <h1 className="mt-4 max-w-[680px] text-[38px] font-bold leading-[1.06] tracking-[-0.025em] md:text-[44px] laptop:text-[48px] laptop:leading-[1.08]">
              От идеи до первой оплаты — с понятным планом
            </h1>
            <p className="mt-5 max-w-[570px] text-[16px] leading-6 text-text-secondary">
              Концепция сервиса связывает стадию проекта, персональный маршрут и финансовые действия в приложении Альфа-Банка.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button variant="primary" href="#scenario" className="sm:px-7">Собрать пример маршрута</Button>
              <Button variant="secondary" href="#how-it-works">Посмотреть, как работает</Button>
            </div>
            <div className="mt-10 grid max-w-[560px] grid-cols-1 gap-3 border-t border-black/10 pt-5 min-[420px]:grid-cols-3 min-[420px]:gap-4">
              {[["01", "Определить задачу"], ["02", "Получить маршрут"], ["03", "Перейти к действию"]].map(([number, label]) => (
                <div key={number}>
                  <p className="text-[12px] font-bold text-alfa-red">{number}</p>
                  <p className="mt-1 text-[12px] leading-4 text-text-secondary sm:text-[13px]">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <HeroArtwork />
        </div>
      </Container>
    </section>
  );
}
