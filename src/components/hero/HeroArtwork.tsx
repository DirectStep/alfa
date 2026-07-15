import Image from "next/image";
import { ParallaxLayer } from "@/components/ui/ParallaxLayer";

export function HeroArtwork() {
  return (
    <div className="relative aspect-[941/1672] w-full laptop:aspect-auto laptop:h-full laptop:min-h-[520px]">
      <div className="animate-float-slow absolute inset-0 laptop:-inset-8">
        <ParallaxLayer strength={5}>
          <Image
            src="/assets/hero/hero-composition-mobile.png"
            alt="Молодая предпринимательница в фирменной красной куртке Альфа Дело среди букв, звезды и орбиты"
            fill
            priority
            sizes="(min-width: 1280px) 0px, 100vw"
            className="object-contain object-center laptop:hidden"
          />
          <Image
            src="/assets/hero/hero-composition-desktop.png"
            alt="Молодая предпринимательница в фирменной красной куртке Альфа Дело среди букв, звезды и орбиты"
            fill
            priority
            sizes="(min-width: 1280px) 40vw, 0px"
            className="hidden object-contain object-center laptop:block"
          />
        </ParallaxLayer>
      </div>
    </div>
  );
}
