import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { assetPath } from "@/lib/assetPath";

const tools = [
  { stage: "Первые продажи", title: "Принять первую оплату", text: "Ссылка, QR-код или СБП появляются именно тогда, когда проект готов продавать.", word: "PAY", tone: "bg-future-green text-black", image: "/assets/platform/profile.png" },
  { stage: "Регулярная работа", title: "Разделить личные и бизнес-финансы", text: "Счёт и ежедневные операции подключаются без погружения в банковский каталог.", word: "BIZ", tone: "bg-future-purple text-white", image: "/assets/platform/knowledge.png" },
  { stage: "Рост команды", title: "Настроить выплаты и расходы", text: "Инструменты контроля и выплат становятся частью следующего этапа роста.", word: "TEAM", tone: "bg-future-blue text-white", image: "/assets/platform/opportunities.png" },
];

export function FinancialToolsSection() {
  return (
    <section id="products" className="py-16 laptop:py-24">
      <Container>
        <div className="grid gap-6 laptop:grid-cols-[1fr_0.55fr] laptop:items-end">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-alfa-red">Альфа-Банк внутри маршрута</p>
            <h2 className="mt-4 max-w-[900px] text-[40px] font-bold leading-[0.96] tracking-[-0.045em] sm:text-[56px] laptop:text-[68px]">Финансы появляются вовремя</h2>
          </div>
          <p className="text-[17px] leading-6 text-text-secondary">Не каталог продуктов, а конкретное действие для текущей стадии бизнеса.</p>
        </div>

        <ul className="mt-10 grid gap-4 laptop:grid-cols-3">
          {tools.map((tool) => (
            <li key={tool.title} className={`${tool.tone} group relative min-h-[480px] overflow-hidden rounded-[28px] p-7 laptop:rounded-[34px]`}>
              <div className="relative z-10">
                <p className="text-[12px] font-bold uppercase tracking-[0.07em] opacity-65">{tool.stage}</p>
                <h3 className="mt-4 max-w-[350px] text-[28px] font-bold leading-[1.02] tracking-[-0.03em]">{tool.title}</h3>
                <p className="mt-4 max-w-[360px] text-[15px] leading-5 opacity-70">{tool.text}</p>
              </div>
              <span className="pointer-events-none absolute bottom-4 left-4 text-[112px] font-black leading-none tracking-[-0.08em] opacity-15 sm:text-[136px]">{tool.word}</span>
              <Image src={assetPath(tool.image)} alt="" width={620} height={500} className="absolute -bottom-[5%] -right-[12%] h-[48%] w-[70%] object-contain transition-transform duration-500 group-hover:-translate-y-2 group-hover:rotate-2" />
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-center gap-2.5 text-text-secondary">
          <ShieldCheck size={18} className="shrink-0 text-alfa-red" aria-hidden />
          <p className="text-[14px]">Все финансовые операции проходят в защищённом приложении Альфа-Банка.</p>
        </div>
      </Container>
    </section>
  );
}
