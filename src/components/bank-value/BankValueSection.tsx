import { ShieldCheck, Landmark, Headset } from "lucide-react";
import { Container } from "@/components/ui/Container";

const trustPoints = [
  {
    icon: ShieldCheck,
    title: "Настоящий банковский счёт",
    description: "Инструменты работают на инфраструктуре Альфа-Банка",
  },
  {
    icon: Landmark,
    title: "Лицензированные платежи",
    description: "Приём оплаты и выплаты — в рамках банковского регулирования",
  },
  {
    icon: Headset,
    title: "Поддержка рядом",
    description: "Сообщество, наставники и помощь на каждом этапе",
  },
];

export function BankValueSection() {
  return (
    <section className="py-10 laptop:py-14">
      <Container>
        <div className="grid grid-cols-1 gap-5 rounded-[28px] bg-surface p-6 md:grid-cols-3 laptop:p-10">
          {trustPoints.map((point) => (
            <div key={point.title}>
              <point.icon size={24} className="text-alfa-red" aria-hidden="true" />
              <h3 className="mt-3 text-[17px] font-bold">{point.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
