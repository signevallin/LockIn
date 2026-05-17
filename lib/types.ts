export interface ScheduledTask {
  title: string;
  weekdays: number[]; // JS getDay(): 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
}

export interface Goal {
  id: string;
  title: string;
  category: string;
  deadline: Date;
  progress: number;
  createdAt: Date;
  scheduledTasks?: ScheduledTask[];
}

export interface SubGoal {
  id: string;
  title: string;
  completed: boolean;
  completedAt: Date | null;
}

export interface Task {
  id: string;
  title: string;
  category: string;
  goalId: string | null;
  createdAt: Date;
  isScheduled?: boolean;
}

export interface CheckIn {
  date: string; // YYYY-MM-DD
  mood: 1 | 2 | 3 | 4 | 5;
  reflection: string;
  createdAt: Date;
}

export interface Milestone {
  label: string;
  date: Date;
  percentage: number;
  completed: boolean;
}

export interface UserPromise {
  id: string;
  title: string;
  category: string;
  deadline: Date;
  durationDays: number;
  stakeAmount: number;
  charityOrg: string;
  milestones: Milestone[];
  status: 'active' | 'completed' | 'broken';
  createdAt: Date;
}

export interface FocusSession {
  id: string;
  mode: 'focus' | 'deep_work' | 'study' | 'custom';
  durationMinutes: number;
  completedAt: Date;
}

export interface CoachMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CoachContext {
  streak: number;
  totalXp: number;
  goals: Pick<Goal, 'title' | 'progress' | 'deadline'>[];
  promises: (Pick<UserPromise, 'title' | 'stakeAmount' | 'charityOrg'> & { daysLeft: number })[];
  lastCheckIn: Pick<CheckIn, 'mood' | 'reflection'> | null;
}

export type ExerciseType = 'free_weight' | 'machine' | 'bodyweight';

export type ExerciseCategory =
  | 'Bröst'
  | 'Ben'
  | 'Rygg'
  | 'Axlar'
  | 'Biceps'
  | 'Triceps'
  | 'Mage';

export interface WorkoutExercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  type: ExerciseType;
  isCustom?: boolean;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exerciseIds: string[];
  createdAt: Date;
}

export interface WorkoutSet {
  weight: number;
  reps: number;
}

export interface SessionExercise {
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: string;
  templateId: string;
  templateName: string;
  date: string; // "YYYY-MM-DD"
  exercises: SessionExercise[];
  completedAt: Date;
}

export interface HealthData {
  steps: number;
  totalCalories: number;      // active + resting kcal
  workoutMinutes: number;
  syncedAt: Date;
}

export interface HealthGoals {
  dailySteps: number;
  dailyCalories: number;
  healthSyncToken?: string;
}
