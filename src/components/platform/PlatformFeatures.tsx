import Image from "next/image";
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

const variantClasses = {
  red: "bg-alfa-red text-white",
  lavender: "bg-lavender text-text-primary",
  soft: "bg-surface text-text-primary",
  black: "bg-black text-white",
  pink: "bg-pink text-text-primary",
  "light-green": "bg-light-green text-text-primary",
} as const;

const iconWrapClasses = {
  red: "bg-white/15 text-white",
  lavender: "bg-white/50 text-alfa-red",
  soft: "bg-white text-alfa-red",
  black: "bg-white/10 text-white",
  pink: "bg-white/40 text-text-primary",
  "light-green": "bg-white/50 text-text-primary",
} as const;

export function PlatformFeatures() {
  return (
    <section id="platform" className="pt-20 pb-10 laptop:pt-24 laptop:pb-14">
      <Container>
        <h2 className="text-[36px] font-bold laptop:text-[48px]">
          Что внутри платформы
        </h2>

        <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 laptop:grid-cols-3 laptop:gap-5">
          {platformFeatures.map((feature) => {
            const Icon = icons[feature.iconKey];
            return (
              <li
                key={feature.id}
                className={`relative flex min-h-[250px] flex-col justify-between overflow-hidden rounded-[26px] p-6 transition-transform duration-300 hover:-translate-y-1 laptop:min-h-[270px] ${variantClasses[feature.variant]}`}
              >
                <div className="relative z-10 max-w-[65%]">
                  <h3 className="text-[21px] font-bold leading-snug">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed opacity-75">
                    {feature.description}
                  </p>
                </div>

                {feature.image ? (
                  <div className="absolute -right-2 bottom-0 h-[88%] w-[55%]">
                    <Image
                      src={feature.image}
                      alt=""
                      fill
                      sizes="(min-width: 1280px) 22vw, (min-width: 768px) 33vw, 60vw"
                      className="object-contain object-bottom"
                    />
                  </div>
                ) : (
                  <span
                    className={`absolute bottom-5 right-5 inline-flex h-24 w-24 items-center justify-center rounded-full ${iconWrapClasses[feature.variant]}`}
                  >
                    <Icon size={44} strokeWidth={1.6} />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
