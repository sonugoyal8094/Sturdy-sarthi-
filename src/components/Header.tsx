import React from 'react';
import { BookOpen, Sparkles, Globe, History, BrainCircuit } from 'lucide-react';
import { SUPPORTED_LANGUAGES, Language } from '../utils/solver-logic';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeTab: 'solve' | 'practice' | 'history';
  setActiveTab: (tab: 'solve' | 'practice' | 'history') => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  savedCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-indigo-100 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-lg text-slate-900 tracking-tight leading-tight">
                  StudySaathi
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  <Sparkles className="w-2.5 h-2.5 text-indigo-600" />
                  AI Solver
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Your AI Study Partner • Smart Step-by-Step Tutor
              </p>
            </div>
          </div>

          {/* Right Actions: Install App Button & Language Selector */}
          <div className="flex items-center gap-2">
            <PWAInstallButton />
            <div className="relative">
              <label htmlFor="language-select" className="sr-only">
                Language
              </label>
              <div className="flex items-center gap-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors">
                <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <select
                  id="language-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="bg-transparent font-medium focus:outline-none cursor-pointer text-xs pr-1"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setActiveTab('solve')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'solve'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Solve Doubt</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('practice')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'practice'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            <span>Practice Zone</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Saved ({savedCount})</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
