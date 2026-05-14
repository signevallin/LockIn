const QUOTES = [
  'Discipline is choosing between what you want now and what you want most.',
  'Small daily improvements lead to staggering long-term results.',
  "You don't rise to the level of your goals, you fall to the level of your systems.",
  'The secret of getting ahead is getting started.',
  "It always seems impossible until it's done.",
  'Don\'t watch the clock; do what it does. Keep going.',
  'Success is the sum of small efforts, repeated day in and day out.',
  'Dream big. Start small. Act now.',
];

export function getDailyQuote(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return QUOTES[dayOfYear % QUOTES.length];
}
