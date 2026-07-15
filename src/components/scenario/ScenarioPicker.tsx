"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { industries, stages } from "@/data/scenarios";

export function ScenarioPicker() {
  const [industryId, setIndustryId] = useState(industries[2].id);
  const [stageId, setStageId] = useState(stages[2].id);

  return (
    <section className="pt-6 pb-0 laptop:pt-8">
      <Container>
        <div className="rounded-[26px] border border-border bg-white p-6 laptop:p-9">
          <div className="flex flex-col gap-4 laptop:flex-row laptop:items-center laptop:justify-between">
            <h2 className="text-[28px] font-bold laptop:text-[38px]">
              Выберите свой сценарий
            </h2>
            <div className="laptop:w-1/2">
              <SegmentedControl
                aria-label="Сфера бизнеса"
                options={industries}
                activeId={industryId}
                onSelect={setIndustryId}
                variant="dark"
              />
            </div>
          </div>

          <div className="mt-3">
            <SegmentedControl
              aria-label="Стадия бизнеса"
              options={stages}
              activeId={stageId}
              onSelect={setStageId}
              variant="outline-red"
            />
          </div>

          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-text-secondary">
            Платформа подстраивается под вашу сферу, стадию и ближайшую
            задачу.
          </p>
        </div>
      </Container>
    </section>
  );
}
