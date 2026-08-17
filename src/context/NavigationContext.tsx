import React, { useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  NavigationContext,
  type ViewMode,
  type PortalTab,
} from './navigationContextDef';

function parseUrlState(): { view: ViewMode; tab: PortalTab; section: string | null } {
  if (typeof window === 'undefined') {
    return { view: 'landing', tab: 'workbench', section: null };
  }

  const pathname = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  const hash = window.location.hash.toLowerCase().replace(/^#/, '');

  if (pathname.startsWith('/portal')) {
    const subPath = pathname.replace(/^\/portal\/?/, '');
    let tab: PortalTab = 'workbench';
    if (subPath === 'keys' || subPath === 'api-keys') tab = 'keys';
    else if (subPath === 'docs' || subPath === 'api') tab = 'docs';
    else if (subPath === 'snippets' || subPath === 'sdk') tab = 'snippets';
    else if (subPath === 'workbench' || subPath === 'playground') tab = 'workbench';

    return { view: 'portal', tab, section: null };
  }

  // Known landing sections
  const knownLandingSections = ['features', 'pricing', 'docs', 'snippets', 'playground'];
  const landingPathSection = pathname.replace(/^\//, '');

  if (knownLandingSections.includes(landingPathSection)) {
    return { view: 'landing', tab: 'workbench', section: landingPathSection };
  }

  if (knownLandingSections.includes(hash)) {
    return { view: 'landing', tab: 'workbench', section: hash };
  }

  return { view: 'landing', tab: 'workbench', section: null };
}

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [navState, setNavState] = useState(parseUrlState);

  const scrollToElement = useCallback((elementId: string) => {
    setTimeout(() => {
      const el = document.getElementById(elementId);
      if (el) {
        const offset = 80;
        const pos = el.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: pos, behavior: 'smooth' });
      }
    }, 80);
  }, []);

  const handleLocationChange = useCallback(() => {
    const parsed = parseUrlState();
    setNavState(parsed);
    if (parsed.view === 'landing' && parsed.section) {
      scrollToElement(parsed.section);
    } else if (parsed.view === 'landing' && !parsed.section) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [scrollToElement]);

  useEffect(() => {
    window.addEventListener('popstate', handleLocationChange);
    // Initial scroll check on load
    if (navState.view === 'landing' && navState.section) {
      scrollToElement(navState.section);
    }
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [handleLocationChange, navState.view, navState.section, scrollToElement]);

  const navigateToLanding = useCallback((sectionId?: string) => {
    const targetUrl = sectionId ? `/${sectionId}` : '/';
    if (window.location.pathname !== targetUrl) {
      window.history.pushState(null, '', targetUrl);
    }
    setNavState({ view: 'landing', tab: 'workbench', section: sectionId || null });
    if (sectionId) {
      scrollToElement(sectionId);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [scrollToElement]);

  const navigateToPortal = useCallback((tab: PortalTab = 'workbench') => {
    const targetUrl = `/portal/${tab}`;
    if (window.location.pathname !== targetUrl) {
      window.history.pushState(null, '', targetUrl);
    }
    setNavState({ view: 'portal', tab, section: null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateTo = useCallback((path: string) => {
    if (path.startsWith('/portal')) {
      const sub = path.replace(/^\/portal\/?/, '');
      let tab: PortalTab = 'workbench';
      if (sub === 'keys') tab = 'keys';
      else if (sub === 'docs') tab = 'docs';
      else if (sub === 'snippets') tab = 'snippets';
      navigateToPortal(tab);
    } else {
      const section = path.replace(/^\//, '').replace(/^#/, '');
      navigateToLanding(section || undefined);
    }
  }, [navigateToLanding, navigateToPortal]);

  return (
    <NavigationContext.Provider
      value={{
        currentView: navState.view,
        portalTab: navState.tab,
        activeSection: navState.section,
        navigateToLanding,
        navigateToPortal,
        navigateTo,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};
