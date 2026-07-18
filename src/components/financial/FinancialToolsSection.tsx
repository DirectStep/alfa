import { Landmark, QrCode, ShieldCheck, UsersRound, type LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const tools = [
  { stage: "Первые продажи", title: "Принять первую оплату", text: "Ссылка, QR-код или СБП — подходящий способ появляется в маршруте запуска.", icon: QrCode, metric: "СБП", note: "QR-код готов" },
  { stage: "Стабильные операции", title: "Разделить личные и бизнес-финансы", text: "Счёт и ежедневные операции подключаются, когда проект готов к регулярным расчётам.", icon: Landmark, metric: "Счёт", note: "Операции бизнеса" },
  { stage: "Рост команды", title: "Настроить выплаты и расходы", text: "Инструменты для выплат, контроля операций и дальнейшего масштабирования.", icon: UsersRound, metric: "Команда", note: "Выплаты по реестру" },
] satisfies Array<{ stage: string; title: string; text: string; icon: LucideIcon; metric: string; note: string }>;

export function FinancialToolsSection() {
  return (
    <section id="products" className="pt-20 laptop:pt-24">
      <Container>
        <SectionHeading label="Альфа-Банк" title="Финансовые инструменты на каждом этапе бизнеса" subtitle="Сервис не показывает банковский каталог целиком. Он предлагает конкретное действие тогда, когда оно необходимо проекту." />
        <ul className="mt-7 grid gap-4 laptop:grid-cols-3">
          {tools.map((tool) => (
            <li key={tool.title} className="group overflow-hidden rounded-[26px] bg-[#f2f3f5]">
              <div className="p-6 laptop:p-7">
                <p className="text-[12px] font-semibold text-alfa-red">{tool.stage}</p>
                <h3 className="mt-3 text-[22px] font-bold leading-[1.18]">{tool.title}</h3>
                <p className="mt-3 text-[14px] leading-5 text-text-secondary">{tool.text}</p>
              </div>
              <div className="flex h-[220px] items-center justify-center overflow-hidden bg-white p-6">
                <div className="w-full rounded-[22px] border border-border bg-white p-5 shadow-[0_14px_40px_rgba(0,0,0,0.07)] transition-transform duration-300 group-hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-alfa-red text-white"><tool.icon size={21} /></span>
                    <span className="text-[12px] font-medium text-text-secondary">Альфа-Бизнес</span>
                  </div>
                  <p className="mt-6 text-[24px] font-bold">{tool.metric}</p>
                  <div className="mt-3 flex items-center justify-between rounded-[12px] bg-[#f2f3f5] px-3 py-2.5">
                    <span className="text-[12px] text-text-secondary">{tool.note}</span>
                    <span className="h-2 w-2 rounded-full bg-[#27ae60]" />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-center gap-2.5 text-text-secondary">
          <ShieldCheck size={18} className="shrink-0 text-alfa-red" aria-hidden />
          <p className="text-[14px]">Финансовые операции выполняются в защищённом приложении Альфа-Банка.</p>
        </div>
      </Container>
    </section>
  );
}
