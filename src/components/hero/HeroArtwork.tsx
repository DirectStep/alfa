import Image from "next/image";
import { assetPath } from "@/lib/assetPath";

export function HeroArtwork() {
  return (
    <div className="relative min-h-[470px] laptop:min-h-[680px]">
      <div aria-hidden className="absolute right-8 top-10 text-[190px] font-black leading-none tracking-[-0.09em] text-white/10 laptop:right-12 laptop:top-8 laptop:text-[330px]">ДЕЛО</div>
      <Image src={assetPath("/assets/hero/hero-composition-mobile.png")} alt="Предпринимательница Альфа-Дело в окружении фирменных символов" fill priority sizes="(min-width: 1280px) 0px, 100vw" className="object-contain object-bottom laptop:hidden" />
      <Image src={assetPath("/assets/hero/hero-composition-desktop.png")} alt="Предпринимательница Альфа-Дело в окружении фирменных символов" fill priority sizes="(min-width: 1280px) 54vw, 0px" className="hidden scale-[1.08] object-contain object-bottom laptop:block" />
      <div className="absolute bottom-5 right-0 rounded-[14px] bg-future-purple px-4 py-3 text-[13px] font-bold text-white laptop:bottom-10 laptop:right-4">Идея → маршрут → действие</div>
    </div>
  );
}
