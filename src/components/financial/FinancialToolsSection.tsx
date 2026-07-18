import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { assetPath } from "@/lib/assetPath";

const tools = [
  { stage: "Первые продажи", title: "Принять первую оплату", text: "Ссылка, QR-код или СБП — подходящий способ появляется в маршруте запуска.", image: "/assets/official/feature-1.webp" },
  { stage: "Стабильные операции", title: "Разделить личные и бизнес-финансы", text: "Счёт и ежедневные операции подключаются, когда проект готов к регулярным расчётам.", image: "/assets/official/feature-2.webp" },
  { stage: "Рост команды", title: "Настроить выплаты и расходы", text: "Инструменты для выплат, контроля операций и дальнейшего масштабирования.", image: "/assets/official/feature-3.webp" },
];

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
              <div className="relative h-[235px] overflow-hidden bg-white">
                <Image src={assetPath(tool.image)} alt="" fill sizes="(min-width: 1280px) 33vw, 100vw" className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]" />
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
