import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/hero/HeroSection";
import { ScenarioPicker } from "@/components/scenario/ScenarioPicker";
import { BenefitCards } from "@/components/benefits/BenefitCards";
import { ProcessLine } from "@/components/process/ProcessLine";
import { PlatformFeatures } from "@/components/platform/PlatformFeatures";
import { AiAssistantSection } from "@/components/ai/AiAssistantSection";
import { AlfaProductsSection } from "@/components/products/AlfaProductsSection";
import { CommunityFeedPreview } from "@/components/community/CommunityFeedPreview";
import { BankValueSection } from "@/components/bank-value/BankValueSection";
import { FinalCta } from "@/components/cta/FinalCta";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <ScenarioPicker />
        <BenefitCards />
        <ProcessLine />
        <PlatformFeatures />
        <AiAssistantSection />
        <AlfaProductsSection />
        <CommunityFeedPreview />
        <BankValueSection />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
