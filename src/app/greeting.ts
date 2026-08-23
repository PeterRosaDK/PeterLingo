export type Greeting = 'Godnat' | 'Godmorgen' | 'Goddag' | 'Godaften';

export function greetingForHour(hour: number): Greeting {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23)
    throw new RangeError('Timetallet skal være et helt tal mellem 0 og 23.');
  if (hour < 7) return 'Godnat';
  if (hour < 11) return 'Godmorgen';
  if (hour < 18) return 'Goddag';
  return 'Godaften';
}

export function greetingForDate(date = new Date()): Greeting {
  return greetingForHour(date.getHours());
}
