"use client";

import { useState, type KeyboardEvent } from "react";
import { BookOpen, Sparkles, UserRound, Wallet, type LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PhoneMockup } from "@/components/ui/PhoneMockup";
import { SectionHeading } from "@/components/ui/SectionHeading";

type Screen = { id: string; label: string; icon: LucideIcon; title: string; text: string; action: string };

const screens: Screen[] = [
  { id: "passport", label: "Паспорт проекта", icon: UserRound, title: "Весь прогресс проекта — в одном профиле", text: "Цель, стадия, выполненные шаги и ближайшая задача собраны в едином рабочем контексте.", action: "Обновить статус проекта" },
  { id: "ai", label: "AI-маршрут", icon: Sparkles, title: "План запуска меняется вместе с проектом", text: "Навигатор учитывает ответы, активность и результат предыдущих шагов — и предлагает следующий обоснованный шаг.", action: "Открыть следующий шаг" },
  { id: "knowledge", label: "Практические материалы", icon: BookOpen, title: "Материалы привязаны к конкретной задаче", text: "Шаблоны, разборы и короткие инструкции появляются в маршруте тогда, когда их можно применить.", action: "Открыть подборку" },
  { id: "finance", label: "Финансовое действие", icon: Wallet, title: "От рекомендации — сразу к банковскому действию", text: "Приём оплаты, счёт или выплаты подключаются в приложении Альфа-Банка без разрыва пользовательского сценария.", action: "Перейти в Альфа-Бизнес" },
];

function ProjectScreen({ screen }: { screen: Screen }) {
  return (
    <div className="p-3 text-black">
      <div className="rounded-xl bg-[#f3f3f5] p-3">
        <p className="text-[7px] font-medium text-black/50">АЛЬФА-ДЕЛО</p>
        <p className="mt-1.5 text-[11px] font-bold leading-tight">{screen.label}</p>
      </div>
      <div className="mt-2.5 rounded-xl bg-white p-3 shadow-[0_5px_18px_rgba(0,0,0,0.07)]">
        <div className="flex items-center justify-between">
          <div className="h-8 w-8 rounded-full bg-[#dedee2]" />
          <span className="rounded-full bg-[#ffe6e4] px-2 py-1 text-[6px] font-bold text-alfa-red">ШАГ 3 ИЗ 5</span>
        </div>
        <p className="mt-3 text-[9px] font-bold leading-tight">{screen.title}</p>
        <div className="mt-3 h-1.5 rounded-full bg-[#ececef]"><div className="h-full w-3/5 rounded-full bg-alfa-red" /></div>
      </div>
      <div className="mt-2.5 rounded-lg bg-alfa-red px-3 py-2.5 text-center text-[7px] font-bold text-white">{screen.action}</div>
    </div>
  );
}

function NextStepScreen({ screen }: { screen: Screen }) {
  return (
    <div className="p-3 text-black">
      <p className="text-[7px] font-medium text-black/50">СЛЕДУЮЩИЙ ШАГ</p>
      <h4 className="mt-2 text-[11px] font-bold leading-tight">{screen.title}</h4>
      <div className="mt-3 space-y-2">
        {["Открыть инструкцию", "Выполнить действие", "Обновить Паспорт проекта"].map((item, index) => (
          <div key={item} className="flex items-center gap-2 rounded-lg bg-[#f3f3f5] p-2.5">
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[6px] font-bold ${index === 0 ? "bg-alfa-red text-white" : "bg-white text-black/45"}`}>{index + 1}</span>
            <span className="text-[7px] font-medium">{item}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg bg-[#171719] px-3 py-2.5 text-center text-[7px] font-bold text-white">{screen.action}</div>
    </div>
  );
}

export function AppShowcaseCarousel() {
  const [activeId, setActiveId] = useState(screens[0].id);
  const active = screens.find((screen) => screen.id === activeId)!;

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) {
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();

    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? screens.length - 1
        : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + screens.length) % screens.length;

    setActiveId(screens[nextIndex].id);
    document.getElementById(`showcase-tab-${screens[nextIndex].id}`)?.focus();
  }

  return (
    <section id="how-it-works" className="pt-20 laptop:pt-24">
      <Container>
        <SectionHeading label="Прототип" title="Один интерфейс ведёт проект от идеи к действию" subtitle="Паспорт проекта хранит контекст. AI-маршрут предлагает следующий шаг. Знания и финансовые инструменты помогают его выполнить." />

        <div role="tablist" aria-label="Экраны приложения" className="mt-7 grid grid-cols-2 gap-1.5 rounded-[24px] bg-[#ededee] p-1.5 laptop:grid-cols-4">
          {screens.map((screen, index) => {
            const selected = screen.id === activeId;
            return (
              <button key={screen.id} id={`showcase-tab-${screen.id}`} type="button" role="tab" aria-selected={selected} aria-controls="showcase-panel" tabIndex={selected ? 0 : -1} onClick={() => setActiveId(screen.id)} onKeyDown={(event) => handleTabKeyDown(event, index)} className={`flex min-h-12 items-center justify-center gap-2 rounded-full px-3 text-[12px] font-medium transition-colors min-[420px]:text-[13px] laptop:text-[14px] ${selected ? "bg-[#202023] text-white" : "text-[#303034] hover:bg-white"}`}>
                <screen.icon size={16} aria-hidden />{screen.label}
              </button>
            );
          })}
        </div>

        <div id="showcase-panel" role="tabpanel" aria-labelledby={`showcase-tab-${active.id}`} className="mt-6 grid overflow-hidden rounded-[28px] bg-[#171719] text-white laptop:min-h-[540px] laptop:grid-cols-[0.9fr_1.1fr] laptop:rounded-[32px]">
          <article className="flex flex-col justify-center p-7 sm:p-9 laptop:p-12">
            <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-alfa-red">{active.label}</p>
            <h3 className="mt-4 max-w-[560px] text-[28px] font-bold leading-[1.12] tracking-[-0.02em] laptop:text-[36px]">{active.title}</h3>
            <p className="mt-4 max-w-[540px] text-[15px] leading-6 text-white/65">{active.text}</p>
            <div className="mt-8 inline-flex w-fit items-center rounded-full border border-white/20 px-4 py-2 text-[13px] text-white/75">Интерфейсный прототип</div>
          </article>

          <div className="relative flex min-h-[480px] items-end justify-center overflow-hidden bg-[#ececef] px-5 pt-8 laptop:min-h-[540px] laptop:gap-8">
            <PhoneMockup headerClass="bg-alfa-red" className="relative z-10 h-[88%] max-h-[480px] -rotate-[4deg] translate-y-4"><ProjectScreen screen={active} /></PhoneMockup>
            <PhoneMockup headerClass="bg-[#171719]" className="relative z-20 hidden h-[94%] max-h-[510px] rotate-[4deg] translate-y-6 md:block"><NextStepScreen screen={active} /></PhoneMockup>
          </div>
        </div>
      </Container>
    </section>
  );
}
