import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const goals = [
  "Пользователь понимает ближайшую задачу и критерий её выполнения",
  "Знания и опыт сообщества применяются внутри рабочего сценария",
  "Финансовое действие становится логичным продолжением маршрута",
];

export function PilotGoalsSection() {
  return (
    <section className="pt-20 laptop:pt-24">
      <Container>
        <div className="grid rounded-[28px] border border-border p-6 sm:p-8 laptop:grid-cols-[0.82fr_1.18fr] laptop:gap-12 laptop:rounded-[32px] laptop:p-10">
          <SectionHeading label="Пилот проекта" title="Что должна подтвердить первая версия" subtitle="На пилоте проверяем не количество функций, а способность сервиса довести предпринимателя до осмысленного действия." />
          <ul className="mt-7 space-y-3 laptop:mt-0">
            {goals.map((goal) => (
              <li key={goal} className="flex items-start gap-3 rounded-[18px] bg-[#f2f3f5] p-4">
                <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-alfa-red" aria-hidden />
                <span className="text-[15px] leading-6">{goal}</span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
