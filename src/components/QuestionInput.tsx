import React, { useState, useRef } from 'react';
import {
  Camera,
  UploadCloud,
  X,
  Mic,
  MicOff,
  Send,
  Sparkles,
  BookOpen,
  Gauge,
  Lightbulb,
} from 'lucide-react';
import {
  SUPPORTED_SUBJECTS,
  SUPPORTED_DIFFICULTIES,
  Subject,
  Difficulty,
} from '../utils/solver-logic';

interface QuestionInputProps {
  onSolve: (data: {
    question: string;
    imageBase64?: string;
    mimeType?: string;
    subject: Subject;
    difficulty: Difficulty;
  }) => Promise<void>;
  isLoading: boolean;
}

const SAMPLE_QUESTIONS: { label: string; subject: Subject; difficulty: Difficulty; text: string }[] = [
  {
    label: 'Math: Quadratic Equation',
    subject: 'Mathematics',
    difficulty: 'Medium',
    text: 'Solve for x: x^2 - 5x + 6 = 0 using step-by-step factorization and quadratic formula.',
  },
  {
    label: 'Physics: Newton’s 3rd Law',
    subject: 'Science (Physics / Chem / Bio)',
    difficulty: 'Easy',
    text: 'State Newton’s Third Law of Motion with two real-world everyday examples.',
  },
  {
    label: 'Reasoning: Number Series',
    subject: 'Reasoning & Aptitude',
    difficulty: 'Medium',
    text: 'Find the next number in the sequence: 2, 6, 12, 20, 30, ? Explain the logic.',
  },
  {
    label: 'English: Grammar & Tense',
    subject: 'English & Grammar',
    difficulty: 'Easy',
    text: 'Correct the error in this sentence and explain the rule: "Neither of the boys were present yesterday."',
  },
];

export const QuestionInput: React.FC<QuestionInputProps> = ({ onSolve, isLoading }) => {
  const [questionText, setQuestionText] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject>(SUPPORTED_SUBJECTS[0]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('Medium');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [imageFileName, setImageFileName] = useState<string>('');
  const [imageSizeKb, setImageSizeKb] = useState<number>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Handle image file selection
  const handleFileProcess = (file: File) => {
    setInputError(null);
    if (!file.type.startsWith('image/')) {
      setInputError('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setInputError('Image size exceeds 5MB limit. Please upload a smaller photo.');
      return;
    }

    setImageFileName(file.name);
    setImageSizeKb(Math.round(file.size / 1024));
    setImageMimeType(file.type);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFileName('');
    setImageSizeKb(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Drag and drop handler
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  // Voice speech-to-text
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setInputError('Speech recognition is not supported in this browser. Please type your question.');
      return;
    }

    if (isRecording) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN'; // Works for Indian English and Hindi-accented English

      recognition.onstart = () => {
        setIsRecording(true);
        setInputError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuestionText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInputError(null);

    const trimmed = questionText.trim();
    if (!trimmed && !imagePreview) {
      setInputError('Please type a question or capture/upload a photo of your doubt.');
      return;
    }

    try {
      await onSolve({
        question: trimmed,
        imageBase64: imagePreview || undefined,
        mimeType: imagePreview ? imageMimeType : undefined,
        subject: selectedSubject,
        difficulty: selectedDifficulty,
      });
    } catch (err: any) {
      setInputError(err?.message || 'Something went wrong while solving.');
    }
  };

  const selectSample = (sample: (typeof SAMPLE_QUESTIONS)[0]) => {
    setQuestionText(sample.text);
    setSelectedSubject(sample.subject);
    setSelectedDifficulty(sample.difficulty);
    setInputError(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Subject & Difficulty Selectors */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="subject-select"
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                Select Subject
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SUPPORTED_SUBJECTS.map((sub) => {
                const isSelected = selectedSubject === sub;
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSelectedSubject(sub)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70 border border-transparent'
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="difficulty-select"
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"
              >
                <Gauge className="w-3.5 h-3.5 text-indigo-600" />
                Target Difficulty Level
              </label>
            </div>
            <div className="flex items-center gap-2">
              {SUPPORTED_DIFFICULTIES.map((diff) => {
                const isSelected = selectedDifficulty === diff;
                let colorClasses = 'bg-slate-100 text-slate-700';
                if (isSelected) {
                  if (diff === 'Easy') colorClasses = 'bg-emerald-600 text-white';
                  else if (diff === 'Medium') colorClasses = 'bg-indigo-600 text-white';
                  else colorClasses = 'bg-amber-600 text-white';
                }
                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`flex-1 text-xs py-1.5 px-2 rounded-lg font-semibold transition-all ${colorClasses}`}
                  >
                    {diff === 'Easy' && 'Easy • Foundational'}
                    {diff === 'Medium' && 'Medium • Standard'}
                    {diff === 'Hard' && 'Hard • Advanced'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Text Area & Voice Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="question-textarea"
              className="text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              Your Question or Doubt
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                aria-label={isRecording ? 'Stop voice recording' : 'Start voice speech-to-text'}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium transition-colors ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isRecording ? 'Listening...' : 'Voice Mic'}</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              id="question-textarea"
              rows={3}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Type your question here (e.g. 'Solve 3x + 12 = 27', 'Explain why leaves are green', 'Write the formula for kinetic energy')..."
              className="w-full text-sm rounded-xl border border-slate-300 px-3.5 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Photo Question Scanner (Gallery + Camera) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-indigo-600" />
              Photo Scanner (Camera / Gallery)
            </span>
            {imagePreview && (
              <button
                type="button"
                onClick={removeImage}
                className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-0.5"
              >
                <X className="w-3.5 h-3.5" />
                Remove photo
              </button>
            )}
          </div>

          {!imagePreview ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-3.5 text-center transition-all ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50/60'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                {/* Mobile Camera Button */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <span>Take Photo with Camera</span>
                </button>

                {/* Gallery File Upload */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-white text-slate-700 border border-slate-300 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                >
                  <UploadCloud className="w-4 h-4 text-slate-500" />
                  <span>Upload from Gallery</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500 mt-2">
                Click a photo of your textbook, notebook, or screen. Supports JPG, PNG up to 5MB.
              </p>

              {/* Hidden inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="gallery-input"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="hidden"
                id="camera-input"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <img
                src={imagePreview}
                alt="Question attachment preview"
                className="w-16 h-16 object-cover rounded-lg border border-slate-200 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {imageFileName || 'Captured Question Photo'}
                </p>
                <p className="text-[11px] text-slate-500">{imageSizeKb} KB • Ready for OCR analysis</p>
                <span className="inline-block mt-1 text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                  ✓ Photo attached
                </span>
              </div>
              <button
                type="button"
                onClick={removeImage}
                aria-label="Remove photo"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Input Validation Error */}
        {inputError && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {inputError}
          </div>
        )}

        {/* Quick Sample Questions */}
        <div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            <Lightbulb className="w-3 h-3 text-amber-500" />
            <span>Try sample questions:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_QUESTIONS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectSample(sample)}
                className="text-[11px] px-2 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200/80 transition-colors text-left"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white shadow-md transition-all ${
              isLoading
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-indigo-200 active:scale-[0.99]'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>StudySaathi is solving your question...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Solve with StudySaathi AI</span>
                <Send className="w-3.5 h-3.5 ml-0.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
