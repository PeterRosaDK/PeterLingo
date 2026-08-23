export const PI_DECIMALS =
  '14159265358979323846264338327950288419716939937510' +
  '58209749445923078164062862089986280348253421170679' +
  '82148086513282306647093844609550582231725359408128' +
  '48111745028410270193852110555964462294895493038196' +
  '44288109756659334461284756482337867831652712019091' +
  '45648566923460348610454326648213393607260249141273' +
  '72458700660631558817488152092096282925409171536436' +
  '78925903600113305305488204665213841469519415116094' +
  '33057270365759591953092186117381932611793105118548' +
  '07446237996274956735188575272489122793818301194912';

export const PI_100 = PI_DECIMALS.slice(0, 100);
export const PI_CONTENT_LIMIT = PI_DECIMALS.length;
export const INITIAL_PI_FAMILIARITY = 30;

export function digits(startPosition: number, count: number): string {
  if (!Number.isInteger(startPosition) || startPosition < 1)
    throw new RangeError('Positioner begynder ved 1.');
  if (!Number.isInteger(count) || count < 1) throw new RangeError('Antallet skal være positivt.');
  const result = PI_DECIMALS.slice(startPosition - 1, startPosition - 1 + count);
  if (result.length !== count)
    throw new RangeError(`Området går ud over de ${PI_CONTENT_LIMIT} tilgængelige cifre.`);
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

export function evaluatePiPrefix(input: string, limit = PI_CONTENT_LIMIT): PiPrefixProgress {
  const boundedLimit = Math.max(1, Math.min(PI_CONTENT_LIMIT, Math.trunc(limit)));
  const expectedDigits = PI_DECIMALS.slice(0, boundedLimit);
  const normalized = input.replace(/\D/g, '').slice(0, boundedLimit);
  const wrongIndex = [...normalized].findIndex((digit, index) => digit !== expectedDigits[index]);
  if (wrongIndex >= 0) {
    return {
      normalized,
      correctDigits: wrongIndex,
      complete: false,
      wrong: {
        position: wrongIndex + 1,
        typed: normalized[wrongIndex]!,
        expected: expectedDigits[wrongIndex]!,
      },
    };
  }
  return {
    normalized,
    correctDigits: normalized.length,
    complete: normalized.length === boundedLimit,
  };
}
