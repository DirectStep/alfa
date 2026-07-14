import { Container } from "@/components/ui/Container";
import { navLinks } from "@/data/nav";

export function Footer() {
  return (
    <footer id="about" className="border-t border-border py-10 laptop:py-14">
      <Container className="flex flex-col gap-8 laptop:flex-row laptop:items-start laptop:justify-between">
        <div className="max-w-sm">
          <p className="text-lg font-bold">Альфа Дело</p>
          <p className="mt-3 text-[14px] leading-relaxed text-text-secondary">
            Сообщество, знания, AI-помощник и инструменты Альфа-Банка для
            молодых предпринимателей 17-25 лет.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-3">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[14px] text-text-secondary hover:text-text-primary transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </Container>

      <Container className="mt-10">
        <p className="text-[13px] text-text-secondary">
          © {new Date().getFullYear()} Альфа Дело. Проект Альфа-Банка.
        </p>
      </Container>
    </footer>
  );
}
