import { getExerciseById, STATIC_EXERCISES, EXERCISE_CATEGORIES } from '@/lib/gym/exercises';

describe('getExerciseById', () => {
  it('returns exercise for known id', () => {
    const ex = getExerciseById('squat');
    expect(ex).toBeDefined();
    expect(ex!.name).toBe('Knäböj');
    expect(ex!.category).toBe('Ben');
    expect(ex!.type).toBe('free_weight');
  });

  it('returns undefined for unknown id', () => {
    expect(getExerciseById('does-not-exist')).toBeUndefined();
  });

  it('returns machine exercise under its muscle group', () => {
    const ex = getExerciseById('leg-press');
    expect(ex!.category).toBe('Ben');
    expect(ex!.type).toBe('machine');
  });
});

describe('STATIC_EXERCISES', () => {
  it('has at least 40 exercises', () => {
    expect(STATIC_EXERCISES.length).toBeGreaterThanOrEqual(40);
  });

  it('every exercise has a unique id', () => {
    const ids = STATIC_EXERCISES.map(e => e.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every exercise category is in EXERCISE_CATEGORIES', () => {
    for (const ex of STATIC_EXERCISES) {
      expect(EXERCISE_CATEGORIES).toContain(ex.category);
    }
  });
});
