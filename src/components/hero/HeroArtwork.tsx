import Image from "next/image";
import { assetPath } from "@/lib/assetPath";

export function HeroArtwork() {
  return (
    <div className="relative min-h-[420px] overflow-hidden bg-alfa-red laptop:min-h-[570px]">
      <Image
        src={assetPath("/assets/hero/hero-composition-mobile.png")}
        alt="Предпринимательница Альфа-Дело в окружении фирменных символов"
        fill
        priority
        sizes="(min-width: 1280px) 0px, 100vw"
        className="object-contain object-bottom laptop:hidden"
      />
      <Image
        src={assetPath("/assets/hero/hero-composition-desktop.png")}
        alt="Предпринимательница Альфа-Дело в окружении фирменных символов"
        fill
        priority
        sizes="(min-width: 1280px) 44vw, 0px"
        className="hidden object-contain object-bottom laptop:block"
      />
      <div className="absolute bottom-5 left-5 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-black shadow-sm laptop:bottom-7 laptop:left-7">
        Маршрут обновляется вместе с проектом
      </div>
    </div>
  );
}
