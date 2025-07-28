export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const LATIN_LOWER = 'abcdefghijklmnopqrstuvwxyz'
export const LATIN_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
export const DIGITS = '0123456789'

export function randStr(
  n: number,
  alphabet: string = `${LATIN_LOWER}${LATIN_UPPER}${DIGITS}`,
): string {
  return Array
    .from({ length: n }, () => alphabet[randInt(0, alphabet.length - 1)])
    .join('')
}

export function randBool(): boolean {
  return Math.random() < 0.5
}

export function randItem<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)]
}
