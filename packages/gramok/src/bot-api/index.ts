import type { OutgoingHttpHeaders } from 'node:http'
import type { Telegram } from '../telegram'
import type { QueryResult } from './methods'
import http from 'node:http'
import { METHODS } from './methods'

/**
 * Mock implementation of {@link https://github.com/tdlib/telegram-bot-api Telegram Bot API}.
 *
 * - It uses the {@link Telegram mocked Telegram} under the hood.
 * - It implements bot updates queuing mechanism.
 */
export class BotApi {
  #telegram: Telegram
  #server: http.Server

  constructor(telegram: Telegram) {
    this.#telegram = telegram
    this.#server = http.createServer(this.handleHttpRequest.bind(this))
  }

  public start(options: { port: number }) {
    if (this.#server.listening) {
      throw new Error('server has been already started and is listening')
    }

    const { promise, resolve, reject } = Promise.withResolvers<void>()
    const onError = (error: unknown) => {
      reject(error)
    }
    this.#server.once('error', onError)
    this.#server.listen({ port: options.port }, () => {
      this.#server.off('error', onError)
      resolve()
    })
    return promise
  }

  public async stop() {
    const { promise, reject, resolve } = Promise.withResolvers<void>()
    this.#server.close((error) => {
      if (error) {
        reject(error)
      }
      else {
        resolve()
      }
    })
    return promise
  }

  private handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    const httpMethod = (req.method ?? '').toUpperCase()
    if (!['GET', 'POST', 'OPTIONS'].includes(httpMethod)) {
      res.writeHead(501)
      res.end()
      return
    }

    let url
    try {
      url = new URL(`http://localhost${req.url ?? ''}`)
    }
    catch (err) {
      console.warn('Invalid URL: ', err)
      res.writeHead(400)
      res.end()
      return
    }

    /**
     * - `/bot` part is required and case-sensitive.
     * - Token must be in form "<integer>:<string>" (see https://github.com/tdlib/telegram-bot-api/blob/2e1fb0330c93a014f723f5b5d8befe9dc9fc1b7d/telegram-bot-api/ClientManager.cpp#L67).
     * - Adding trailing slash at the end produces 404.
     */
    const PATH_REGEX = /^\/bot(?<token1>\d+):(?<token2>[\w\-]+)\/(?<method>\w+)$/

    const match = PATH_REGEX.exec(url.pathname)
    const botId = Number.parseInt(match?.groups?.token1 ?? '')
    const botSecret = match?.groups?.token2
    const methodName = match?.groups?.method

    if (!botSecret || !methodName || !Number.isSafeInteger(botId) || botId <= 0) {
      failQuery(res, 404)
      return
    }

    const method = METHODS[methodName.toLowerCase()]
    if (!method) {
      failQuery(res, 404)
      return
    }

    if (httpMethod === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    const bot = null // todo
    if (!bot) {
      // https://github.com/tdlib/telegram-bot-api/blob/2e1fb0330c93a014f723f5b5d8befe9dc9fc1b7d/telegram-bot-api/ClientManager.cpp#L67
    }

    // 1. If not POST or GET — return method not supported
    // 2. If GET — parse params from HTTP query
    // 3. If POST — praser

    method.call(this, 'todo', 'todo')
  }
}

function sendQueryResult(res: http.ServerResponse, result: QueryResult) {
  const headers: OutgoingHttpHeaders = { 'content-type': 'application/json' }
  const statusCode = result.ok ? 200 : result.error_code
  const retryAfter = result.ok ? 0 : (result.parameters?.retry_after ?? 0)
  if (retryAfter > 0) {
    headers['retry-after'] = retryAfter.toString()
  }
  res.writeHead(statusCode, headers)
  res.end(JSON.stringify(result))
}

function failQuery(res: http.ServerResponse, statusCode: number) {
  let description = 'Unknown Error'
  switch (statusCode) {
    case 400:
      description = 'Bad Request'
      break
    case 401:
      description = 'Unauthorized'
      break
    case 403:
      description = 'Forbidden'
      break
    case 404:
      description = 'Not Found'
      break
    case 500:
      description = 'Internal Server Error'
      break
    case 501:
      description = 'Not Implemented'
      break
  }
  sendQueryResult(res, { ok: false, error_code: statusCode, description })
}
