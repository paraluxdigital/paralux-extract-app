import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Playground } from './components/Playground';
import { PricingCalculator } from './components/PricingCalculator';
import { CodeExporter } from './components/CodeExporter';
import { ApiDocs } from './components/ApiDocs';
import { Footer } from './components/Footer';

export function App() {
  const [activeTab, setActiveTab] = useState<'playground' | 'pricing' | 'docs' | 'snippets'>('playground');

  const scrollToSection = (tab: 'playground' | 'pricing' | 'docs' | 'snippets') => {
    setActiveTab(tab);
    const element = document.getElementById(tab);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={scrollToSection} />
      
      <main className="flex-1">
        <Hero
          onStartTesting={() => scrollToSection('playground')}
          onViewPricing={() => scrollToSection('pricing')}
        />

        <Playground />

        <PricingCalculator />

        <CodeExporter />

        <ApiDocs />
      </main>

      <Footer />
    </div>
  );
}

export default App;
