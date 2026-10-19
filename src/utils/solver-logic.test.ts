import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSolveRequest,
  validateChatRequest,
  validatePracticeRequest,
  cleanBase64,
  isValidMimeType,
} from './solver-logic.ts';

test('validateSolveRequest rejects empty payloads', () => {
  const result = validateSolveRequest({});
  assert.equal(result.valid, false);
  assert.match(result.error!, /enter a question or upload a photo/);
});

test('validateSolveRequest rejects too short question without image', () => {
  const result = validateSolveRequest({ question: 'hi' });
  assert.equal(result.valid, false);
  assert.match(result.error!, /at least 3 characters/);
});

test('validateSolveRequest accepts valid text question', () => {
  const result = validateSolveRequest({
    question: 'What is Newton second law of motion?',
    subject: 'Science (Physics / Chem / Bio)',
    difficulty: 'Medium',
  });
  assert.equal(result.valid, true);
  assert.equal(result.error, undefined);
});

test('validateSolveRequest validates image mime types', () => {
  const invalidMime = validateSolveRequest({
    imageBase64: 'abc12345',
    mimeType: 'application/pdf',
  });
  assert.equal(invalidMime.valid, false);
  assert.match(invalidMime.error!, /Unsupported image format/);

  const validJpg = validateSolveRequest({
    imageBase64: 'abc12345',
    mimeType: 'image/jpeg',
  });
  assert.equal(validJpg.valid, true);
});

test('cleanBase64 strips data URI prefix correctly', () => {
  const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA';
  const cleaned = cleanBase64(dataUri);
  assert.equal(cleaned, 'iVBORw0KGgoAAAANSUhEUgAA');

  const rawBase64 = 'iVBORw0KGgoAAAANSUhEUgAA';
  assert.equal(cleanBase64(rawBase64), 'iVBORw0KGgoAAAANSUhEUgAA');
});

test('validateChatRequest checks minimum message length', () => {
  assert.equal(validateChatRequest({ message: ' ' }).valid, false);
  assert.equal(validateChatRequest({ message: 'Can you explain step 2?' }).valid, true);
});

test('validatePracticeRequest ensures topic is non-empty', () => {
  assert.equal(validatePracticeRequest({ topic: '' }).valid, false);
  assert.equal(validatePracticeRequest({ topic: 'Quadratic Equations' }).valid, true);
});

test('isValidMimeType recognizes supported image types', () => {
  assert.equal(isValidMimeType('image/png'), true);
  assert.equal(isValidMimeType('image/jpeg'), true);
  assert.equal(isValidMimeType('image/webp'), true);
  assert.equal(isValidMimeType('text/plain'), false);
});
