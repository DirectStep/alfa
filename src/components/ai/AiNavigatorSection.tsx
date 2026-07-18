import { ArrowRight, Check, FileText, Search } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const steps = [
  { number: "01", title: "Понимает контекст", text: "Учитывает направление, стадию и текущую цель проекта." },
  { number: "02", title: "Собирает маршрут", text: "Связывает задачу с практикой, материалами и следующими действиями." },
  { number: "03", title: "Помогает выполнить шаг", text: "Переводит к нужному сервису или финансовому инструменту Альфы." },
];

export function AiNavigatorSection() {
  return (
    <section id="ai" className="pt-20 laptop:pt-24">
      <Container>
        <div className="grid gap-8 laptop:grid-cols-[0.88fr_1.12fr] laptop:items-end">
          <SectionHeading label="Механика сервиса" title="Не просто советует — ведёт по рабочему маршруту" subtitle="Каждая рекомендация связана с задачей проекта и понятным результатом. Пользователь видит, зачем нужен шаг и что изменится после его выполнения." />
          <ol className="grid gap-3 md:grid-cols-3">
            {steps.map((step) => (
              <li key={step.number} className="rounded-[22px] border border-border bg-white p-5">
                <p className="text-[12px] font-bold text-alfa-red">{step.number}</p>
                <h3 className="mt-8 text-[20px] font-bold leading-[1.2]">{step.title}</h3>
                <p className="mt-2 text-[14px] leading-5 text-text-secondary">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 grid overflow-hidden rounded-[28px] bg-[#f2f3f5] laptop:min-h-[420px] laptop:grid-cols-[1.06fr_0.94fr] laptop:rounded-[32px]">
          <div className="flex flex-col justify-center p-7 sm:p-9 laptop:p-11">
            <p className="text-[13px] font-semibold text-alfa-red">Пример рекомендации</p>
            <h3 className="mt-3 max-w-[620px] text-[26px] font-bold leading-[1.15] laptop:text-[32px]">Проверьте спрос до разработки продукта</h3>
            <p className="mt-4 max-w-[580px] text-[15px] leading-6 text-text-secondary">Маршрут предложит шаблон интервью, примеры вопросов и критерий завершения шага. После проверки спроса обновится Паспорт проекта.</p>
            <a href="#products" className="mt-6 inline-flex items-center gap-2 text-[14px] font-medium hover:text-alfa-red">Следующий этап — приём оплаты <ArrowRight size={17} /></a>
          </div>
          <div className="flex min-h-[330px] items-center justify-center bg-white p-6 sm:p-9">
            <div className="w-full max-w-[480px] rounded-[26px] border border-border bg-white p-5 shadow-[0_18px_50px_rgba(0,0,0,0.08)] sm:p-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-[12px] text-text-secondary">Маршрут запуска</p>
                  <p className="mt-1 text-[17px] font-bold">Проверка спроса</p>
                </div>
                <span className="rounded-full bg-[#ffe7e5] px-3 py-1.5 text-[12px] font-semibold text-alfa-red">Шаг 2 из 5</span>
              </div>
              <div className="mt-4 space-y-2.5">
                {[
                  { icon: Check, label: "Сформулировать гипотезу", done: true },
                  { icon: Search, label: "Провести 5 интервью", done: false },
                  { icon: FileText, label: "Зафиксировать выводы", done: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-[16px] bg-[#f3f4f5] p-3.5">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.done ? "bg-alfa-red text-white" : "bg-white text-text-secondary"}`}><item.icon size={15} /></span>
                    <span className="text-[14px] font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#ececef]"><div className="h-full w-2/5 rounded-full bg-alfa-red" /></div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
