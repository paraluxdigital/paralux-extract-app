import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { UserPortal } from './components/UserPortal';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';

export function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'portal'>('landing');

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
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
    <AuthProvider>
      <div className="min-h-screen bg-[#1a202c] text-[#f7fafc] flex flex-col font-sans grid-bg relative selection:bg-[#dd6b20]/30 selection:text-[#dd6b20]">
        {/* Subtle Ambient Studio Accent Light */}
        <div className="fixed top-0 left-1/3 w-[600px] h-[600px] bg-[#dd6b20]/5 rounded-full blur-[140px] pointer-events-none -z-10"></div>
        <div className="fixed top-1/2 right-10 w-[500px] h-[500px] bg-[#2d3748]/50 rounded-full blur-[120px] pointer-events-none -z-10"></div>

        <Navbar
          currentView={currentView}
          setCurrentView={setCurrentView}
          onNavigateSection={scrollToSection}
        />
        
        <main className="flex-1 relative z-10">
          {currentView === 'landing' ? (
            <LandingPage onOpenPortal={() => setCurrentView('portal')} />
          ) : (
            <UserPortal onBackToLanding={() => setCurrentView('landing')} />
          )}
        </main>

        <AuthModal />
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
