import { useState } from "react";
import { BookingForm } from "../components/BookingForm.tsx";
import { FAQ, HowItWorks, WhyChooseUs } from "../components/InfoSections.tsx";
import { Hero, ServiceCards } from "../components/ServicesAndHero.tsx";
import { Footer, Header } from "../components/SiteChrome.tsx";
import { StickyCta } from "../components/StickyCta.tsx";
import { BookingDraftProvider } from "../context/BookingDraft.tsx";

export function HomePage() {
  const [completed, setCompleted] = useState(false);
  return (
    <BookingDraftProvider>
      <div id="top" className="home-shell pb-24 lg:pb-0">
        <a className="skip-link" href="#calculator">
          Към калкулатора
        </a>
        <Header onHome />
        <main>
          <Hero />
          <ServiceCards />
          <HowItWorks />
          <WhyChooseUs />
          <BookingForm onComplete={setCompleted} />
          <FAQ />
        </main>
        <Footer onHome />
        <StickyCta paused={completed} />
      </div>
    </BookingDraftProvider>
  );
}
