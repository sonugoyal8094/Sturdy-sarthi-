import React from 'react';
import { Bookmark, Trash2, Clock, ChevronRight, BookOpen, AlertCircle } from 'lucide-react';
import { SavedSolutionItem } from '../types';

interface HistoryListProps {
  savedItems: SavedSolutionItem[];
  onSelect: (item: SavedSolutionItem) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  savedItems,
  onSelect,
  onDelete,
  onClearAll,
}) => {
  if (savedItems.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mx-auto mb-3">
          <Bookmark className="w-6 h-6" />
        </div>
        <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
          No Saved Doubts Yet
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
          Whenever you solve a tricky problem, tap the "Save" button to keep it in your revision collection.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
          <span>Saved Revision Library ({savedItems.length})</span>
        </div>

        <button
          type="button"
          onClick={() => {
            if (confirm('Clear all saved doubts?')) {
              onClearAll();
            }
          }}
          className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      <div className="space-y-2.5">
        {savedItems.map((item) => {
          const dateStr = new Date(item.timestamp).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 hover:border-indigo-300 transition-all flex items-start justify-between gap-3 shadow-2xs group cursor-pointer"
              onClick={() => onSelect(item)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {item.subject}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {item.solution.topic}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {dateStr}
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                  {item.solution.extracted_question || item.questionText}
                </h4>

                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                  Answer: <span className="font-medium text-emerald-700">{item.solution.final_answer}</span>
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0 pt-1" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  aria-label="Delete saved doubt"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  aria-label="View solution details"
                  className="p-1.5 text-slate-400 group-hover:text-indigo-600 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
