import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { assetPath } from "@/lib/assetPath";

export function FinalCta() {
  return (
    <section className="pt-20 laptop:pt-24">
      <Container>
        <div className="grid overflow-hidden rounded-[28px] bg-[#171719] text-white laptop:min-h-[420px] laptop:grid-cols-[1.05fr_0.95fr] laptop:rounded-[32px]">
          <div className="flex flex-col justify-center p-7 sm:p-9 laptop:p-12">
            <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-alfa-red">Альфа-Дело</p>
            <h2 className="mt-4 max-w-[650px] text-[32px] font-bold leading-[1.1] tracking-[-0.02em] laptop:text-[40px] laptop:leading-[1.2]">Начните с задачи, которая важна вашему проекту сейчас</h2>
            <p className="mt-4 max-w-[560px] text-[15px] leading-6 text-white/65">Ответьте на несколько вопросов и получите первый вариант маршрута — без лишних разделов и общих рекомендаций.</p>
            <div className="mt-7"><Button variant="primary" href="#scenario">Собрать пример маршрута</Button></div>
          </div>
          <div className="relative min-h-[340px] bg-white">
            <Image src={assetPath("/assets/official/feature-2.webp")} alt="Цифровые продукты Альфа-Банка" fill sizes="(min-width: 1280px) 42vw, 100vw" className="object-cover object-center" />
          </div>
        </div>
      </Container>
    </section>
  );
}
