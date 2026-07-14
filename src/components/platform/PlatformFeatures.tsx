import {
  Users,
  BookOpen,
  GraduationCap,
  Network,
  Sparkles,
  UserCircle,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { platformFeatures } from "@/data/platformFeatures";

const icons: Record<string, LucideIcon> = {
  community: Users,
  knowledge: BookOpen,
  courses: GraduationCap,
  network: Network,
  opportunities: Sparkles,
  profile: UserCircle,
};

export function PlatformFeatures() {
  return (
    <section id="platform" className="py-10 laptop:py-14">
      <Container>
        <h2 className="text-[32px] font-bold laptop:text-[40px]">
          Что внутри платформы
        </h2>

        <ul className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 laptop:grid-cols-3">
          {platformFeatures.map((feature) => {
            const Icon = icons[feature.iconKey];
            return (
              <li
                key={feature.id}
                className="rounded-[24px] border border-border bg-white p-6"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface">
                  <Icon size={20} className="text-alfa-red" />
                </span>
                <h3 className="mt-4 text-[19px] font-bold">{feature.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">
                  {feature.description}
                </p>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
