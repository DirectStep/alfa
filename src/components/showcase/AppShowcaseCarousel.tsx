"use client";

import Image from "next/image";
import { useState, type KeyboardEvent } from "react";
import { BookOpen, Sparkles, UserRound, Wallet, type LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { assetPath } from "@/lib/assetPath";

type Screen = { id: string; label: string; icon: LucideIcon; title: string; text: string; image: string; imageWidth: number; imageHeight: number };

const screens: Screen[] = [
  { id: "passport", label: "Паспорт проекта", icon: UserRound, title: "Весь прогресс проекта — в одном профиле", text: "Цель, стадия, выполненные шаги и ближайшая задача собраны в едином рабочем контексте.", image: "/assets/prototype/passport.png", imageWidth: 1254, imageHeight: 1254 },
  { id: "ai", label: "AI-маршрут", icon: Sparkles, title: "План запуска меняется вместе с проектом", text: "Навигатор учитывает ответы, активность и результат предыдущих шагов — и предлагает следующий обоснованный шаг.", image: "/assets/prototype/ai-route.png", imageWidth: 1672, imageHeight: 941 },
  { id: "knowledge", label: "Практические материалы", icon: BookOpen, title: "Материалы привязаны к конкретной задаче", text: "Шаблоны, разборы и короткие инструкции появляются в маршруте тогда, когда их можно применить.", image: "/assets/prototype/materials.png", imageWidth: 1254, imageHeight: 1254 },
  { id: "finance", label: "Финансовое действие", icon: Wallet, title: "От рекомендации — сразу к банковскому действию", text: "Приём оплаты, счёт или выплаты подключаются в приложении Альфа-Банка без разрыва пользовательского сценария.", image: "/assets/prototype/finance.png", imageWidth: 1672, imageHeight: 941 },
];

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
    <section id="how-it-works" className="bg-future-blue py-20 text-white laptop:py-24">
      <Container>
        <div className="grid gap-6 laptop:grid-cols-[1.05fr_0.95fr] laptop:items-end">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-future-green">Прототип</p>
            <h2 className="mt-4 max-w-[820px] text-[40px] font-bold leading-[0.98] tracking-[-0.045em] text-balance sm:text-[52px] laptop:text-[64px]">Весь путь проекта — в одном приложении</h2>
          </div>
          <p className="max-w-[570px] text-[16px] leading-6 text-white/75 laptop:justify-self-end">Паспорт хранит прогресс. AI предлагает следующий шаг. Знания и инструменты Альфы помогают выполнить его сразу.</p>
        </div>

        <div role="tablist" aria-label="Экраны приложения" className="mt-8 grid grid-cols-2 gap-1.5 rounded-[20px] bg-black/20 p-1.5 laptop:grid-cols-4">
          {screens.map((screen, index) => {
            const selected = screen.id === activeId;
            return (
              <button key={screen.id} id={`showcase-tab-${screen.id}`} type="button" role="tab" aria-selected={selected} aria-controls="showcase-panel" tabIndex={selected ? 0 : -1} onClick={() => setActiveId(screen.id)} onKeyDown={(event) => handleTabKeyDown(event, index)} className={`flex min-h-12 items-center justify-center gap-2 rounded-[15px] px-3 text-[12px] font-bold transition-colors min-[420px]:text-[13px] laptop:text-[14px] ${selected ? "bg-future-green text-black" : "text-white/75 hover:bg-white/10 hover:text-white"}`}>
                <screen.icon size={16} aria-hidden />{screen.label}
              </button>
            );
          })}
        </div>

        <div id="showcase-panel" role="tabpanel" aria-labelledby={`showcase-tab-${active.id}`} className="mt-6 grid overflow-hidden rounded-[28px] bg-[#134fc9] text-white laptop:min-h-[560px] laptop:grid-cols-[0.82fr_1.18fr]">
          <article className="flex flex-col justify-center p-7 sm:p-9 laptop:p-12">
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-future-green">{active.label}</p>
            <h3 className="mt-4 max-w-[560px] text-[30px] font-bold leading-[1.05] tracking-[-0.035em] laptop:text-[42px]">{active.title}</h3>
            <p className="mt-4 max-w-[540px] text-[15px] leading-6 text-white/65">{active.text}</p>
            <div className="mt-8 inline-flex w-fit items-center rounded-[12px] bg-future-purple px-4 py-2.5 text-[13px] font-bold text-white">Интерфейсный прототип</div>
          </article>

          <div className="relative flex min-h-[430px] items-center justify-center overflow-hidden bg-future-green p-5 sm:min-h-[500px] sm:p-8 laptop:min-h-[560px] laptop:p-10">
            <div aria-hidden className="absolute -right-8 top-0 text-[190px] font-black leading-none tracking-[-0.08em] text-future-purple/25">APP</div>
            <Image
              key={active.id}
              src={assetPath(active.image)}
              alt={`Интерфейс прототипа: ${active.label}`}
              width={active.imageWidth}
              height={active.imageHeight}
              className={`relative z-10 max-h-[500px] w-full object-contain drop-shadow-[0_28px_45px_rgba(0,0,0,0.2)] ${active.id === "passport" || active.id === "knowledge" ? "translate-y-9" : ""}`}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
