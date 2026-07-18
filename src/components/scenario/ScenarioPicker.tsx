"use client";

import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { industries, stages } from "@/data/scenarios";

const industryFocus: Record<string, string> = {
  creative: "Портфолио, цена и первые заказчики",
  startups: "Гипотеза, прототип и обратная связь",
  ecommerce: "Ассортимент, продажи и онлайн-оплата",
};

export function ScenarioPicker() {
  const [industryId, setIndustryId] = useState(industries[0].id);
  const [stageId, setStageId] = useState(stages[1].id);
  const industry = useMemo(() => industries.find((item) => item.id === industryId)!, [industryId]);
  const stage = useMemo(() => stages.find((item) => item.id === stageId)!, [stageId]);

  return (
    <section id="scenario" className="bg-future-purple py-20 text-white laptop:py-24">
      <Container>
        <div className="grid gap-8 laptop:grid-cols-[0.78fr_1.22fr] laptop:items-end">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-future-green">Маршрут под тебя</p>
            <h2 className="mt-4 max-w-[620px] text-[42px] font-bold leading-[0.96] tracking-[-0.045em] text-balance sm:text-[54px] laptop:text-[68px]">Где ты сейчас?</h2>
          </div>
          <p className="max-w-[580px] text-[17px] leading-6 text-white/75 laptop:justify-self-end">Два ответа — и вместо каталога функций ты увидишь ближайшую задачу, полезные материалы и действие, которое двигает проект дальше.</p>
        </div>

        <div className="mt-10 grid overflow-hidden rounded-[28px] bg-[#5d17db] laptop:grid-cols-[0.92fr_1.08fr]">
          <div className="p-6 sm:p-8 laptop:p-10">
            <div>
              <p className="mb-3 text-[13px] font-bold">Чем хочешь заниматься?</p>
              <SegmentedControl aria-label="Направление бизнеса" options={industries} activeId={industryId} onSelect={setIndustryId} variant="future" />
            </div>
            <div className="mt-7">
              <p className="mb-3 text-[13px] font-bold">На каком ты этапе?</p>
              <SegmentedControl aria-label="Стадия бизнеса" options={stages} activeId={stageId} onSelect={setStageId} variant="future" />
            </div>
            <p className="mt-8 text-[13px] text-white/55">Можно изменить ответы в любой момент</p>
          </div>

          <div className="relative flex min-h-[430px] flex-col overflow-hidden bg-future-green p-7 text-black sm:p-9 laptop:p-11">
            <div aria-hidden className="absolute -bottom-12 -right-8 text-[170px] font-black leading-none tracking-[-0.08em] text-alfa-red/90 laptop:text-[230px]">GO</div>
            <p className="relative z-10 text-[12px] font-bold uppercase tracking-[0.08em]">Твой первый маршрут</p>
            <h3 className="relative z-10 mt-7 max-w-[560px] text-[32px] font-bold leading-[1.02] tracking-[-0.035em] sm:text-[40px]">{stage.recommendation}</h3>
            <p className="relative z-10 mt-4 max-w-[450px] text-[16px] leading-6">{industryFocus[industry.id]}</p>
            <a href="#how-it-works" className="relative z-10 mt-auto inline-flex w-fit items-center gap-2 rounded-[13px] bg-black px-5 py-3.5 text-[14px] font-bold text-white transition-transform hover:-translate-y-0.5">Показать маршрут <ArrowRight size={18} /></a>
          </div>
        </div>
      </Container>
    </section>
  );
}
