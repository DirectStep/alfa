import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { assetPath } from "@/lib/assetPath";

const steps = [
  { number: "01", title: "Понимает контекст", text: "Учитывает направление, стадию и текущую цель проекта." },
  { number: "02", title: "Собирает маршрут", text: "Связывает задачу с практикой, материалами и следующими действиями." },
  { number: "03", title: "Помогает выполнить шаг", text: "Переводит к нужному сервису или финансовому инструменту Альфы." },
];

export function AiNavigatorSection() {
  return (
    <section id="ai" className="pt-20 laptop:pt-24">
      <Container>
        <div className="grid gap-8 laptop:grid-cols-[0.88fr_1.12fr] laptop:items-end">
          <SectionHeading label="Механика сервиса" title="Не просто советует — ведёт по рабочему маршруту" subtitle="Каждая рекомендация связана с задачей проекта и понятным результатом. Пользователь видит, зачем нужен шаг и что изменится после его выполнения." />
          <ol className="grid gap-3 md:grid-cols-3">
            {steps.map((step) => (
              <li key={step.number} className="rounded-[22px] border border-border bg-white p-5">
                <p className="text-[12px] font-bold text-alfa-red">{step.number}</p>
                <h3 className="mt-8 text-[20px] font-bold leading-[1.2]">{step.title}</h3>
                <p className="mt-2 text-[14px] leading-5 text-text-secondary">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 grid overflow-hidden rounded-[28px] bg-[#f2f3f5] laptop:min-h-[420px] laptop:grid-cols-[1.06fr_0.94fr] laptop:rounded-[32px]">
          <div className="flex flex-col justify-center p-7 sm:p-9 laptop:p-11">
            <p className="text-[13px] font-semibold text-alfa-red">Пример рекомендации</p>
            <h3 className="mt-3 max-w-[620px] text-[26px] font-bold leading-[1.15] laptop:text-[32px]">Проверьте спрос до разработки продукта</h3>
            <p className="mt-4 max-w-[580px] text-[15px] leading-6 text-text-secondary">Маршрут предложит шаблон интервью, примеры вопросов и критерий завершения шага. После проверки спроса обновится Паспорт проекта.</p>
            <a href="#products" className="mt-6 inline-flex items-center gap-2 text-[14px] font-medium hover:text-alfa-red">Следующий этап — приём оплаты <ArrowRight size={17} /></a>
          </div>
          <div className="relative min-h-[330px] bg-white">
            <Image src={assetPath("/assets/official/main-benefit.webp")} alt="Иллюстрация цифрового рабочего процесса" fill sizes="(min-width: 1280px) 42vw, 100vw" className="object-cover object-center" />
          </div>
        </div>
      </Container>
    </section>
  );
}
