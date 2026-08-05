import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { assetPath } from "@/lib/assetPath";

const items = [
  {
    title: "Банковская инфраструктура",
    subtitle: "Надежно и стабильно",
    img: assetPath("/assets/trust/banking.png"),
  },
  {
    title: "Защищенные платежи",
    subtitle: "Безопасность данных",
    img: assetPath("/assets/trust/security.png"),
  },
  {
    title: "Сопровождение",
    subtitle: "Поддержка на каждом этапе",
    img: assetPath("/assets/trust/support.png"),
  },
];

export function TrustCards() {
  return (
    <section className="pt-[88px] laptop:pt-[104px]">
      <Container>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {items.map((item) => (
            <li
              key={item.title}
              className="group flex min-h-[124px] items-center gap-4 rounded-[22px] bg-surface p-5 transition-colors duration-200 hover:bg-border/60"
            >
              <Image
                src={item.img}
                alt=""
                width={80}
                height={80}
                className="h-16 w-16 shrink-0 object-contain"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-bold leading-snug">
                  {item.title}
                </p>
                <p className="mt-1 text-[13px] text-text-secondary">
                  {item.subtitle}
                </p>
              </div>
              <ChevronRight
                size={20}
                className="shrink-0 text-text-secondary transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden
              />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
