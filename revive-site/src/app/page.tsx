import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import TransactionScene from "@/components/transaction-scene";
import ContextSection from "@/components/context-section";
import BlindRetry from "@/components/blind-retry";
import AgentSection from "@/components/agent-section";
import DecisionEngine from "@/components/decision-engine";
import RecoveryStrategy from "@/components/recovery-strategy";
import Guardrails from "@/components/guardrails";
import RecoveryScene from "@/components/recovery-scene";
import ImpactSection from "@/components/impact-section";
import BuildStory from "@/components/build-story";
import DeveloperSection from "@/components/developer-section";
import IntelligenceSection from "@/components/intelligence-section";
import Faq from "@/components/faq";
import FinalCta from "@/components/final-cta";
import Footer from "@/components/footer";
import SmoothScroll from "@/components/smooth-scroll";
import CinemaBars from "@/components/cinema/cinema-bars";
import CinemaCursor from "@/components/cinema/cinema-cursor";
import GradientMeshLazy from "@/components/cinema/gradient-mesh-lazy";


export default function Home() {
  return (
    <SmoothScroll>
      <div className="grain relative">
        <GradientMeshLazy />
        <div className="vignette-cinema" aria-hidden />
        <CinemaBars />
        <CinemaCursor />
        <div className="relative z-10">
          <Navbar />
          <main>
            {/* COLOR ARC: cool failure → copper understanding → amber recovery */}
            {/* FAILED → WHY → CONTEXT → DIAGNOSE → CHOOSE → GUARDRAILS → EXECUTE → RECOVER → LEARN */}
            <Hero />
            <TransactionScene />
            <ContextSection />
            <BlindRetry />
            <AgentSection />
            <DecisionEngine />
            <RecoveryStrategy />
            <Guardrails />
            <RecoveryScene />
            <ImpactSection />
            <BuildStory />
            <DeveloperSection />
            <IntelligenceSection />
            <Faq />
            <FinalCta />
          </main>
          <Footer />
        </div>
      </div>
    </SmoothScroll>
  );
}
