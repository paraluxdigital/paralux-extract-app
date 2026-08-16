import React from 'react';
import { Hero } from './Hero';
import { FeaturesShowcase } from './FeaturesShowcase';
import { PricingCalculator } from './PricingCalculator';
import { ApiDocs } from './ApiDocs';
import { CodeExporter } from './CodeExporter';

interface LandingPageProps {
  onOpenPortal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenPortal }) => {
  const scrollToPricing = () => {
    const element = document.getElementById('pricing');
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div>
      <Hero onOpenPortal={onOpenPortal} onViewPricing={scrollToPricing} />
      <FeaturesShowcase />
      <PricingCalculator />
      <ApiDocs />
      <CodeExporter />
    </div>
  );
};
