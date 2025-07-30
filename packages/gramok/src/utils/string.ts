const encoder = new TextEncoder()

export function strSize(s: string): number {
  return encoder.encode(s).length
}
