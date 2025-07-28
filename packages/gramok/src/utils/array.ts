/**
 * Returns an array of items that belong to either array but not both.
 */
export function arraysDiff<T>(a: T[], b: T[]): T[] {
  return [
    ...a.filter(item => !b.includes(item)),
    ...b.filter(item => !a.includes(item)),
  ]
}

/**
 * Checks that the array is sorted, or throws an error otherwise.
 */
export function checkSorted<T>(
  arr: T[],
  compare: (a: T, b: T) => number,
): void {
  for (let i = 1; i < arr.length; i++) {
    if (compare(arr[i], arr[i - 1]) < 0) {
      throw new Error('Check failed: array is not sorted')
    }
  }
}
