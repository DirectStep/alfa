import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AlphaPartnerPrototype } from "@/components/ai-agent/AlphaPartnerPrototype";
import { AiAgentHowItWorks } from "@/components/ai-agent/AiAgentHowItWorks";
import { assetPath } from "@/lib/assetPath";

export const metadata: Metadata = {
  title: "Альфа-Партнёр — AI-команда для бизнеса",
  description: "Альфа-Партнёр изучает бизнес, подбирает AI-команду и помогает делегировать задачи профильным агентам.",
};

export default function AiAgentPage() {
  return (
    <>
      <Header homeHref={assetPath("/")} ctaHref={assetPath("/")} ctaLabel="На главную" showNavigation={false} />
      <main>
        <AlphaPartnerPrototype />
        <AiAgentHowItWorks />
      </main>
      <Footer homeHref={assetPath("/")} sectionHrefPrefix={assetPath("/")} />
    </>
  );
}
