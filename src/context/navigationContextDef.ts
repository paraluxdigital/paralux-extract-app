import { createContext } from 'react';

export type ViewMode = 'landing' | 'portal';
export type PortalTab = 'workbench' | 'keys' | 'docs' | 'snippets';

export interface NavigationContextType {
  currentView: ViewMode;
  portalTab: PortalTab;
  activeSection: string | null;
  navigateToLanding: (sectionId?: string) => void;
  navigateToPortal: (tab?: PortalTab) => void;
  navigateTo: (path: string) => void;
}

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);
