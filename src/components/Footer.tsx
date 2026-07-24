import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="flex items-center gap-3">
          <div className="size-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
          </div>
          <span className="text-sm font-bold text-white tracking-tight">Paralux Extract AI</span>
          <span className="text-xs text-slate-500">• Intelligent Multimodal Document Extraction Platform</span>
        </div>

        <div className="flex items-center gap-6 text-xs font-medium text-slate-400">
          <a href="#playground" className="hover:text-white transition-colors">Workbench</a>
          <a href="#pricing" className="hover:text-white transition-colors">ROI Calculator</a>
          <a href="#docs" className="hover:text-white transition-colors">Documentation</a>
          <a href="#snippets" className="hover:text-white transition-colors">SDK Code</a>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          © {new Date().getFullYear()} Paralux Digital. All rights reserved.
        </div>

      </div>
    </footer>
  );
};
