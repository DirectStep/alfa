import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { assetPath } from "@/lib/assetPath";

const steps = [
  { number: "01", title: "Понимает контекст", text: "Учитывает стадию, цель и ограничения проекта.", tone: "bg-future-purple text-white" },
  { number: "02", title: "Собирает маршрут", text: "Выбирает практику, материалы и нужные сервисы.", tone: "bg-future-green text-black" },
  { number: "03", title: "Доводит до действия", text: "Фиксирует результат и открывает следующий шаг.", tone: "bg-future-blue text-white" },
];

export function AiNavigatorSection() {
  return (
    <section id="ai" className="bg-black py-16 text-white laptop:py-24">
      <Container>
        <div className="grid gap-8 laptop:grid-cols-[0.9fr_1.1fr] laptop:items-end">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-future-green">AI-навигация</p>
            <h2 className="mt-4 max-w-[740px] text-[40px] font-bold leading-[0.95] tracking-[-0.045em] sm:text-[56px] laptop:text-[72px]">
              Не советчик.<br />Соавтор запуска.
            </h2>
          </div>
          <p className="max-w-[600px] text-[18px] leading-7 text-white/70 laptop:justify-self-end laptop:text-[20px]">
            Сервис не выдаёт общий список рекомендаций. Он собирает рабочий маршрут вокруг конкретной задачи и объясняет, зачем нужен каждый шаг.
          </p>
        </div>

        <div className="mt-10 grid gap-4 laptop:grid-cols-[1.25fr_0.75fr]">
          <article className="relative min-h-[470px] overflow-hidden rounded-[28px] bg-future-purple p-7 sm:p-9 laptop:rounded-[36px] laptop:p-11">
            <div className="relative z-10 max-w-[490px]">
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-white/65">Пример рекомендации</p>
              <h3 className="mt-4 text-[32px] font-bold leading-[1] tracking-[-0.03em] sm:text-[42px]">Проверьте спрос до разработки продукта</h3>
              <p className="mt-5 max-w-[440px] text-[16px] leading-6 text-white/75">Получите сценарий интервью, критерии проверки гипотезы и понятный результат шага — обновлённый паспорт проекта.</p>
              <a href="#products" className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[14px] font-bold text-black transition-transform hover:-translate-y-0.5">
                Перейти к следующему шагу <ArrowUpRight size={17} />
              </a>
            </div>
            <span className="pointer-events-none absolute -bottom-10 -left-2 text-[190px] font-black leading-none tracking-[-0.1em] text-white/8 sm:text-[260px]">AI</span>
            <Image src={assetPath("/assets/ai/ai-letter.png")} alt="" width={760} height={760} className="pointer-events-none absolute -bottom-[18%] -right-[22%] w-[74%] max-w-[560px] object-contain drop-shadow-2xl" />
          </article>

          <ol className="grid gap-4">
            {steps.map((step) => (
              <li key={step.number} className={`${step.tone} grid min-h-[145px] grid-cols-[auto_1fr] gap-5 rounded-[26px] p-6 sm:p-7`}>
                <span className="text-[13px] font-bold opacity-60">{step.number}</span>
                <div>
                  <h3 className="text-[24px] font-bold leading-none tracking-[-0.025em]">{step.title}</h3>
                  <p className="mt-3 max-w-[360px] text-[15px] leading-5 opacity-70">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
