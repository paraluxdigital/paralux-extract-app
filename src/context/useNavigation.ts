import { useContext } from 'react';
import { NavigationContext, type NavigationContextType } from './navigationContextDef';

export function useNavigation(): NavigationContextType {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
