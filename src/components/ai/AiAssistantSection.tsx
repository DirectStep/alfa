"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { aiStages, aiDataSources } from "@/data/aiAssistant";

export function AiAssistantSection() {
  const [stageId, setStageId] = useState(aiStages[2].id);
  const activeStage = aiStages.find((stage) => stage.id === stageId) ?? aiStages[0];

  return (
    <section id="ai" className="py-10 laptop:py-14">
      <Container>
        <div className="rounded-[28px] bg-black p-6 text-white laptop:p-10">
          <h2 className="text-[28px] font-bold laptop:text-[34px]">
            AI-помощник понимает, на какой вы стадии
          </h2>

          <div
            role="group"
            aria-label="Стадия бизнеса"
            className="mt-6 flex flex-wrap gap-2 rounded-full bg-white/10 p-1.5"
          >
            {aiStages.map((stage) => {
              const isActive = stage.id === stageId;
              return (
                <button
                  key={stage.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setStageId(stage.id)}
                  className={`rounded-full px-4 py-2.5 text-[14px] font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alfa-red ${
                    isActive ? "bg-white text-black" : "text-white/70 hover:text-white"
                  }`}
                >
                  {stage.label}
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col gap-4 laptop:flex-row laptop:items-stretch">
            {activeStage.steps.map((step, index) => (
              <div key={step.label} className="flex flex-1 items-center gap-4">
                <div className="flex-1 rounded-[20px] bg-white/5 p-5">
                  <p className="text-[13px] font-medium uppercase tracking-wide text-white/50">
                    {step.label}
                  </p>
                  <p className="mt-2 text-[15px] leading-snug">{step.text}</p>
                </div>
                {index < activeStage.steps.length - 1 && (
                  <ArrowRight
                    className="hidden shrink-0 text-alfa-red laptop:block"
                    size={22}
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {aiDataSources.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/20 px-3 py-1.5 text-[13px] text-white/70"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
