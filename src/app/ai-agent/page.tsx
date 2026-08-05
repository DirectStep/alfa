import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { AiAgentPrototype } from "@/components/ai-agent/AiAgentPrototype";
import { assetPath } from "@/lib/assetPath";

export const metadata: Metadata = {
  title: "AI-агент — Альфа-Дело",
  description: "Интерактивный прототип AI-навигатора для первого шага молодого предпринимателя.",
};

export default function AiAgentPage() {
  return (
    <>
      <Header homeHref={assetPath("/")} ctaHref={assetPath("/")} ctaLabel="На главную" showNavigation={false} />
      <main>
        <AiAgentPrototype />
      </main>
    </>
  );
}
