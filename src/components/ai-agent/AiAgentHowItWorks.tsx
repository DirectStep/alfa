import Image from "next/image";

import { Container } from "@/components/ui/Container";
import { assetPath } from "@/lib/assetPath";

const agentSteps = [
  { number: "1", image: "/assets/ai/decor/step-1.webp", title: "Собирает контекст", text: "Узнаёт продукт, аудиторию, стадию, цель и ресурсы." },
  { number: "2", image: "/assets/ai/decor/step-2.webp", title: "Подбирает AI-команду", text: "Выбирает 3–5 специалистов под текущие задачи." },
  { number: "3", image: "/assets/ai/decor/step-3.webp", title: "Разделяет задачи", text: "Каждый специалист получает свою роль и рабочий чат." },
  { number: "4", image: "/assets/ai/decor/step-4.webp", title: "Объединяет результаты", text: "Собирает итоги команды и предлагает следующее действие." },
];

export function AiAgentHowItWorks() {
  return (
    <section id="how-ai-agent-works" className="scroll-mt-6 bg-future-green text-black">
      <Container className="ai-agent-container">
        <div className="mx-auto max-w-[1180px] py-20 sm:py-24 laptop:py-28">
          <p className="future-caption text-black/55">Четыре шага</p>
          <h2 className="future-section-title mt-4 max-w-[900px]">Как работает Альфа-Партнёр</h2>
          <ol className="how-steps-grid mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2">
            {agentSteps.map((step) => (
              <li key={step.number} className="min-w-0">
                <Image
                  src={assetPath(step.image)}
                  alt={step.number}
                  width={96}
                  height={96}
                  className="h-[72px] w-[72px] object-contain object-left sm:h-[82px] sm:w-[82px]"
                />
                <h3 className="mt-7 text-[22px] font-bold leading-[1.02] tracking-[-.025em]">{step.title}</h3>
                <p className="mt-4 max-w-[250px] text-[14px] font-normal leading-6 text-black/68">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
