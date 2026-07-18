import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { assetPath } from "@/lib/assetPath";

const footerLinks = [
  { label: "Как работает", href: "#how-it-works" },
  { label: "Маршрут", href: "#scenario" },
  { label: "Инструменты", href: "#products" },
  { label: "Практика", href: "#community" },
];

export function Footer() {
  return (
    <footer id="about" className="bg-black py-10 text-white laptop:py-14">
      <Container>
        <p className="max-w-[1500px] text-[clamp(48px,9vw,156px)] font-black leading-[0.86] tracking-[-0.075em] text-white">
          Концепт команды VOLT
        </p>
        <div className="mt-12 flex flex-col gap-9 border-t border-white/20 pt-8 laptop:mt-16 laptop:flex-row laptop:items-center laptop:justify-between">
          <a href="#top" className="flex items-center gap-3">
            <Image src={assetPath("/assets/brand/alfa-future.svg")} alt="Альфа-Будущее" width={701} height={250} className="h-11 w-auto" />
            <span className="text-[18px] font-black tracking-[-0.04em]">Альфа-Дело</span>
          </a>
          <nav className="flex flex-wrap gap-x-6 gap-y-3" aria-label="Навигация в подвале">
            {footerLinks.map((link) => <a key={link.label} href={link.href} className="text-[14px] text-white/60 transition-colors hover:text-future-green">{link.label}</a>)}
          </nav>
          <p className="max-w-[280px] text-[12px] leading-5 text-white/50 laptop:text-right">Сервис для молодых предпринимателей.</p>
        </div>
      </Container>
    </footer>
  );
}
