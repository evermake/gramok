/**
 * @see https://github.com/tdlib/td/blob/master/tdutils/td/utils/Status.h
 *
 * Rules:
 * - If a return type of a function is `Result<T>`, then it can:
 *   - Return `ResultOk<T>`
 *   - Return `ResultError`
 *   - Throw `ResultError`
 */

export type Result<T> = ResultOk<T> | ResultError

export class ResultOk<T> {
  constructor(public readonly value: T) {}
  isOk(): this is ResultOk<T> { return true }
  isError(): this is ResultError { return false }
  unwrap(): T { return this.value }
}

export class ResultError extends Error {
  public readonly name: string = 'ResultError'
  public readonly message: string
  public readonly code: number | null

  constructor(message: string, code: number | null = null) {
    super(message)
    this.message = message
    this.code = code
  }

  isOk(): this is ResultOk<any> { return false }
  isError(): this is ResultError { return true }
  unwrap(): never {
    // eslint-disable-next-line no-throw-literal
    throw this
  }
}

export function OK<T>(v: T): ResultOk<T> {
  return new ResultOk(v)
}
export function ERR(code: number, message: string): ResultError
export function ERR(message: string): ResultError
export function ERR(arg1: number | string, arg2?: string): ResultError {
  let code: number | null = null
  let message: string
  if (typeof arg1 === 'number') {
    code = arg1
    message = arg2 ?? ''
  }
  else {
    message = arg1
  }
  return new ResultError(message, code)
}
export function SAFE<T>(fn: () => Result<T>): Result<T> {
  try {
    return fn()
  }
  catch (error) {
    if (error instanceof ResultError) {
      return error
    }
    throw error
  }
}
