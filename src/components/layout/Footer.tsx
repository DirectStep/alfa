import { Container } from "@/components/ui/Container";
import { AlfaLogo } from "@/components/ui/AlfaLogo";

const footerLinks = [
  { label: "Как работает", href: "#how-it-works" },
  { label: "Маршрут", href: "#scenario" },
  { label: "Инструменты", href: "#products" },
  { label: "Практика", href: "#community" },
];

export function Footer() {
  return (
    <footer id="about" className="mt-20 border-t border-border py-8 laptop:mt-24 laptop:py-10">
      <Container className="flex flex-col gap-7 laptop:flex-row laptop:items-center laptop:justify-between">
        <a href="#top" className="flex items-center gap-3">
          <AlfaLogo className="text-alfa-red" height={26} />
          <span className="text-[17px] font-bold tracking-tight">Альфа-Дело</span>
        </a>
        <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Навигация в подвале">
          {footerLinks.map((link) => (
            <a key={link.label} href={link.href} className="text-[14px] text-text-secondary transition-colors hover:text-text-primary">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="laptop:text-right">
          <p className="text-[14px] font-semibold">Проект команды VOLT</p>
          <p className="mt-1 text-[12px] text-text-secondary">Концепция цифрового сервиса для молодых предпринимателей.</p>
        </div>
      </Container>
    </footer>
  );
}
