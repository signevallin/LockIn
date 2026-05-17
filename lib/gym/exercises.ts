import type { WorkoutExercise, ExerciseCategory } from '@/lib/types';

export const EXERCISE_CATEGORIES: ExerciseCategory[] = [
  'Bröst', 'Ben', 'Rygg', 'Axlar', 'Biceps', 'Triceps', 'Mage',
];

export const STATIC_EXERCISES: WorkoutExercise[] = [
  // Bröst
  { id: 'bench-barbell', name: 'Bänkpress', category: 'Bröst', type: 'free_weight' },
  { id: 'bench-dumbbell', name: 'Hantelpress liggande', category: 'Bröst', type: 'free_weight' },
  { id: 'incline-bench', name: 'Lutande bänkpress', category: 'Bröst', type: 'free_weight' },
  { id: 'chest-press-machine', name: 'Bröstpress', category: 'Bröst', type: 'machine' },
  { id: 'cable-fly', name: 'Kabelkorsning', category: 'Bröst', type: 'machine' },
  { id: 'dips', name: 'Dips', category: 'Bröst', type: 'bodyweight' },
  // Ben
  { id: 'squat', name: 'Knäböj', category: 'Ben', type: 'free_weight' },
  { id: 'deadlift', name: 'Marklyft', category: 'Ben', type: 'free_weight' },
  { id: 'romanian-deadlift', name: 'Rumänsk marklyft', category: 'Ben', type: 'free_weight' },
  { id: 'leg-press', name: 'Benpress', category: 'Ben', type: 'machine' },
  { id: 'leg-extension', name: 'Benspark', category: 'Ben', type: 'machine' },
  { id: 'leg-curl', name: 'Benböjning', category: 'Ben', type: 'machine' },
  { id: 'calf-press', name: 'Vadpress', category: 'Ben', type: 'machine' },
  { id: 'lunges', name: 'Utfall', category: 'Ben', type: 'free_weight' },
  // Rygg
  { id: 'lat-pulldown', name: 'Latsdrag', category: 'Rygg', type: 'machine' },
  { id: 'seated-row', name: 'Sittande rodd', category: 'Rygg', type: 'machine' },
  { id: 'barbell-row', name: 'Rodd med skivstång', category: 'Rygg', type: 'free_weight' },
  { id: 'pull-ups', name: 'Chins', category: 'Rygg', type: 'bodyweight' },
  { id: 'cable-row', name: 'Kabeldrag', category: 'Rygg', type: 'machine' },
  { id: 'hyperextension', name: 'Hyperextension', category: 'Rygg', type: 'bodyweight' },
  { id: 'sumo-deadlift', name: 'Sumo marklyft', category: 'Rygg', type: 'free_weight' },
  { id: 'dumbbell-row', name: 'Hantelrodd', category: 'Rygg', type: 'free_weight' },
  // Axlar
  { id: 'overhead-press', name: 'Militärpress', category: 'Axlar', type: 'free_weight' },
  { id: 'shoulder-press-machine', name: 'Axelpress', category: 'Axlar', type: 'machine' },
  { id: 'lateral-raise', name: 'Sidolyft', category: 'Axlar', type: 'free_weight' },
  { id: 'front-raise', name: 'Framåtlyft', category: 'Axlar', type: 'free_weight' },
  { id: 'face-pull', name: 'Face pull', category: 'Axlar', type: 'machine' },
  { id: 'shrugs', name: 'Shrugs', category: 'Axlar', type: 'free_weight' },
  // Biceps
  { id: 'barbell-curl', name: 'Bicepscurl (skivstång)', category: 'Biceps', type: 'free_weight' },
  { id: 'dumbbell-curl', name: 'Bicepscurl (hantel)', category: 'Biceps', type: 'free_weight' },
  { id: 'hammer-curl', name: 'Hammarcurl', category: 'Biceps', type: 'free_weight' },
  { id: 'cable-curl', name: 'Kabelbicepscurl', category: 'Biceps', type: 'machine' },
  { id: 'preacher-curl', name: 'Predikantbänk', category: 'Biceps', type: 'free_weight' },
  // Triceps
  { id: 'triceps-pushdown', name: 'Triceps pushdown', category: 'Triceps', type: 'machine' },
  { id: 'overhead-triceps', name: 'Overhead extension', category: 'Triceps', type: 'free_weight' },
  { id: 'triceps-dips', name: 'Trikdips', category: 'Triceps', type: 'bodyweight' },
  { id: 'skullcrushers', name: 'Skullcrushers', category: 'Triceps', type: 'free_weight' },
  { id: 'cable-triceps', name: 'Kabeltriceps', category: 'Triceps', type: 'machine' },
  // Mage
  { id: 'plank', name: 'Plankan', category: 'Mage', type: 'bodyweight' },
  { id: 'situps', name: 'Situps', category: 'Mage', type: 'bodyweight' },
  { id: 'cable-crunch', name: 'Kabelcrunch', category: 'Mage', type: 'machine' },
  { id: 'leg-raise', name: 'Benspark liggande', category: 'Mage', type: 'bodyweight' },
  { id: 'back-extension', name: 'Rygglyft', category: 'Mage', type: 'bodyweight' },
  { id: 'russian-twist', name: 'Russian twist', category: 'Mage', type: 'bodyweight' },
];

export function getExerciseById(id: string): WorkoutExercise | undefined {
  return STATIC_EXERCISES.find(e => e.id === id);
}
