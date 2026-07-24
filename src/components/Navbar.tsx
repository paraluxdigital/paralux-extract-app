import React from 'react';

interface NavbarProps {
  activeTab: 'playground' | 'pricing' | 'docs' | 'snippets';
  setActiveTab: (tab: 'playground' | 'pricing' | 'docs' | 'snippets') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('playground')}>
          <div className="size-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
            <span className="material-symbols-outlined text-xl">description</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">Paralux</span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wide">
                Document AI
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Intelligent Extraction System</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('playground')}
            className={`px-3.5 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'playground'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span className="material-symbols-outlined text-sm">tune</span>
            Schema Workbench
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-3.5 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'pricing'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span className="material-symbols-outlined text-sm">payments</span>
            ROI & Unit Economics
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`px-3.5 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'docs'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span className="material-symbols-outlined text-sm">api</span>
            API Documentation
          </button>

          <button
            onClick={() => setActiveTab('snippets')}
            className={`px-3.5 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'snippets'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span className="material-symbols-outlined text-sm">code</span>
            SDK Snippets
          </button>
        </nav>

        {/* API Status & CTA */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium">
            <span className="size-2 rounded-full bg-emerald-500"></span>
            <span>API Online</span>
          </div>

          <button
            onClick={() => setActiveTab('playground')}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">play_arrow</span>
            <span>Test Sandbox</span>
          </button>
        </div>

      </div>
    </header>
  );
};
