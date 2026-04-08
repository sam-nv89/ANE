import React from 'react';

import Hero from '../../components/Hero';
import Engine from '../../components/Engine';
import ProblemSolution from '../../components/ProblemSolution';
import Metrics from '../../components/Metrics';
import Footer from '../../components/Footer';

/**
 * LandingPage — assembles all public landing sections.
 * CTA button в Hero теперь ведёт в /app/onboarding через navigate().
 */
export default function LandingPage() {
  return (
    <div className="app">
      <Hero />
      <Engine />
      <ProblemSolution />
      <Metrics />
      <Footer />
    </div>
  );
}
