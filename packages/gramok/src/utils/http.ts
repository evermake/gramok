import type http from 'node:http'
import { Buffer } from 'node:buffer'

export function readWholeBody(req: http.IncomingMessage): Promise<Buffer> {
  const { promise, resolve, reject } = Promise.withResolvers<Buffer>()
  const body: Array<Buffer> = []
  req
    .on('data', (chunk) => {
      body.push(chunk)
    })
    .once('end', () => {
      resolve(Buffer.concat(body))
    })
    .once('error', (error) => {
      reject(error)
    })
  return promise
}
