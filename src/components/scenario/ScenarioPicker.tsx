"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { industries, stages } from "@/data/scenarios";

const nextSteps = ["Проверить исходные данные", "Собрать план на ближайшие действия", "Подключить нужный инструмент Альфы"];
const industryFocus: Record<string, string> = {
  creative: "Фокус: портфолио, стоимость работы и поиск первых заказчиков.",
  startups: "Фокус: проверка гипотезы, прототип и обратная связь от рынка.",
  ecommerce: "Фокус: ассортимент, каналы продаж и приём онлайн-оплаты.",
};

export function ScenarioPicker() {
  const [industryId, setIndustryId] = useState(industries[0].id);
  const [stageId, setStageId] = useState(stages[1].id);
  const industry = useMemo(() => industries.find((item) => item.id === industryId)!, [industryId]);
  const stage = useMemo(() => stages.find((item) => item.id === stageId)!, [stageId]);

  return (
    <section id="scenario" className="pt-20 laptop:pt-24">
      <Container>
        <div className="grid overflow-hidden rounded-[28px] border border-border bg-white laptop:grid-cols-[0.92fr_1.08fr] laptop:rounded-[32px]">
          <div className="p-6 sm:p-8 laptop:p-10">
            <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-alfa-red">Персональный маршрут</p>
            <h2 className="mt-3 text-[30px] font-bold leading-[1.12] tracking-[-0.02em] laptop:text-[40px] laptop:leading-[1.2]">С чего начинается ваш проект?</h2>
            <p className="mt-4 max-w-[520px] text-[15px] leading-6 text-text-secondary">Два ответа помогают убрать лишнее и собрать рекомендации под конкретную задачу.</p>

            <div className="mt-7 space-y-5">
              <div>
                <p className="mb-2 text-[13px] font-semibold">Направление</p>
                <SegmentedControl aria-label="Направление бизнеса" options={industries} activeId={industryId} onSelect={setIndustryId} variant="dark" />
              </div>
              <div>
                <p className="mb-2 text-[13px] font-semibold">Текущая стадия</p>
                <SegmentedControl aria-label="Стадия бизнеса" options={stages} activeId={stageId} onSelect={setStageId} variant="outline-red" />
              </div>
            </div>
          </div>

          <div className="flex flex-col bg-[#171719] p-6 text-white sm:p-8 laptop:p-10">
            <div className="flex items-center justify-between gap-4 border-b border-white/15 pb-5">
              <div>
                <p className="text-[12px] text-white/55">Маршрут для направления</p>
                <p className="mt-1 text-[16px] font-semibold">{industry.label}</p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-[12px]">{stage.label}</span>
            </div>
            <h3 className="mt-7 text-[24px] font-bold leading-[1.15] laptop:text-[28px]">{stage.recommendation}</h3>
            <p className="mt-3 text-[14px] leading-5 text-white/60">{industryFocus[industry.id]}</p>
            <ol className="mt-7 space-y-3">
              {nextSteps.map((step, index) => (
                <li key={step} className="flex items-center gap-3 rounded-[16px] bg-white/[0.07] p-3.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-alfa-red text-[12px] font-bold">{index === 0 ? <Check size={14} /> : index + 1}</span>
                  <span className="text-[14px] leading-5 text-white/85">{step}</span>
                </li>
              ))}
            </ol>
            <a href="#how-it-works" className="mt-7 inline-flex items-center gap-2 text-[14px] font-medium text-white hover:text-white/75">Продолжить по примеру маршрута <ArrowRight size={17} /></a>
          </div>
        </div>
      </Container>
    </section>
  );
}
