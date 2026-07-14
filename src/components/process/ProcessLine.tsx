import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { processSteps } from "@/data/process";

export function ProcessLine() {
  return (
    <section className="py-10 laptop:py-14">
      <Container>
        <div className="flex gap-4 overflow-x-auto rounded-[28px] border border-border bg-white px-6 py-8 snap-x snap-mandatory laptop:justify-center laptop:overflow-visible">
          {processSteps.map((step, index) => (
            <div key={step.id} className="flex shrink-0 items-center gap-4 snap-start">
              <span className="text-[22px] font-bold laptop:text-[30px]">
                {step.label}
              </span>
              {index < processSteps.length - 1 && (
                <ArrowRight
                  className="shrink-0 text-alfa-red"
                  size={28}
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
