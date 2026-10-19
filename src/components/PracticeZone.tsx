import React, { useState } from 'react';
import {
  BrainCircuit,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trophy,
} from 'lucide-react';
import { PracticeSet } from '../types';
import {
  SUPPORTED_SUBJECTS,
  SUPPORTED_DIFFICULTIES,
  Subject,
  Difficulty,
} from '../utils/solver-logic';

interface PracticeZoneProps {
  initialTopic?: string;
  initialSubject?: Subject;
  initialDifficulty?: Difficulty;
}

const POPULAR_TOPICS = [
  { topic: 'Quadratic Equations & Roots', subject: 'Mathematics' as Subject },
  { topic: 'Newton’s Laws of Motion', subject: 'Science (Physics / Chem / Bio)' as Subject },
  { topic: 'Subject-Verb Agreement', subject: 'English & Grammar' as Subject },
  { topic: 'Number Series & Analogies', subject: 'Reasoning & Aptitude' as Subject },
  { topic: 'Indian Constitution & Fundamental Rights', subject: 'Social Studies' as Subject },
];

export const PracticeZone: React.FC<PracticeZoneProps> = ({
  initialTopic = '',
  initialSubject = SUPPORTED_SUBJECTS[0],
  initialDifficulty = 'Medium',
}) => {
  const [topic, setTopic] = useState(initialTopic);
  const [subject, setSubject] = useState<Subject>(initialSubject);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [isLoading, setIsLoading] = useState(false);
  const [practiceData, setPracticeData] = useState<PracticeSet | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});
  const [showExplanations, setShowExplanations] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (targetTopic: string = topic) => {
    const trimmed = targetTopic.trim();
    if (!trimmed) {
      setError('Please enter a topic to practice.');
      return;
    }

    setError(null);
    setIsLoading(true);
    setSelectedAnswers({});
    setShowHints({});
    setShowExplanations({});

    try {
      const response = await fetch('/api/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: trimmed,
          subject,
          difficulty,
          count: 3,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate practice questions.');
      }

      setPracticeData(data.data);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong while generating questions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, option: string) => {
    // If not answered yet, lock answer
    if (!selectedAnswers[questionId]) {
      setSelectedAnswers((prev) => ({ ...prev, [questionId]: option }));
      // Automatically reveal explanation after answering
      setShowExplanations((prev) => ({ ...prev, [questionId]: true }));
    }
  };

  const calculateScore = () => {
    if (!practiceData) return { answered: 0, correct: 0, total: 0 };
    let correct = 0;
    let answered = 0;
    for (const q of practiceData.questions) {
      if (selectedAnswers[q.id]) {
        answered++;
        if (selectedAnswers[q.id] === q.correct_answer) {
          correct++;
        }
      }
    }
    return { answered, correct, total: practiceData.questions.length };
  };

  const score = calculateScore();

  return (
    <div className="space-y-4">
      {/* Header and Generator Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              AI Practice Zone
            </h2>
            <p className="text-xs text-slate-500">
              Master topics by solving AI-generated practice questions with instant step explanations.
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerate();
          }}
          className="space-y-3"
        >
          {/* Topic Input */}
          <div>
            <label htmlFor="practice-topic-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Topic or Chapter Name
            </label>
            <div className="flex items-center gap-2">
              <input
                id="practice-topic-input"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Quadratic Equations, Optics, Chemical Bonding, Synonyms..."
                className="flex-1 text-sm rounded-xl border border-slate-300 px-3.5 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all disabled:bg-indigo-400"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Generate</span>
              </button>
            </div>
          </div>

          {/* Subject & Difficulty Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div>
              <label htmlFor="practice-subject" className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                Subject
              </label>
              <select
                id="practice-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
              >
                {SUPPORTED_SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="practice-difficulty" className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                Difficulty Level
              </label>
              <div className="flex items-center gap-1.5">
                {SUPPORTED_DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 text-xs py-1.5 px-2 rounded-lg font-medium transition-colors ${
                      difficulty === d
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </form>

        {/* Popular Topic Pills */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <span className="text-[11px] font-medium text-slate-400 mr-2">Try popular topics:</span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {POPULAR_TOPICS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTopic(p.topic);
                  setSubject(p.subject);
                  handleGenerate(p.topic);
                }}
                className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200/80 transition-colors"
              >
                {p.topic}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}
      </div>

      {/* Questions Section */}
      {practiceData && (
        <div className="space-y-4">
          {/* Score Card Banner */}
          <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-indigo-950">
                  Topic: {practiceData.topic}
                </h3>
                <p className="text-[11px] text-indigo-700">
                  Answered: {score.answered} of {score.total} questions
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-indigo-700 font-mono">
                {score.correct}/{score.total}
              </span>
              <p className="text-[10px] uppercase font-bold text-indigo-600">Score</p>
            </div>
          </div>

          {/* Question Cards */}
          {practiceData.questions.map((q, index) => {
            const userAnswer = selectedAnswers[q.id];
            const hasAnswered = Boolean(userAnswer);
            const isCorrect = userAnswer === q.correct_answer;
            const hintOpen = showHints[q.id];
            const explanationOpen = showExplanations[q.id];

            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      Q{index + 1}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                      {q.question}
                    </h4>
                  </div>
                  {hasAnswered && (
                    <span className="shrink-0">
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                          <XCircle className="w-3.5 h-3.5" /> Incorrect
                        </span>
                      )}
                    </span>
                  )}
                </div>

                {/* Options List */}
                <div className="space-y-2 pt-1">
                  {q.options.map((opt, optIdx) => {
                    const letter = String.fromCharCode(65 + optIdx); // A, B, C, D
                    let optionClasses =
                      'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100';

                    if (hasAnswered) {
                      if (opt === q.correct_answer) {
                        optionClasses =
                          'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold ring-1 ring-emerald-500';
                      } else if (opt === userAnswer) {
                        optionClasses =
                          'bg-red-50 border-red-400 text-red-950 ring-1 ring-red-400';
                      } else {
                        optionClasses = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        disabled={hasAnswered}
                        onClick={() => handleSelectOption(q.id, opt)}
                        className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm flex items-center gap-2.5 transition-all ${optionClasses}`}
                      >
                        <span className="w-5 h-5 rounded-md bg-white/80 border border-slate-300/80 font-bold text-[11px] flex items-center justify-center shrink-0">
                          {letter}
                        </span>
                        <span className="flex-1">{opt}</span>
                        {hasAnswered && opt === q.correct_answer && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        {hasAnswered && opt === userAnswer && opt !== q.correct_answer && (
                          <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Hint Toggle */}
                {q.hint && (
                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        setShowHints((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                      }
                      className="text-xs font-medium text-amber-700 hover:text-amber-800 flex items-center gap-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span>{hintOpen ? 'Hide Hint' : 'Need a Hint?'}</span>
                    </button>
                    {hintOpen && (
                      <p className="mt-1.5 p-2 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs">
                        💡 {q.hint}
                      </p>
                    )}
                  </div>
                )}

                {/* Explanation Toggle */}
                {hasAnswered && (
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() =>
                        setShowExplanations((prev) => ({
                          ...prev,
                          [q.id]: !prev[q.id],
                        }))
                      }
                      className="text-xs font-semibold text-indigo-700 flex items-center gap-1"
                    >
                      <span>Step-by-Step Explanation</span>
                      {explanationOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {explanationOpen && (
                      <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
                        <p className="font-semibold text-slate-900 mb-1">
                          Correct Answer: <span className="text-emerald-700">{q.correct_answer}</span>
                        </p>
                        <p>{q.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
