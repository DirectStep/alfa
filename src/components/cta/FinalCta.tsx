import { Check, Circle } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export function FinalCta() {
  return (
    <section className="pt-20 laptop:pt-24">
      <Container>
        <div className="grid overflow-hidden rounded-[28px] bg-[#171719] text-white laptop:min-h-[420px] laptop:grid-cols-[1.05fr_0.95fr] laptop:rounded-[32px]">
          <div className="flex flex-col justify-center p-7 sm:p-9 laptop:p-12">
            <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-alfa-red">Альфа-Дело</p>
            <h2 className="mt-4 max-w-[650px] text-[32px] font-bold leading-[1.1] tracking-[-0.02em] laptop:text-[40px] laptop:leading-[1.2]">Начните с задачи, которая важна вашему проекту сейчас</h2>
            <p className="mt-4 max-w-[560px] text-[15px] leading-6 text-white/65">Ответьте на несколько вопросов и получите первый вариант маршрута — без лишних разделов и общих рекомендаций.</p>
            <div className="mt-7"><Button variant="primary" href="#scenario">Собрать пример маршрута</Button></div>
          </div>
          <div className="flex min-h-[340px] items-center justify-center bg-[#f2f3f5] p-6 sm:p-9">
            <div className="w-full max-w-[480px] rounded-[26px] bg-white p-5 shadow-[0_18px_50px_rgba(0,0,0,0.09)] sm:p-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-[12px] text-text-secondary">Ваш маршрут</p>
                  <p className="mt-1 text-[18px] font-bold">Запуск проекта</p>
                </div>
                <span className="rounded-full bg-[#ffe7e5] px-3 py-1.5 text-[12px] font-semibold text-alfa-red">3 шага</span>
              </div>
              <ol className="mt-4 space-y-2.5">
                {[
                  ["Определить задачу", true],
                  ["Получить рекомендации", false],
                  ["Перейти к действию", false],
                ].map(([label, done], index) => (
                  <li key={String(label)} className="flex items-center gap-3 rounded-[15px] bg-[#f3f4f5] p-3.5">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${done ? "bg-alfa-red text-white" : "bg-white text-text-secondary"}`}>{done ? <Check size={15} /> : <Circle size={14} />}</span>
                    <span className="text-[14px] font-medium text-black">{String(label)}</span>
                    <span className="ml-auto text-[11px] text-text-secondary">0{index + 1}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
