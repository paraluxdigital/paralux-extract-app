import { AuthProvider } from './context/AuthContext';
import { NavigationProvider } from './context/NavigationContext';
import { useNavigation } from './context/useNavigation';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { UserPortal } from './components/UserPortal';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';

function AppContent() {
  const { currentView } = useNavigation();

  return (
    <div className="min-h-screen bg-[#1a202c] text-[#f7fafc] flex flex-col font-sans grid-bg relative selection:bg-[#dd6b20]/30 selection:text-[#dd6b20]">
      {/* Subtle Ambient Studio Accent Light */}
      <div className="fixed top-0 left-1/3 w-[600px] h-[600px] bg-[#dd6b20]/5 rounded-full blur-[140px] pointer-events-none -z-10"></div>
      <div className="fixed top-1/2 right-10 w-[500px] h-[500px] bg-[#2d3748]/50 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <Navbar />

      <main className="flex-1">
        {currentView === 'landing' ? <LandingPage /> : <UserPortal />}
      </main>

      <AuthModal />
      <Footer />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <AppContent />
      </NavigationProvider>
    </AuthProvider>
  );
}

export default App;
