import { Container } from "@/components/ui/Container";
import { NumberedFeatureCard } from "@/components/ui/NumberedFeatureCard";
import { assetPath } from "@/lib/assetPath";

const agentSteps = [
  {
    number: "1",
    numberImage: "/assets/ai/step-numbers/1.png",
    title: "Собирает контекст",
    text: "Альфа-партнёр выясняет тип проекта, продукт, аудиторию, стадию, цель, проблемы, ресурсы и бюджет. Он задаёт до пяти коротких вопросов, не повторяет уже известное и сохраняет ответы в паспорте бизнеса.",
  },
  {
    number: "2",
    numberImage: "/assets/ai/step-numbers/2.png",
    title: "Подбирает AI-команду",
    text: "По стадии, цели и задачам выбирает 3–5 специалистов из фиксированного реестра. Для каждого показывает, зачем он нужен проекту и какую первую задачу стоит ему поручить; состав команды можно изменить.",
  },
  {
    number: "3",
    numberImage: "/assets/ai/step-numbers/3.png",
    title: "Разделяет задачи",
    text: "У каждого специалиста отдельный чат, системная роль, ограничения и история сообщений. Все видят общий паспорт бизнеса, но не смешивают диалоги; пользователь сам выбирает агента и формулирует задачу.",
  },
  {
    number: "4",
    numberImage: "/assets/ai/step-numbers/4.png",
    title: "Объединяет результаты",
    text: "Готовый итог можно передать Альфа-партнёру одним действием. Он объединяет результаты команды, находит следующий пробел и предлагает один конкретный шаг; продукт Альфы появляется только при подтверждённой финансовой задаче.",
  },
];

export function AiAgentHowItWorks() {
  return (
    <section id="how-ai-agent-works" className="scroll-mt-6 bg-white py-16 text-black sm:py-20 laptop:py-24">
      <Container>
        <h2 className="max-w-[760px] text-[30px] font-bold leading-[0.98] tracking-[-0.04em] sm:text-[34px] laptop:text-[36px]">
          Как работает Альфа-партнёр
        </h2>
        <p className="mt-4 max-w-[820px] text-[16px] leading-6 text-black/60 sm:text-[18px] sm:leading-7">
          Один главный AI-партнёр изучает бизнес, подбирает специалистов и объединяет результаты команды.
        </p>

        <ol className="mt-9 grid gap-4 md:grid-cols-2 sm:mt-10">
          {agentSteps.map((step) => (
            <NumberedFeatureCard
              key={step.number}
              {...step}
              numberImage={assetPath(step.numberImage)}
              tone="bg-future-purple text-white"
              className="h-full min-h-[240px] sm:min-h-[250px]"
              prominentNumber
            />
          ))}
        </ol>
      </Container>
    </section>
  );
}
