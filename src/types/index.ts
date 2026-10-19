export interface SolutionStep {
  step_number: number;
  title: string;
  explanation: string;
  math_or_formula?: string;
}

export interface SolutionData {
  extracted_question: string;
  subject: string;
  topic: string;
  difficulty: string;
  concept_summary: string;
  steps: SolutionStep[];
  final_answer: string;
  pro_tip_or_common_pitfall?: string;
  suggested_followups?: string[];
}

export interface PracticeQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  hint?: string;
  explanation: string;
}

export interface PracticeSet {
  topic: string;
  questions: PracticeQuestion[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface SavedSolutionItem {
  id: string;
  timestamp: number;
  questionText: string;
  subject: string;
  difficulty: string;
  solution: SolutionData;
  imageThumbnail?: string;
}
