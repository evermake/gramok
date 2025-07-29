import type { OutgoingHttpHeaders } from 'node:http'
import type { Result } from '../td/result'
import type { Telegram } from '../telegram/telegram'
import type { QueryResult } from './query'
import http from 'node:http'
import { ERR, OK, ResultError } from '../td/result'
import { readWholeBody } from '../utils/http'
import { parseUrl } from '../utils/url'
import { BotState } from './bot-state'
import { METHODS } from './methods'
import { Query } from './query'

/**
 * Mock implementation of {@link https://github.com/tdlib/telegram-bot-api Telegram Bot API}.
 *
 * - It uses the {@link Telegram mocked Telegram} under the hood.
 * - It implements bot updates queuing mechanism.
 */
export class BotApi {
  #telegram: Telegram
  #server: http.Server
  #bots: Map<number, BotState>

  constructor(telegram: Telegram) {
    this.#telegram = telegram
    this.#server = http.createServer(this.handleHttpRequest.bind(this))
    this.#bots = new Map()
  }

  public start(options: { port: number }) {
    if (this.#server.listening) {
      throw new Error('server has been already started and is listening')
    }

    const { promise, resolve, reject } = Promise.withResolvers<void>()
    this.#server.once('error', reject)
    this.#server.listen({ port: options.port }, () => {
      this.#server.off('error', reject)
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

    // 1. `/bot` part is required and case-sensitive
    // 2. token must be in form "<integer>:<string>" (see ClientManager::send at https://github.com/tdlib/telegram-bot-api/blob/master/telegram-bot-api/ClientManager.cpp)
    // 3. adding trailing slash at the end produces 404
    const PATH_REGEX = /^\/bot(?<token1>\d+):(?<token2>[\w\-]+)\/(?<method>\w+)$/

    const url = parseUrl(req.url)
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

    if (!this.#telegram.checkBotAuth(botId, botSecret)) {
      failQuery(res, 401)
      return
    }

    parseParams(req)
      .then((params) => {
        const bot = this.getBotState(botId)
        const query = new Query(this.#telegram, bot, params.unwrap())
        return method(query)
      })
      .then(result => sendQueryResult(res, result))
      .catch((error) => {
        if (error instanceof ResultError) {
          failQuery(res, error.code ?? 400, error.message)
        }
        else {
          console.error('Error processing request:', error)
          failQuery(res, 500)
        }
      })
  }

  private getBotState(botId: number): BotState {
    let bot = this.#bots.get(botId)
    if (bot)
      return bot
    bot = new BotState(botId)
    this.#bots.set(botId, bot)
    return bot
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

function failQuery(res: http.ServerResponse, statusCode: number, description?: string) {
  if (!description) {
    description = 'Unknown Error'
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
  }
  sendQueryResult(res, { ok: false, error_code: statusCode, description })
}

/**
 * Parses parameters of a Bot API method from an HTTP request.
 *
 * {@link https://github.com/tdlib/telegram-bot-api/blob/master/telegram-bot-api/Query.cpp telegram_bot_api::Query}
 * gets them directly from the
 * {@link https://github.com/tdlib/td/blob/master/tdnet/td/net/HttpReader.cpp td::HttpReader}.
 */
async function parseParams(req: http.IncomingMessage): Promise<Result<Map<string, string>>> {
  const params: [string, string][] = []
  const url = parseUrl(req.url)
  params.push(...url.searchParams.entries())
  const contentType = (req.headers['content-type'] ?? 'application/octet-stream').toLowerCase()
  const data = await readWholeBody(req)
  if (contentType.includes('application/json')) {
    let parsedJson
    try {
      parsedJson = JSON.parse(data.toString('utf-8'))
    }
    catch {
      return ERR(400, 'Bad Request: malformed JSON')
    }
    if (typeof parsedJson === 'string') {
      params.push(['content', parsedJson])
    }
    else if (typeof parsedJson === 'object' && parsedJson !== null && !Array.isArray(parsedJson)) {
      Object
        .entries(parsedJson)
        .forEach(([key, value]) => {
          params.push([key, JSON.stringify(value)])
        })
    }
    else {
      return ERR(400, 'Bad Request: JSON object expected')
    }
  }
  else if (
    contentType.includes('multipart/form-data')
    || contentType.includes('application/x-www-form-urlencoded')
  ) {
    return ERR(501, `content type "${contentType}" is not yet supported by gramok`)
  }
  params.reverse() // Duplicate parameters that come first should overwrite others.
  return OK(new Map(params))
}
