import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export function FinalCta() {
  return (
    <section className="py-10 laptop:py-14">
      <Container>
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-alfa-red to-pink px-6 py-10 laptop:px-14 laptop:py-14">
          <div className="flex flex-col gap-8 laptop:flex-row laptop:items-center laptop:justify-between">
            <div className="relative z-10 laptop:max-w-md">
              <h2 className="text-[36px] font-black leading-[0.98] text-white laptop:text-[52px]">
                Запускайте
                <br />
                свое дело с Альфой
              </h2>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button variant="dark">Присоединиться</Button>
                <Button
                  variant="secondary"
                  className="border-white/40 bg-white text-text-primary hover:border-white"
                >
                  Посмотреть демо
                </Button>
              </div>
            </div>

            <div className="animate-float-slow relative mx-auto h-[280px] w-[240px] shrink-0 laptop:h-[340px] laptop:w-[300px]">
              <Image
                src="/assets/hero/hero-composition-desktop.png"
                alt=""
                fill
                sizes="300px"
                className="object-contain object-bottom"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
