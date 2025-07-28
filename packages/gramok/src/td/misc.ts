import type { Result } from './result'
import { ERR, OK } from './result'

export function toIntegerSafe(str: string): Result<number> {
  const res = toInteger(str)
  if (res.toString() === str) {
    return OK(res)
  }
  return ERR(`Can't parse as an integer string "${str}"`)
}

export function toInteger(str: string): number {
  return Number.parseInt(str, 10)
}
