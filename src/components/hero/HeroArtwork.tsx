import Image from "next/image";
import { HeroFeatureCards } from "./HeroFeatureCards";
import { ParallaxLayer } from "@/components/ui/ParallaxLayer";

export function HeroArtwork() {
  return (
    <div className="flex flex-col gap-4 laptop:flex-row laptop:items-start">
      <div
        className="relative aspect-[941/1672] w-full overflow-hidden rounded-[32px] border border-border bg-surface laptop:aspect-[1272/1237] laptop:flex-1"
        style={{
          backgroundImage:
            "radial-gradient(var(--border-color) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      >
        <div className="animate-float-slow absolute inset-0">
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
              sizes="(min-width: 1280px) 45vw, 0px"
              className="hidden object-contain object-center laptop:block"
            />
          </ParallaxLayer>
        </div>
      </div>

      <HeroFeatureCards />
    </div>
  );
}
