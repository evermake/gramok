export class error extends Error {
  constructor(
    public readonly code: number,
    public readonly message: string,
  ) {
    super(message)
  }
}

export type object_ptr<T> = T | null | error
