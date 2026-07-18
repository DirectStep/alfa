import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { assetPath } from "@/lib/assetPath";

const formats = [
  { title: "Разборы запусков", text: "Проверенные решения и ошибки предпринимателей", color: "bg-future-green" },
  { title: "Шаблоны для работы", text: "Расчёты, интервью и документы без старта с нуля", color: "bg-alfa-red" },
  { title: "Контакты по делу", text: "Люди с нужным опытом, компетенцией или запросом", color: "bg-future-purple" },
  { title: "Обратная связь", text: "Ответы участников в контексте вашей задачи", color: "bg-future-blue" },
];

export function CommunityPreviewSection() {
  return (
    <section id="community" className="bg-[#f3f3f5] py-16 laptop:py-24">
      <Container>
        <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-alfa-red">Сообщество и знания</p>
        <h2 className="mt-4 max-w-[980px] text-[40px] font-bold leading-[0.96] tracking-[-0.045em] sm:text-[56px] laptop:text-[68px]">Опыт тех, кто уже делает</h2>
        <p className="mt-5 max-w-[720px] text-[17px] leading-7 text-text-secondary">Практика других участников встроена в маршрут: не отдельная лента контента, а помощь в момент, когда она действительно нужна.</p>

        <div className="mt-10 grid gap-5 laptop:grid-cols-[0.78fr_1.22fr]">
          <div className="relative min-h-[420px] overflow-hidden rounded-[28px] bg-future-purple laptop:min-h-[530px] laptop:rounded-[34px]">
            <span aria-hidden className="absolute -right-5 top-5 text-[110px] font-black leading-none tracking-[-0.08em] text-white/15 sm:text-[150px]">VOLT</span>
            <Image src={assetPath("/assets/trust/support.png")} alt="Абстрактная 3D-композиция сообщества" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-contain p-7 pb-28 drop-shadow-2xl sm:p-10 sm:pb-32" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-7 pt-24 text-white">
              <p className="text-[12px] font-bold uppercase tracking-[0.07em] text-future-green">Живой опыт</p>
              <h3 className="mt-3 text-[30px] font-bold leading-none">Не теория.<br />Люди и их решения.</h3>
            </div>
          </div>

          <div className="divide-y divide-black/20 border-y border-black/20">
            {formats.map((item) => (
              <a key={item.title} href="https://directstep.github.io/concept/" className="group grid min-h-[128px] grid-cols-[38px_1fr_auto] items-center gap-4 py-5 sm:grid-cols-[46px_1fr_auto] sm:gap-6">
                <span className={`${item.color} h-8 w-8 skew-x-[-20deg] sm:h-10 sm:w-10`} aria-hidden />
                <span>
                  <strong className="block text-[22px] leading-none tracking-[-0.025em] sm:text-[26px]">{item.title}</strong>
                  <span className="mt-2 block text-[14px] leading-5 text-text-secondary">{item.text}</span>
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-black/25 transition-colors group-hover:bg-black group-hover:text-white"><ArrowUpRight size={18} /></span>
              </a>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
