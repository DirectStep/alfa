import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { processSteps } from "@/data/process";

export function ProcessLine() {
  return (
    <section className="pt-6 pb-0 laptop:pt-8">
      <Container>
        <div className="flex items-center gap-4 overflow-x-auto rounded-[26px] border border-border bg-white px-6 py-6 snap-x snap-mandatory laptop:justify-between laptop:overflow-visible laptop:px-9">
          {processSteps.map((step, index) => (
            <div key={step.id} className="flex shrink-0 items-center gap-4 snap-start">
              <span className="text-[20px] font-bold laptop:text-[26px]">
                {step.label}
              </span>
              {index < processSteps.length - 1 && (
                <ArrowRight
                  className="shrink-0 text-alfa-red"
                  size={20}
                  strokeWidth={1.75}
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
