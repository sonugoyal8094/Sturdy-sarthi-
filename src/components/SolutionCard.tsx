import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  HelpCircle,
  Sparkles,
  AlertTriangle,
  Send,
  MessageSquare,
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SolutionData, ChatMessage } from '../types';

interface SolutionCardProps {
  solution: SolutionData;
  onGeneratePractice: (topic: string, subject: string, difficulty: string) => void;
  onSaveDoubt?: (solution: SolutionData) => void;
  isSaved?: boolean;
  language: string;
}

export const SolutionCard: React.FC<SolutionCardProps> = ({
  solution,
  onGeneratePractice,
  onSaveDoubt,
  isSaved = false,
  language,
}) => {
  const [copied, setCopied] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [followUpText, setFollowUpText] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const handleCopy = () => {
    const textToCopy = `Question: ${solution.extracted_question}
Subject: ${solution.subject} (${solution.topic})
Concept: ${solution.concept_summary}

Steps:
${solution.steps.map((s) => `Step ${s.step_number}: ${s.title}\n${s.explanation}${s.math_or_formula ? `\nFormula/Math: ${s.math_or_formula}` : ''}`).join('\n\n')}

Final Answer: ${solution.final_answer}
Tip: ${solution.pro_tip_or_common_pitfall || 'None'}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendFollowUp = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isChatLoading) return;

    setChatError(null);
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      text: trimmed,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setFollowUpText('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          problemContext: `Original Question: ${solution.extracted_question}. Final Answer: ${solution.final_answer}. Topic: ${solution.topic}.`,
          history: chatMessages.map((m) => ({ role: m.role, text: m.text })),
          language,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get follow-up answer.');
      }

      const modelMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'model',
        text: data.reply,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      setChatError(err?.message || 'Failed to send follow up.');
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      {/* Top Banner with Subject & Quick Actions */}
      <div className="bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/50 p-4 sm:p-5 border-b border-indigo-100/70">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-600 text-white shadow-2xs">
              {solution.subject}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              {solution.topic}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
              {solution.difficulty}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {onSaveDoubt && (
              <button
                type="button"
                onClick={() => onSaveDoubt(solution)}
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 border transition-colors ${
                  isSaved
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
                title={isSaved ? 'Saved in Doubts' : 'Save Doubt'}
              >
                {isSaved ? <BookmarkCheck className="w-4 h-4 text-emerald-600" /> : <Bookmark className="w-4 h-4" />}
                <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
              title="Copy solution text"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Extracted Question Statement */}
        <div className="mt-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1 mb-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Problem Statement</span>
          </div>
          <p className="text-sm font-semibold text-slate-900 leading-snug">
            {solution.extracted_question}
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Core Concept / Formula Box */}
        {solution.concept_summary && (
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>Core Concept & Formula</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-950 font-medium leading-relaxed">
              {solution.concept_summary}
            </p>
          </div>
        )}

        {/* Step-by-Step Solution Breakdown */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Step-by-Step Explanation</span>
          </div>

          <div className="space-y-3">
            {solution.steps.map((step) => (
              <div
                key={step.step_number}
                className="relative pl-9 pb-1 before:absolute before:left-3.5 before:top-8 before:bottom-0 before:w-0.5 before:bg-indigo-100 last:before:hidden"
              >
                <div className="absolute left-0 top-0 w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {step.step_number}
                </div>
                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/80">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-1">
                    {step.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {step.explanation}
                  </p>
                  {step.math_or_formula && (
                    <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 font-mono text-xs text-indigo-900 font-semibold overflow-x-auto">
                      {step.math_or_formula}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Highlighted Final Answer */}
        <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-500/80 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Final Answer</span>
          </div>
          <div className="text-sm sm:text-base font-bold text-emerald-950 font-mono">
            {solution.final_answer}
          </div>
        </div>

        {/* Pro-Tip or Common Trap */}
        {solution.pro_tip_or_common_pitfall && (
          <div className="p-3 rounded-xl bg-slate-100/90 border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>StudySaathi Pro-Tip & Common Pitfalls</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {solution.pro_tip_or_common_pitfall}
            </p>
          </div>
        )}

        {/* Action Button: Generate Practice Questions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
          <button
            type="button"
            onClick={() =>
              onGeneratePractice(solution.topic, solution.subject, solution.difficulty)
            }
            className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs sm:text-sm border border-indigo-200 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Practice Similar Questions ({solution.topic})</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowChat((prev) => !prev)}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs sm:text-sm border border-slate-200 transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-slate-600" />
            <span>Ask Follow-up Doubt</span>
            {showChat ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Follow-up Doubt Chat Section */}
        {showChat && (
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                Doubt Clearing Assistant
              </span>
              <span className="text-[11px] text-slate-500">Ask any step clarification</span>
            </div>

            {/* Quick Prompt Suggestions */}
            {solution.suggested_followups && solution.suggested_followups.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-slate-500">Suggested questions:</p>
                <div className="flex flex-wrap gap-1.5">
                  {solution.suggested_followups.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => sendFollowUp(q)}
                      disabled={isChatLoading}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/80 transition-colors text-left"
                    >
                      {q}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => sendFollowUp('Can you explain Step 2 in simpler everyday terms?')}
                    disabled={isChatLoading}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-left"
                  >
                    Explain Step 2 in simpler words
                  </button>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {chatMessages.length > 0 && (
              <div className="space-y-2.5 max-h-60 overflow-y-auto p-3 rounded-xl bg-slate-50 border border-slate-200">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-xs sm:text-sm ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-xs'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs shadow-2xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 flex items-center gap-1.5">
                      <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <span>StudySaathi is explaining...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {chatError && (
              <p className="text-xs text-red-600 font-medium bg-red-50 p-2 rounded-lg border border-red-200">
                {chatError}
              </p>
            )}

            {/* Chat Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendFollowUp(followUpText);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={followUpText}
                onChange={(e) => setFollowUpText(e.target.value)}
                placeholder="Ask your doubt about this solution (e.g. 'Why did we multiply by 2?')..."
                className="flex-1 text-xs sm:text-sm rounded-xl border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
              />
              <button
                type="submit"
                disabled={isChatLoading || !followUpText.trim()}
                className="px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                title="Send follow-up"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
