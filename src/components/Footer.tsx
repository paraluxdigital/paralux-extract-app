import React from 'react';
import { useNavigation } from '../context/useNavigation';

export const Footer: React.FC = () => {
  const { navigateToLanding, navigateToPortal } = useNavigation();

  return (
    <footer className="border-t border-[#4a5568]/60 bg-[#1a202c] py-12 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Brand */}
        <div 
          onClick={() => navigateToLanding()}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="size-8 rounded-xl bg-[#2d3748] border border-[#4a5568] flex items-center justify-center p-1.5 shadow-sm group-hover:border-[#dd6b20] transition-all">
            <img 
              src="/favicon.svg" 
              alt="Paralux Digital" 
              className="size-full object-contain filter drop-shadow-[0_0_6px_rgba(221,107,32,0.4)]" 
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="text-sm font-black font-display text-[#f7fafc] tracking-tight group-hover:text-[#dd6b20] transition-colors">
              Paralux Extract AI
            </span>
            <span className="hidden sm:inline text-xs text-[#a0aec0]">•</span>
            <span className="text-xs text-[#a0aec0]">Intelligent Document Extraction Platform</span>
          </div>
        </div>

        {/* Quick Nav Links */}
        <div className="flex items-center gap-6 text-xs font-semibold text-[#a0aec0] flex-wrap">
          <button 
            onClick={() => navigateToPortal('workbench')} 
            className="hover:text-[#dd6b20] transition-colors cursor-pointer"
          >
            Workbench
          </button>
          <button 
            onClick={() => navigateToLanding('pricing')} 
            className="hover:text-[#dd6b20] transition-colors cursor-pointer"
          >
            ROI Calculator
          </button>
          <button 
            onClick={() => navigateToLanding('docs')} 
            className="hover:text-[#dd6b20] transition-colors cursor-pointer"
          >
            API Specs
          </button>
          <button 
            onClick={() => navigateToLanding('snippets')} 
            className="hover:text-[#dd6b20] transition-colors cursor-pointer"
          >
            SDK Code
          </button>
          <a 
            href="https://paraluxdigital.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-[#dd6b20] hover:text-[#dd6b20]/80 transition-colors flex items-center gap-1"
          >
            <span>Paralux Digital Studio</span>
            <span className="material-symbols-outlined text-xs">arrow_outward</span>
          </a>
        </div>

        {/* Copyright */}
        <div className="text-xs text-[#a0aec0] font-mono">
          © {new Date().getFullYear()} Paralux Digital. All rights reserved.
        </div>

      </div>
    </footer>
  );
};
