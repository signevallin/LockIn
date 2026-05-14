export interface Goal {
  id: string;
  title: string;
  category: string;
  deadline: Date;
  progress: number;
  createdAt: Date;
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

export interface Promise {
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
  promises: (Pick<Promise, 'title' | 'stakeAmount' | 'charityOrg'> & { daysLeft: number })[];
  lastCheckIn: Pick<CheckIn, 'mood' | 'reflection'> | null;
}
