import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/hero/HeroSection";
import { ScenarioPicker } from "@/components/scenario/ScenarioPicker";
import { BenefitCards } from "@/components/benefits/BenefitCards";
import { ProcessLine } from "@/components/process/ProcessLine";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <ScenarioPicker />
        <BenefitCards />
        <ProcessLine />
      </main>
    </>
  );
}
