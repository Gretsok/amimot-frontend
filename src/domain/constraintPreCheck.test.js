import { describe, it, expect } from 'vitest';
import {
  violatesConstraint,
  violatesRoundLetter,
  precheckWord,
  applyNewConstraint,
  precheckConstraintCard,
} from './constraintPreCheck';

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

describe('applyNewConstraint', () => {
  it('appends the new constraint when nothing conflicts', () => {
    const existing = [{ id: 'c1', type: 'MAX_LENGTH', value: 8, order: 1 }];
    const added = { id: 'new', type: 'FORBID_LETTER', value: 'Z' };
    const { activeConstraints, destroyed } = applyNewConstraint(existing, added);

    expect(activeConstraints).toHaveLength(2);
    expect(destroyed).toEqual([]);
  });

  it('mutually cancels with the OLDEST conflicting opposite, destroying both', () => {
    const existing = [
      { id: 'old', type: 'IMPOSE_LETTER', value: 'A', order: 1 },
      { id: 'recent', type: 'IMPOSE_LETTER', value: 'A', order: 5 },
    ];
    const added = { id: 'new', type: 'FORBID_LETTER', value: 'a' };
    const { activeConstraints, destroyed } = applyNewConstraint(existing, added);

    expect(destroyed).toEqual(['old', 'new']);
    expect(activeConstraints.map((c) => c.id)).toEqual(['recent']);
  });

  it('treats incompatible length bounds as a conflict', () => {
    const existing = [{ id: 'min', type: 'MIN_LENGTH', value: 8, order: 1 }];
    const { destroyed } = applyNewConstraint(existing, { id: 'new', type: 'MAX_LENGTH', value: 4 });
    expect(destroyed).toEqual(['min', 'new']);
  });
});

describe('precheckConstraintCard', () => {
  const base = { ownerId: 'p1', letter: 'C', constantMinWordLength: 2 };

  it('refuses a card that would invalidate the player\'s own trap word', () => {
    const { valid, reason } = precheckConstraintCard({
      ...base,
      type: 'FORBID_LETTER',
      value: 'H',
      trapWord: 'chat', // contient un "h"
      activeConstraints: [],
    });
    expect(valid).toBe(false);
    expect(reason).toBe('SELF_INVALIDATING_CARD');
  });

  it('allows a card that leaves the own trap word valid', () => {
    const { valid } = precheckConstraintCard({
      ...base,
      type: 'FORBID_LETTER',
      value: 'Z',
      trapWord: 'chat',
      activeConstraints: [],
    });
    expect(valid).toBe(true);
  });

  // Cas subtil : une carte immédiatement auto-annulée ne s'applique jamais,
  // donc elle ne peut rien invalider — la bloquer serait un faux positif qui
  // empêcherait un coup pourtant légal côté serveur.
  it('allows a card that gets auto-cancelled, even if it would otherwise self-invalidate', () => {
    const { valid } = precheckConstraintCard({
      ...base,
      type: 'FORBID_LETTER',
      value: 'H',
      trapWord: 'chat',
      activeConstraints: [{ id: 'opp', type: 'IMPOSE_LETTER', value: 'H', ownerId: 'p2', order: 1 }],
    });
    expect(valid).toBe(true);
  });

  it('ignores other players\' constraints when re-checking the own trap word', () => {
    const { valid } = precheckConstraintCard({
      ...base,
      type: 'MAX_LENGTH',
      value: 10,
      trapWord: 'chat',
      activeConstraints: [{ id: 'foreign', type: 'FORBID_LETTER', value: 'C', ownerId: 'p2', order: 1 }],
    });
    expect(valid).toBe(true);
  });

  it('is a no-op before the player has set a trap word (mirrors the server guard)', () => {
    expect(precheckConstraintCard({ ...base, type: 'FORBID_LETTER', value: 'C', trapWord: '' }).valid).toBe(true);
    expect(precheckConstraintCard({ ...base, type: 'FORBID_LETTER', value: 'C', trapWord: undefined }).valid).toBe(true);
  });

  it('never blocks DESTROY_CONSTRAINT (it never becomes a persistent constraint)', () => {
    const { valid } = precheckConstraintCard({
      ...base,
      type: 'DESTROY_CONSTRAINT',
      value: 'some-id',
      trapWord: 'chat',
      activeConstraints: [],
    });
    expect(valid).toBe(true);
  });
});
