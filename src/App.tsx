/**
 * StudySaathi AI Student Solver
 * Main Application Component
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { QuestionInput } from './components/QuestionInput';
import { SolutionCard } from './components/SolutionCard';
import { PracticeZone } from './components/PracticeZone';
import { HistoryList } from './components/HistoryList';
import { SolutionData, SavedSolutionItem } from './types';
import { Language, Subject, Difficulty } from './utils/solver-logic';
import {
  Sparkles,
  BookOpen,
  Camera,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';
import { OfflineIndicator } from './components/OfflineIndicator';

const STORAGE_KEY = 'studysaathi_saved_doubts_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'solve' | 'practice' | 'history'>('solve');
  const [language, setLanguage] = useState<Language>('English');
  const [currentSolution, setCurrentSolution] = useState<SolutionData | null>(null);
  const [lastImagePreview, setLastImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Practice zone state
  const [practiceTopic, setPracticeTopic] = useState('');
  const [practiceSubject, setPracticeSubject] = useState<Subject>('Mathematics');
  const [practiceDifficulty, setPracticeDifficulty] = useState<Difficulty>('Medium');

  // Saved doubts
  const [savedItems, setSavedItems] = useState<SavedSolutionItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedItems));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }, [savedItems]);

  const handleSolve = async (payload: {
    question: string;
    imageBase64?: string;
    mimeType?: string;
    subject: Subject;
    difficulty: Difficulty;
  }) => {
    setIsLoading(true);
    setError(null);
    if (payload.imageBase64) {
      setLastImagePreview(payload.imageBase64);
    } else {
      setLastImagePreview(null);
    }

    try {
      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          language,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to solve problem.');
      }

      setCurrentSolution(data.solution);
      // Scroll to solution smoothly
      window.scrollTo({ top: 380, behavior: 'smooth' });
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to StudySaathi AI solver.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDoubt = (solution: SolutionData) => {
    const exists = savedItems.some(
      (item) => item.solution.extracted_question === solution.extracted_question
    );

    if (exists) {
      // Toggle off / remove
      setSavedItems((prev) =>
        prev.filter((item) => item.solution.extracted_question !== solution.extracted_question)
      );
    } else {
      const newItem: SavedSolutionItem = {
        id: String(Date.now()),
        timestamp: Date.now(),
        questionText: solution.extracted_question,
        subject: solution.subject,
        difficulty: solution.difficulty,
        solution,
        imageThumbnail: lastImagePreview || undefined,
      };
      setSavedItems((prev) => [newItem, ...prev]);
    }
  };

  const isCurrentSaved = Boolean(
    currentSolution &&
      savedItems.some(
        (item) => item.solution.extracted_question === currentSolution.extracted_question
      )
  );

  const handleGeneratePracticeFromSolution = (
    topic: string,
    subject: string,
    difficulty: string
  ) => {
    setPracticeTopic(topic);
    setPracticeSubject(subject as Subject);
    setPracticeDifficulty(difficulty as Difficulty);
    setActiveTab('practice');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectHistoryItem = (item: SavedSolutionItem) => {
    setCurrentSolution(item.solution);
    if (item.imageThumbnail) {
      setLastImagePreview(item.imageThumbnail);
    }
    setActiveTab('solve');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteHistoryItem = (id: string) => {
    setSavedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAllHistory = () => {
    setSavedItems([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        savedCount={savedItems.length}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-5 space-y-6">
        {/* Welcome Hero / Status Bar for students */}
        <section aria-label="StudySaathi Introduction" className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-800 rounded-2xl p-4 sm:p-6 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-xs">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Smart Academic Mentor • AI Student Solver</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
                Clear & Understandable Step-by-Step Solutions
              </h2>
              <p className="text-xs sm:text-sm text-indigo-100 max-w-xl">
                Upload photos of your textbook or type your doubts. StudySaathi breaks down math, science, and reasoning problems step-by-step with formulas, concepts, and practice questions.
              </p>
            </div>

            <div className="hidden sm:flex flex-col gap-1 text-[11px] bg-white/10 rounded-xl p-3 border border-white/20 backdrop-blur-xs shrink-0 text-indigo-50">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                <span>Camera & Photo OCR Vision</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                <span>Detailed Step-by-Step Logic</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                <span>Practice MCQs & Doubt Chat</span>
              </div>
            </div>
          </div>
        </section>

        {/* Tab 1: Solve Doubt */}
        {activeTab === 'solve' && (
          <div className="space-y-6">
            <QuestionInput onSolve={handleSolve} isLoading={isLoading} />

            {/* Error Notification */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <span className="text-red-600">⚠️</span> Error solving question
                </p>
                <p className="text-xs text-red-700">{error}</p>
                <p className="text-[11px] text-red-600">
                  Tip: Ensure the question text or image is clear.
                </p>
              </div>
            )}

            {/* Solution Display */}
            {currentSolution && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>AI Step-by-Step Solution</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentSolution(null);
                      setLastImagePreview(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                  >
                    Clear solution
                  </button>
                </div>

                <SolutionCard
                  solution={currentSolution}
                  onGeneratePractice={handleGeneratePracticeFromSolution}
                  onSaveDoubt={handleSaveDoubt}
                  isSaved={isCurrentSaved}
                  language={language}
                />
              </div>
            )}

            {/* Empty State / How it works Guide if no solution yet */}
            {!currentSolution && !isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-xs">
                    1
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Type or Photo Scan</h4>
                  <p className="text-[11px] text-slate-500">
                    Type your question, use speech mic, or capture a photo from your textbook directly with your phone's camera.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-xs">
                    2
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Understand Concepts</h4>
                  <p className="text-[11px] text-slate-500">
                    StudySaathi extracts core formulas, explains every single calculation step, and alerts you to common exam traps.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-xs">
                    3
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Test & Practice</h4>
                  <p className="text-[11px] text-slate-500">
                    Generate instant practice questions on the same concept, check your answers, and clear follow-up doubts.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Practice Zone */}
        {activeTab === 'practice' && (
          <PracticeZone
            initialTopic={practiceTopic}
            initialSubject={practiceSubject}
            initialDifficulty={practiceDifficulty}
          />
        )}

        {/* Tab 3: Saved Doubts / History */}
        {activeTab === 'history' && (
          <HistoryList
            savedItems={savedItems}
            onSelect={handleSelectHistoryItem}
            onDelete={handleDeleteHistoryItem}
            onClearAll={handleClearAllHistory}
          />
        )}
      </main>

      {/* Mobile-Friendly Footer */}
      <footer className="mt-12 bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-slate-700">
            StudySaathi AI Student Solver • Your 24/7 AI Study Partner
          </p>
          <p className="text-[11px] text-slate-400">
            Built for school and competitive exam students (CBSE, ICSE, State Boards, JEE/NEET basics, SSC/Banking aptitude).
          </p>
          <div className="flex items-center justify-center gap-3 pt-1 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Secure Server-Side AI
            </span>
            <span>•</span>
            <span>Step-by-Step Learning</span>
          </div>
        </div>
      </footer>
      <OfflineIndicator />
    </div>
  );
}
