export type SongTimestamps = Record<string, number>;
export function parseSongTimestamps(value: unknown): SongTimestamps {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Tidsmærker skal være et JSON-objekt.');
  const result: SongTimestamps = {};
  for (const [key, offset] of Object.entries(value)) {
    if (
      !/^\d+$/.test(key) ||
      Number(key) < 1 ||
      Number(key) > 102 ||
      typeof offset !== 'number' ||
      !Number.isFinite(offset) ||
      offset < 0
    )
      throw new Error('Brug sangposition 1–102 og offset i millisekunder.');
    result[key] = offset;
  }
  return result;
}
export function songClip(
  timestamps: SongTimestamps,
  index: number
): { start: number; end: number } | null {
  const start = timestamps[index];
  if (start === undefined) return null;
  const later = Object.values(timestamps)
    .filter((t) => t > start)
    .sort((a, b) => a - b)[0];
  return { start: start / 1000, end: Math.min(start + 4000, later ?? start + 4000) / 1000 };
}
