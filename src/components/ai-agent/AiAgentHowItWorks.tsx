import { Container } from "@/components/ui/Container";
import { NumberedFeatureCard } from "@/components/ui/NumberedFeatureCard";
import { assetPath } from "@/lib/assetPath";

const agentSteps = [
  {
    number: "1",
    numberImage: "/assets/ai/step-numbers/1.png",
    title: "Собирает контекст",
    text: "Уточняет тип проекта, продукт, аудиторию, цель и ресурсы. Задаёт до пяти коротких вопросов и сохраняет ответы в паспорт бизнеса.",
    tone: "bg-future-purple text-white",
  },
  {
    number: "2",
    numberImage: "/assets/ai/step-numbers/2.png",
    title: "Подбирает AI-команду",
    text: "Выбирает 3–5 специалистов под вашу стадию и цель. Объясняет, зачем нужен каждый агент и с какой задачи начать.",
    tone: "bg-future-blue text-white",
  },
  {
    number: "3",
    numberImage: "/assets/ai/step-numbers/3.png",
    title: "Разделяет задачи",
    text: "У каждого специалиста свой чат, роль и история. Вы сами выбираете агента и ставите ему конкретную задачу.",
    tone: "bg-future-blue text-white",
  },
  {
    number: "4",
    numberImage: "/assets/ai/step-numbers/4.png",
    title: "Объединяет результаты",
    text: "Получает итоги специалистов, собирает общую картину и предлагает один следующий шаг для бизнеса.",
    tone: "bg-future-purple text-white",
  },
];

export function AiAgentHowItWorks() {
  return (
    <section id="how-ai-agent-works" className="scroll-mt-6 bg-white py-16 text-black sm:py-20 laptop:py-24">
      <Container>
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-alfa-red">Четыре шага</p>
        <h2 className="mt-2 max-w-[900px] text-[36px] font-black leading-[0.94] tracking-[-0.055em] sm:text-[48px] laptop:text-[56px]">
          Как работает Альфа-Партнёр
        </h2>
        <p className="mt-5 max-w-[820px] text-[15px] font-medium leading-6 text-black/55 sm:text-[18px] sm:leading-7">
          Один главный AI-партнёр изучает бизнес, подбирает специалистов и объединяет результаты команды.
        </p>

        <ol className="mt-9 grid gap-4 md:grid-cols-2 sm:mt-11">
          {agentSteps.map((step) => (
            <NumberedFeatureCard
              key={step.number}
              {...step}
              numberImage={assetPath(step.numberImage)}
              tone={step.tone}
              className="h-full min-h-[220px] sm:min-h-[230px]"
              prominentNumber
            />
          ))}
        </ol>
      </Container>
    </section>
  );
}
