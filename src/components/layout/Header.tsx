"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { AlfaLogo } from "@/components/ui/AlfaLogo";
import { navLinks } from "@/data/nav";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative z-50 bg-white">
      <Container className="flex h-[68px] items-center justify-between laptop:h-[72px]">
        <a href="#top" className="flex items-center gap-3" aria-label="Альфа-Дело — в начало страницы">
          <AlfaLogo className="text-alfa-red" height={28} />
          <span className="text-[17px] font-bold tracking-tight">Альфа-Дело</span>
        </a>

        <nav className="hidden items-center gap-7 laptop:flex" aria-label="Основная навигация">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-[14px] font-medium transition-colors hover:text-alfa-red">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden laptop:block">
          <Button variant="primary" size="sm" href="#scenario">Собрать пример маршрута</Button>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alfa-red laptop:hidden"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </Container>

      {menuOpen && (
        <div className="border-t border-border bg-white laptop:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 text-[15px] hover:bg-surface">
                {link.label}
              </a>
            ))}
            <Button variant="primary" href="#scenario" className="mt-2 w-full" onClick={() => setMenuOpen(false)}>
              Собрать пример маршрута
            </Button>
          </Container>
        </div>
      )}
    </header>
  );
}
