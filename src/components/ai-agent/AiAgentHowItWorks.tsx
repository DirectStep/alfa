import { Container } from "@/components/ui/Container";
import { NumberedFeatureCard } from "@/components/ui/NumberedFeatureCard";
import { assetPath } from "@/lib/assetPath";

const agentSteps = [
  {
    number: "1",
    numberImage: "/assets/ai/step-numbers/1.png",
    title: "Собирает контекст",
    text: "Принимает свободное описание вместо длинной анкеты и уточняет только недостающее: тип проекта, продукт, аудиторию, стадию, цель, текущие проблемы, ресурсы и бюджет. Ответы превращаются в единый паспорт бизнеса, доступный всей AI-команде — вводную не приходится повторять в каждом чате.",
    tone: "bg-future-purple text-white",
  },
  {
    number: "2",
    numberImage: "/assets/ai/step-numbers/2.png",
    title: "Подбирает AI-команду",
    text: "Выбирает 3–5 специалистов из фиксированного реестра ролей под текущую стадию и цель проекта. Например, маркетолога — для проверки спроса, продуктового специалиста — для MVP, финансиста — для экономики запуска. Для каждого объясняет причину выбора и формулирует первую задачу; состав можно изменить.",
    tone: "bg-future-blue text-white",
  },
  {
    number: "3",
    numberImage: "/assets/ai/step-numbers/3.png",
    title: "Разделяет задачи",
    text: "После подтверждения команды каждый специалист получает отдельный чат, роль, допустимые задачи, статус и историю. Все агенты учитывают общий паспорт, но их переписки не смешиваются. Предприниматель выбирает исполнителя, ставит задачу своими словами и получает конкретный результат: план, расчёт, оффер, структуру или чек-лист.",
    tone: "bg-future-blue text-white",
  },
  {
    number: "4",
    numberImage: "/assets/ai/step-numbers/4.png",
    title: "Объединяет результаты",
    text: "Готовый результат специалиста одним действием передаётся Альфа-Партнёру как краткое резюме. Главный агент учитывает переданные итоги команды и предлагает один следующий шаг. Продукт Альфы появляется только при подтверждённой финансовой потребности — например, когда уже есть заказ и нужно принять оплату.",
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
        <p className="mt-5 max-w-[980px] text-[15px] font-medium leading-6 text-black/60 sm:text-[18px] sm:leading-7">
          Прототип показывает один сквозной сценарий: от свободного описания бизнеса до согласованной AI-команды, конкретного результата и следующего действия. На каждом этапе видно, какие данные использует агент, что получает предприниматель и почему продукт Альфы появляется только в нужный момент.
        </p>

        <ol className="mt-9 grid gap-4 md:grid-cols-2 sm:mt-11">
          {agentSteps.map((step) => (
            <NumberedFeatureCard
              key={step.number}
              {...step}
              numberImage={assetPath(step.numberImage)}
              tone={step.tone}
              className="h-full min-h-[290px] sm:min-h-[310px]"
              prominentNumber
            />
          ))}
        </ol>
      </Container>
    </section>
  );
}
