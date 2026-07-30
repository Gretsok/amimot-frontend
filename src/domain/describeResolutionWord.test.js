import { describe, it, expect } from 'vitest';
import { describeWordOutcome } from './describeResolutionWord';

const scoringConfig = {
  pointsPerGroupMatch: 1,
  trapVictimPoints: 1,
  trapSetterPointsPerVictim: 2,
  selfTrapPenalty: -5,
};

describe('describeWordOutcome', () => {
  it('describes a non-trap group match for every submitter', () => {
    const outcome = describeWordOutcome(
      { word: 'chat', submitterIds: ['p1', 'p2'], isTrap: false, trapSetterIds: [], victimIds: [] },
      scoringConfig
    );
    expect(outcome.p1).toEqual([{ type: 'GROUP_MATCH', points: 2, groupSize: 2 }]);
    expect(outcome.p2).toEqual([{ type: 'GROUP_MATCH', points: 2, groupSize: 2 }]);
  });

  it('describes trap victims and a non-falling setter separately', () => {
    const outcome = describeWordOutcome(
      { word: 'loup', submitterIds: ['v1', 'v2'], isTrap: true, trapSetterIds: ['setter'], victimIds: ['v1', 'v2'] },
      scoringConfig
    );
    expect(outcome.v1).toEqual([{ type: 'TRAP_VICTIM', points: 1 }]);
    expect(outcome.v2).toEqual([{ type: 'TRAP_VICTIM', points: 1 }]);
    expect(outcome.setter).toEqual([{ type: 'TRAP_SETTER', points: 4, victimCount: 2 }]);
  });

  it('describes a self-trap fall AND the independent setter bonus for other victims (additive)', () => {
    const outcome = describeWordOutcome(
      { word: 'loup', submitterIds: ['setter', 'v1'], isTrap: true, trapSetterIds: ['setter'], victimIds: ['v1'] },
      scoringConfig
    );
    expect(outcome.setter).toEqual([
      { type: 'SELF_TRAP', points: -5 },
      { type: 'TRAP_SETTER', points: 2, victimCount: 1 },
    ]);
  });

  it('omits the setter-bonus entry when nobody else fell into the trap', () => {
    const outcome = describeWordOutcome(
      { word: 'loup', submitterIds: ['setter'], isTrap: true, trapSetterIds: ['setter'], victimIds: [] },
      scoringConfig
    );
    expect(outcome.setter).toEqual([{ type: 'SELF_TRAP', points: -5 }]);
  });

  it('gives every independent co-setter of an identical trap word the full bonus', () => {
    const outcome = describeWordOutcome(
      {
        word: 'loup',
        submitterIds: ['v1'],
        isTrap: true,
        trapSetterIds: ['s1', 's2'],
        victimIds: ['v1'],
      },
      scoringConfig
    );
    expect(outcome.s1).toEqual([{ type: 'TRAP_SETTER', points: 2, victimCount: 1 }]);
    expect(outcome.s2).toEqual([{ type: 'TRAP_SETTER', points: 2, victimCount: 1 }]);
  });
});
