import { ArrowUpRight, FileText, MessageCircle, Users } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const formats = [
  { icon: MessageCircle, title: "Разборы реальных задач", text: "Вопросы о запуске, продажах и операциях обсуждаются в контексте конкретного проекта." },
  { icon: FileText, title: "Шаблоны и инструкции", text: "Материалы можно сразу применить в текущем шаге маршрута, а не откладывать «на потом»." },
  { icon: Users, title: "Контакты по делу", text: "Профили участников помогают найти опыт, компетенцию или партнёра под задачу." },
];

export function CommunityPreviewSection() {
  return (
    <section id="community" className="pt-20 laptop:pt-24">
      <Container>
        <div className="grid gap-8 laptop:grid-cols-[0.8fr_1.2fr] laptop:items-end">
          <SectionHeading label="Сообщество и знания" title="Практика предпринимателей — в контексте вашей задачи" subtitle="Опыт других участников дополняет маршрут: помогает сравнить решения, избежать типовых ошибок и найти нужный контакт." />
          <ul className="grid gap-3 md:grid-cols-3">
            {formats.map((item) => (
              <li key={item.title} className="rounded-[22px] border border-border p-5">
                <item.icon size={20} className="text-alfa-red" aria-hidden />
                <h3 className="mt-8 text-[18px] font-bold leading-[1.2]">{item.title}</h3>
                <p className="mt-2 text-[14px] leading-5 text-text-secondary">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 grid overflow-hidden rounded-[28px] bg-alfa-red text-white laptop:min-h-[390px] laptop:grid-cols-[0.9fr_1.1fr] laptop:rounded-[32px]">
          <div className="flex flex-col justify-center p-7 sm:p-9 laptop:p-11">
            <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-white/60">Сценарий внутри маршрута</p>
            <h3 className="mt-4 max-w-[520px] text-[28px] font-bold leading-[1.12] laptop:text-[34px]">Не знаете, как назначить цену?</h3>
            <p className="mt-4 max-w-[520px] text-[15px] leading-6 text-white/75">Посмотрите разборы похожих запусков, скачайте шаблон расчёта и задайте уточняющий вопрос участникам из вашей сферы.</p>
            <a href="/concept" className="mt-6 inline-flex items-center gap-2 text-[14px] font-medium">Открыть прототип сообщества <ArrowUpRight size={17} /></a>
          </div>
          <div className="flex min-h-[330px] items-center justify-center bg-white p-6 sm:p-9">
            <div className="w-full max-w-[540px] rounded-[26px] border border-border bg-[#f3f4f5] p-4 sm:p-5">
              <div className="flex items-center justify-between px-1 pb-4">
                <p className="text-[15px] font-bold text-black">Практика предпринимателей</p>
                <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-text-secondary">E-commerce</span>
              </div>
              <div className="space-y-2.5">
                {[
                  ["АК", "Как проверить цену до запуска?", "6 ответов"],
                  ["МТ", "Шаблон расчёта юнит-экономики", "Материал"],
                  ["ИЛ", "Разбор первой рекламной кампании", "12 ответов"],
                ].map(([initials, title, meta], index) => (
                  <div key={title} className="flex items-center gap-3 rounded-[16px] bg-white p-3.5">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${index === 1 ? "bg-[#171719] text-white" : "bg-[#ffe2df] text-alfa-red"}`}>{initials}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-black sm:text-[14px]">{title}</p>
                      <p className="mt-1 text-[11px] text-text-secondary">{meta}</p>
                    </div>
                    <ArrowUpRight size={16} className="shrink-0 text-text-secondary" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
