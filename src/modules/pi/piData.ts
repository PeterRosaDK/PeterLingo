export const PI_100 =
  '1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679';

export function digits(startPosition: number, count: number): string {
  if (!Number.isInteger(startPosition) || startPosition < 1)
    throw new RangeError('Positioner begynder ved 1.');
  if (!Number.isInteger(count) || count < 1) throw new RangeError('Antallet skal være positivt.');
  const result = PI_100.slice(startPosition - 1, startPosition - 1 + count);
  if (result.length !== count) throw new RangeError('Området går ud over de 100 cifre.');
  return result;
}

export function precedingDigits(startPosition: number, count: number): string {
  return digits(startPosition - count, count);
}

export function followingDigits(endPosition: number, count: number): string {
  return digits(endPosition + 1, count);
}

export interface PiPrefixProgress {
  normalized: string;
  correctDigits: number;
  complete: boolean;
  wrong?: { position: number; typed: string; expected: string };
}

export function evaluatePiPrefix(input: string): PiPrefixProgress {
  const normalized = input.replace(/\D/g, '').slice(0, PI_100.length);
  const wrongIndex = [...normalized].findIndex((digit, index) => digit !== PI_100[index]);
  if (wrongIndex >= 0) {
    return {
      normalized,
      correctDigits: wrongIndex,
      complete: false,
      wrong: {
        position: wrongIndex + 1,
        typed: normalized[wrongIndex]!,
        expected: PI_100[wrongIndex]!,
      },
    };
  }
  return {
    normalized,
    correctDigits: normalized.length,
    complete: normalized.length === PI_100.length,
  };
}
