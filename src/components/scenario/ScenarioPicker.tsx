"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { industries, stages } from "@/data/scenarios";

export function ScenarioPicker() {
  const [industryId, setIndustryId] = useState(industries[2].id);
  const [stageId, setStageId] = useState(stages[2].id);

  const activeStage = stages.find((stage) => stage.id === stageId) ?? stages[0];

  return (
    <section className="py-10 laptop:py-14">
      <Container>
        <div className="rounded-[28px] border border-border bg-white p-6 laptop:p-10">
          <h2 className="text-[28px] font-bold laptop:text-[34px]">
            Выберите свой сценарий
          </h2>

          <div className="mt-6 flex flex-col gap-3">
            <SegmentedControl
              aria-label="Сфера бизнеса"
              options={industries}
              activeId={industryId}
              onSelect={setIndustryId}
              variant="dark"
            />
            <SegmentedControl
              aria-label="Стадия бизнеса"
              options={stages}
              activeId={stageId}
              onSelect={setStageId}
              variant="outline-red"
            />
          </div>

          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-text-secondary">
            Платформа подстраивается под вашу сферу, стадию и ближайшую
            задачу.
          </p>
          <p className="mt-2 max-w-2xl text-[15px] font-medium text-text-primary">
            {activeStage.recommendation}
          </p>
        </div>
      </Container>
    </section>
  );
}
