"use client";

import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { navLinks } from "@/data/nav";
import { assetPath } from "@/lib/assetPath";

type HeaderProps = {
  homeHref?: string;
  ctaHref?: string;
  ctaLabel?: string;
  showNavigation?: boolean;
};

export function Header({
  homeHref = "#top",
  ctaHref = "https://directstep.github.io/concept/",
  ctaLabel = "Собрать маршрут",
  showNavigation = true,
}: HeaderProps = {}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative z-50 bg-alfa-red text-white">
      <Container className="flex h-[92px] items-center justify-between laptop:h-[104px]">
        <a href={homeHref} className="flex shrink-0 items-center" aria-label="Альфа-Будущее и Альфа-Дело, в начало страницы">
          <Image src={assetPath("/assets/brand/alfa-future-x-delo-final.png")} alt="Альфа-Будущее × Альфа-Дело" width={1280} height={427} priority unoptimized sizes="(min-width: 1280px) 270px, 240px" className="h-20 w-auto laptop:h-[90px]" />
        </a>

        {showNavigation && <nav className="hidden items-center gap-7 laptop:flex" aria-label="Основная навигация">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-[14px] font-semibold transition-opacity hover:opacity-65">{link.label}</a>
          ))}
        </nav>}

        <div className="hidden items-center gap-2 laptop:flex">
          {showNavigation && <a href={assetPath("/ai-agent")} className="inline-flex h-11 items-center rounded-[12px] bg-future-green px-5 text-[14px] font-bold text-black transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">ИИ-Агент</a>}
          <a href={ctaHref} className="inline-flex h-11 items-center rounded-[12px] bg-white px-5 text-[14px] font-bold text-black transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{ctaLabel}</a>
        </div>

        <button type="button" aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white laptop:hidden">
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </Container>

      {menuOpen && (
        <div className="border-t border-white/20 bg-alfa-red laptop:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {showNavigation && navLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 text-[15px] font-semibold hover:bg-white/10">{link.label}</a>
            ))}
            {showNavigation && <a href={assetPath("/ai-agent")} onClick={() => setMenuOpen(false)} className="mt-2 flex h-12 items-center justify-center rounded-[12px] bg-future-green text-[14px] font-bold text-black">ИИ-Агент</a>}
            <a href={ctaHref} onClick={() => setMenuOpen(false)} className={`${showNavigation ? "mt-1" : "mt-2"} flex h-12 items-center justify-center rounded-[12px] bg-white text-[14px] font-bold text-black`}>{ctaLabel}</a>
          </Container>
        </div>
      )}
    </header>
  );
}
