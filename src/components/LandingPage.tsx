import React from 'react';
import { Hero } from './Hero';
import { FeaturesShowcase } from './FeaturesShowcase';
import { PricingCalculator } from './PricingCalculator';
import { ApiDocs } from './ApiDocs';
import { CodeExporter } from './CodeExporter';

export const LandingPage: React.FC = () => {
  return (
    <div>
      <Hero />
      <FeaturesShowcase />
      <PricingCalculator />
      <ApiDocs />
      <CodeExporter />
    </div>
  );
};
