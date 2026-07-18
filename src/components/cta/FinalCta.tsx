import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { assetPath } from "@/lib/assetPath";

export function FinalCta() {
  return (
    <section className="bg-black py-4">
      <Container>
        <div className="relative min-h-[520px] overflow-hidden rounded-[30px] bg-future-blue text-white laptop:rounded-[40px]">
          <div className="relative z-20 flex min-h-[520px] max-w-[760px] flex-col justify-center p-7 sm:p-10 laptop:p-14">
            <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-future-green">Альфа-Дело</p>
            <h2 className="mt-4 text-[44px] font-bold leading-[0.92] tracking-[-0.055em] sm:text-[62px] laptop:text-[82px]">Есть идея?<br />Пора в дело.</h2>
            <p className="mt-6 max-w-[540px] text-[17px] leading-7 text-white/75">Ответьте на несколько вопросов и получите первый рабочий маршрут — от задачи до конкретного действия.</p>
            <a href="#scenario" className="mt-8 inline-flex w-fit items-center gap-3 rounded-full bg-future-green px-6 py-4 text-[15px] font-bold text-black transition-transform hover:-translate-y-1">
              Собрать маршрут <ArrowUpRight size={18} />
            </a>
          </div>
          <span className="pointer-events-none absolute -bottom-8 right-0 z-0 text-[170px] font-black leading-none tracking-[-0.08em] text-white/10 sm:text-[260px]">GO</span>
          <Image src={assetPath("/assets/cards/benefit-ai.png")} alt="" width={900} height={900} className="pointer-events-none absolute -bottom-[22%] -right-[20%] z-10 w-[78%] max-w-[740px] object-contain drop-shadow-2xl" />
        </div>
      </Container>
    </section>
  );
}
