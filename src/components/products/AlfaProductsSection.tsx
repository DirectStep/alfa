import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { alfaProductLinks } from "@/data/alfaProducts";

export function AlfaProductsSection() {
  return (
    <section id="products" className="py-10 laptop:py-14">
      <Container>
        <h2 className="text-[32px] font-bold laptop:text-[40px]">
          Инструменты Альфа-Банка внутри платформы
        </h2>

        <ul className="mt-8 flex flex-col gap-3">
          {alfaProductLinks.map((link) => (
            <li
              key={link.id}
              className="flex flex-col gap-2 rounded-[20px] border border-border bg-white p-5 laptop:flex-row laptop:items-center laptop:justify-between"
            >
              <span className="text-[16px] font-medium">{link.situation}</span>
              <span className="flex items-center gap-2 text-[16px] font-bold text-alfa-red">
                <ArrowRight size={18} className="shrink-0" aria-hidden="true" />
                {link.tool}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-6 max-w-2xl text-[14px] text-text-secondary">
          Все финансовые действия выполняются в защищённом приложении
          Альфа-Банка.
        </p>
      </Container>
    </section>
  );
}
