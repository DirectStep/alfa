"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { navLinks } from "@/data/nav";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-md border-b border-border"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <Container className="flex h-20 items-center justify-between">
        <a href="#top" className="text-lg font-bold tracking-tight">
          Альфа Дело
        </a>

        <nav className="hidden laptop:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[15px] text-text-primary hover:text-alfa-red transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden laptop:block">
          <Button variant="primary">Присоединиться</Button>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="laptop:hidden inline-flex h-11 w-11 items-center justify-center rounded-full border border-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alfa-red"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </Container>

      {menuOpen && (
        <div className="laptop:hidden border-t border-border bg-white">
          <Container className="flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-3 text-[15px] hover:bg-surface"
              >
                {link.label}
              </a>
            ))}
            <Button variant="primary" className="mt-2 w-full">
              Присоединиться
            </Button>
          </Container>
        </div>
      )}
    </header>
  );
}
