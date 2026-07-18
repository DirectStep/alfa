import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/hero/HeroSection";
import { AppShowcaseCarousel } from "@/components/showcase/AppShowcaseCarousel";
import { ScenarioPicker } from "@/components/scenario/ScenarioPicker";
import { AiNavigatorSection } from "@/components/ai/AiNavigatorSection";
import { FinancialToolsSection } from "@/components/financial/FinancialToolsSection";
import { CommunityPreviewSection } from "@/components/community/CommunityPreviewSection";
import { PilotGoalsSection } from "@/components/pilot/PilotGoalsSection";
import { FinalCta } from "@/components/cta/FinalCta";
import { Reveal } from "@/components/ui/Reveal";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <Reveal>
          <ScenarioPicker />
        </Reveal>
        <Reveal>
          <AppShowcaseCarousel />
        </Reveal>
        <Reveal>
          <AiNavigatorSection />
        </Reveal>
        <Reveal>
          <FinancialToolsSection />
        </Reveal>
        <Reveal>
          <CommunityPreviewSection />
        </Reveal>
        <Reveal>
          <PilotGoalsSection />
        </Reveal>
        <Reveal>
          <FinalCta />
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
