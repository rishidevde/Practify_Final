function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function diffInDays(a, b) {
  const left = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const right = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((left.getTime() - right.getTime()) / (24 * 60 * 60 * 1000));
}

export function computeStreak(attempts) {
  if (!Array.isArray(attempts) || !attempts.length) {
    return { currentStreak: 0, longestStreak: 0, activeToday: false };
  }

  const days = attempts
    .map((a) => new Date(a.created_at))
    .sort((a, b) => b - a)
    .filter((date, index, arr) => index === 0 || !isSameDay(date, arr[index - 1]));

  const today = new Date();
  let currentStreak = 0;
  if (isSameDay(days[0], today)) currentStreak = 1;
  else if (diffInDays(today, days[0]) === 1) currentStreak = 1;

  for (let i = 1; i < days.length && currentStreak > 0; i += 1) {
    if (diffInDays(days[i - 1], days[i]) === 1) currentStreak += 1;
    else break;
  }

  let longestStreak = 1;
  let rolling = 1;
  for (let i = 1; i < days.length; i += 1) {
    if (diffInDays(days[i - 1], days[i]) === 1) rolling += 1;
    else rolling = 1;
    if (rolling > longestStreak) longestStreak = rolling;
  }

  return {
    currentStreak,
    longestStreak,
    activeToday: isSameDay(days[0], today),
  };
}
