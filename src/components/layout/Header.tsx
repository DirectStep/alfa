"use client";

import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { navLinks } from "@/data/nav";
import { assetPath } from "@/lib/assetPath";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative z-50 bg-alfa-red text-white">
      <Container className="flex h-[76px] items-center justify-between laptop:h-[84px]">
        <a href="#top" className="flex items-center gap-3" aria-label="Альфа-Будущее и Альфа-Дело, в начало страницы">
          <Image src={assetPath("/assets/brand/alfa-future.svg")} alt="Альфа-Будущее" width={701} height={250} priority className="h-10 w-auto laptop:h-12" />
          <span className="text-[15px] font-semibold tracking-[-0.03em] text-white laptop:text-[17px]">Альфа-Дело</span>
        </a>

        <nav className="hidden items-center gap-7 laptop:flex" aria-label="Основная навигация">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-[14px] font-semibold transition-opacity hover:opacity-65">{link.label}</a>
          ))}
        </nav>

        <a href="https://directstep.github.io/concept" className="hidden h-11 items-center rounded-[12px] bg-white px-5 text-[14px] font-bold text-black transition-transform hover:-translate-y-0.5 laptop:inline-flex">Собрать маршрут</a>

        <button type="button" aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white laptop:hidden">
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </Container>

      {menuOpen && (
        <div className="border-t border-white/20 bg-alfa-red laptop:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 text-[15px] font-semibold hover:bg-white/10">{link.label}</a>
            ))}
            <a href="https://directstep.github.io/concept" onClick={() => setMenuOpen(false)} className="mt-2 flex h-12 items-center justify-center rounded-[12px] bg-white text-[14px] font-bold text-black">Собрать маршрут</a>
          </Container>
        </div>
      )}
    </header>
  );
}
