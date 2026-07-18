import Image from "next/image";
import { assetPath } from "@/lib/assetPath";

export function HeroArtwork() {
  return (
    <div className="relative min-h-[420px] overflow-hidden bg-alfa-red laptop:min-h-[570px]">
      <Image
        src={assetPath("/assets/official/student.webp")}
        alt="Молодой предприниматель с планшетом"
        fill
        priority
        sizes="(min-width: 1280px) 44vw, 100vw"
        className="object-cover object-center"
      />
      <div className="absolute bottom-5 left-5 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-black shadow-sm laptop:bottom-7 laptop:left-7">
        Маршрут обновляется вместе с проектом
      </div>
    </div>
  );
}
