import { Container } from "@/components/ui/Container";
import { NumberedFeatureCard } from "@/components/ui/NumberedFeatureCard";
import { assetPath } from "@/lib/assetPath";

const agentSteps = [
  {
    number: "1",
    numberImage: "/assets/ai/step-numbers/1.png",
    title: "Изучает ваш бизнес",
    text: "Задаёт 5 вопросов о продукте, аудитории, готовности проекта, бюджете и текущей цели. Ответы сохраняются в паспорте бизнеса.",
  },
  {
    number: "2",
    numberImage: "/assets/ai/step-numbers/2.png",
    title: "Собирает персонального агента",
    text: "Подключает навыки именно под вашу стадию и задачу: проверку спроса, интервью с клиентами, тестирование предложения и другие инструменты.",
  },
  {
    number: "3",
    numberImage: "/assets/ai/step-numbers/3.png",
    title: "Выбирает одно действие",
    text: "Не выдаёт длинный список советов. Объясняет, что сделать сейчас, и подготавливает готовый инструмент для выполнения задачи.",
  },
  {
    number: "4",
    numberImage: "/assets/ai/step-numbers/4.png",
    title: "Учитывает результат",
    text: "Обновляет дальнейший маршрут после выполнения задачи. Продукт Альфы предлагает только при появлении конкретной финансовой потребности.",
  },
];

export function AiAgentHowItWorks() {
  return (
    <section id="how-ai-agent-works" className="scroll-mt-6 bg-white py-16 text-black sm:py-20 laptop:py-24">
      <Container>
        <h2 className="max-w-[760px] text-[30px] font-bold leading-[0.98] tracking-[-0.04em] sm:text-[34px] laptop:text-[36px]">
          Как работает ваш AI-агент
        </h2>
        <p className="mt-4 max-w-[820px] text-[16px] leading-6 text-black/60 sm:text-[18px] sm:leading-7">
          Он изучает проект, подключает навыки и переводит предпринимателя к одному конкретному действию.
        </p>

        <ol className="mt-9 grid gap-4 md:grid-cols-2 sm:mt-10">
          {agentSteps.map((step) => (
            <NumberedFeatureCard
              key={step.number}
              {...step}
              numberImage={assetPath(step.numberImage)}
              tone="bg-future-purple text-white"
              className="h-full min-h-[200px] sm:min-h-[210px]"
              prominentNumber
            />
          ))}
        </ol>
      </Container>
    </section>
  );
}
