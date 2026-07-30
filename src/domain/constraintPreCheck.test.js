import { describe, it, expect } from 'vitest';
import { violatesConstraint, violatesRoundLetter, precheckWord } from './constraintPreCheck';

describe('violatesConstraint', () => {
  it('IMPOSE_LETTER is satisfied case-insensitively', () => {
    expect(violatesConstraint('Chat', { type: 'IMPOSE_LETTER', value: 'a' })).toBe(false);
    expect(violatesConstraint('Chat', { type: 'IMPOSE_LETTER', value: 'z' })).toBe(true);
  });

  it('FORBID_LETTER is violated when the word contains the letter', () => {
    expect(violatesConstraint('chat', { type: 'FORBID_LETTER', value: 'h' })).toBe(true);
    expect(violatesConstraint('chat', { type: 'FORBID_LETTER', value: 'z' })).toBe(false);
  });

  it('MAX_LENGTH / MIN_LENGTH', () => {
    expect(violatesConstraint('chat', { type: 'MAX_LENGTH', value: 3 })).toBe(true);
    expect(violatesConstraint('chat', { type: 'MIN_LENGTH', value: 5 })).toBe(true);
    expect(violatesConstraint('chat', { type: 'MAX_LENGTH', value: 10 })).toBe(false);
  });
});

describe('violatesRoundLetter', () => {
  it('requires the word to START with the round letter', () => {
    expect(violatesRoundLetter('Chat', 'c')).toBe(false);
    expect(violatesRoundLetter('Chat', 'h')).toBe(true);
  });

  it('is a no-op when no letter is provided', () => {
    expect(violatesRoundLetter('chat', null)).toBe(false);
  });
});

describe('precheckWord', () => {
  it('is valid when everything is satisfied', () => {
    const { valid } = precheckWord('chat', {
      letter: 'C',
      constraints: [{ id: 'c1', type: 'MAX_LENGTH', value: 10 }],
    });
    expect(valid).toBe(true);
  });

  it('reports every violated id (constant, round letter, and card constraints)', () => {
    const { valid, violated } = precheckWord('a', {
      letter: 'Z',
      constraints: [{ id: 'c1', type: 'MIN_LENGTH', value: 5 }],
    });
    expect(valid).toBe(false);
    expect(violated).toEqual(expect.arrayContaining(['CONSTANT_MIN_LENGTH', 'ROUND_LETTER', 'c1']));
  });
});
