import { describe, it, expect } from 'vitest';
import { constraintLabel } from './constraintLabels';

describe('constraintLabel', () => {
  it('describes each constraint type with its value', () => {
    expect(constraintLabel({ type: 'IMPOSE_LETTER', value: 'A' })).toMatch(/A/);
    expect(constraintLabel({ type: 'FORBID_LETTER', value: 'Z' })).toMatch(/Z/);
    expect(constraintLabel({ type: 'MAX_LENGTH', value: 5 })).toMatch(/5/);
    expect(constraintLabel({ type: 'MIN_LENGTH', value: 3 })).toMatch(/3/);
  });
});
