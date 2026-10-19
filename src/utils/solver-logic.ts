/**
 * StudySaathi Pure Logic & Validation Utilities
 * Decoupled logic for question verification, image payload checks,
 * subject/difficulty validation, and prompt generation.
 */

export const SUPPORTED_SUBJECTS = [
  'Mathematics',
  'Science (Physics / Chem / Bio)',
  'English & Grammar',
  'Reasoning & Aptitude',
  'Social Studies',
  'Computer Science',
] as const;

export type Subject = typeof SUPPORTED_SUBJECTS[number];

export const SUPPORTED_DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;
export type Difficulty = typeof SUPPORTED_DIFFICULTIES[number];

export const SUPPORTED_LANGUAGES = ['English', 'Hinglish (Hindi + English)', 'Hindi'] as const;
export type Language = typeof SUPPORTED_LANGUAGES[number];

export interface SolveRequestPayload {
  question?: string;
  imageBase64?: string;
  mimeType?: string;
  subject?: string;
  difficulty?: string;
  language?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

// 7MB base64 character limit approximates ~5MB binary file
const MAX_BASE64_LENGTH = 7 * 1024 * 1024;

export function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.trim();
}

export function isValidMimeType(mime?: string): boolean {
  if (!mime) return false;
  return ALLOWED_MIME_TYPES.has(mime.toLowerCase());
}

export function validateSolveRequest(payload: SolveRequestPayload): ValidationResult {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Request body must be a valid JSON object.' };
  }

  const question = sanitizeText(payload.question);
  const hasImage = typeof payload.imageBase64 === 'string' && payload.imageBase64.length > 0;

  if (!question && !hasImage) {
    return {
      valid: false,
      error: 'Please enter a question or upload a photo of the problem.',
    };
  }

  if (question && question.length < 3 && !hasImage) {
    return {
      valid: false,
      error: 'Question is too short. Please enter at least 3 characters.',
    };
  }

  if (hasImage) {
    if (!payload.mimeType || !isValidMimeType(payload.mimeType)) {
      return {
        valid: false,
        error: 'Unsupported image format. Please upload JPG, PNG, or WEBP.',
      };
    }

    if (payload.imageBase64!.length > MAX_BASE64_LENGTH) {
      return {
        valid: false,
        error: 'Image is too large. Maximum supported image size is 5MB.',
      };
    }
  }

  return { valid: true };
}

export function validateChatRequest(payload: {
  message?: string;
  contextQuestion?: string;
  history?: unknown;
}): ValidationResult {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Invalid chat request body.' };
  }

  const message = sanitizeText(payload.message);
  if (!message || message.length < 2) {
    return {
      valid: false,
      error: 'Follow-up question must be at least 2 characters long.',
    };
  }

  return { valid: true };
}

export function validatePracticeRequest(payload: {
  topic?: string;
  subject?: string;
  difficulty?: string;
}): ValidationResult {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Invalid practice request body.' };
  }

  const topic = sanitizeText(payload.topic);
  if (!topic || topic.length < 2) {
    return {
      valid: false,
      error: 'Topic must be specified to generate practice questions.',
    };
  }

  return { valid: true };
}

export function cleanBase64(base64Data: string): string {
  // If user sends "data:image/png;base64,...", strip header prefix
  const marker = ';base64,';
  const index = base64Data.indexOf(marker);
  if (index !== -1) {
    return base64Data.substring(index + marker.length);
  }
  return base64Data;
}
