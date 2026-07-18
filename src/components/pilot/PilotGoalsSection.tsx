import { Container } from "@/components/ui/Container";

const goals = [
  { number: "01", title: "Ясный следующий шаг", text: "Пользователь понимает задачу и критерий её завершения.", tone: "bg-future-green text-black" },
  { number: "02", title: "Знания в момент действия", text: "Опыт сообщества работает внутри сценария, а не лежит отдельной библиотекой.", tone: "bg-future-purple text-white" },
  { number: "03", title: "Финансы как продолжение", text: "Банковский инструмент появляется тогда, когда проект к нему готов.", tone: "bg-alfa-red text-white" },
];

export function PilotGoalsSection() {
  return (
    <section className="bg-black py-16 text-white laptop:py-24">
      <Container>
        <div className="grid gap-6 laptop:grid-cols-[0.8fr_1.2fr] laptop:items-end">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-future-green">Пилот проекта</p>
            <h2 className="mt-4 text-[40px] font-bold leading-[0.95] tracking-[-0.045em] sm:text-[56px] laptop:text-[68px]">Проверяем<br />делом</h2>
          </div>
          <p className="max-w-[650px] text-[18px] leading-7 text-white/65 laptop:justify-self-end">Первая версия не пытается закрыть все потребности бизнеса. Она доказывает, что сервис способен довести молодого предпринимателя до осмысленного действия.</p>
        </div>
        <ol className="mt-10 grid gap-4 laptop:grid-cols-3">
          {goals.map((goal) => (
            <li key={goal.number} className={`${goal.tone} min-h-[290px] rounded-[28px] p-7 laptop:rounded-[34px]`}>
              <span className="text-[14px] font-bold opacity-60">{goal.number}</span>
              <h3 className="mt-20 text-[28px] font-bold leading-[1.02] tracking-[-0.03em]">{goal.title}</h3>
              <p className="mt-4 text-[15px] leading-5 opacity-70">{goal.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
