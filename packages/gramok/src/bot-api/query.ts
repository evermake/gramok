import type { Telegram } from '../telegram/telegram'
import type { BotState } from './bot-state'
import type { UpdateType } from './types'
import { JsonArray, jsonDecode, JsonString } from '../td/json'
import { ResultError } from '../td/result'
import { arraysDiff } from '../utils/array'
import { clamp } from '../utils/clamp'
import { DEFAULT_ALLOWED_UPDATE_TYPES } from './constants'
import { isUpdateType } from './types'

export class Query {
  constructor(
    public readonly tg: Telegram,
    public readonly bot: BotState,
    private readonly params: Map<string, string>,
  ) {}

  public arg(name: string): string {
    return this.params.get(name) ?? ''
  }

  /**
   * @todo Make sure behavior is the same as in telegram_bot_api implementation
   *  for invalid integers.
   */
  public getIntegerArg(
    fieldName: string,
    defaultValue: number,
    minValue: number = Number.MIN_SAFE_INTEGER,
    maxValue: number = Number.MAX_SAFE_INTEGER,
  ): number {
    const sArg = this.arg(fieldName)
    let value = sArg ? Number.parseInt(sArg, 10) : Number.NaN
    if (!Number.isSafeInteger(value)) {
      value = defaultValue
    }
    return clamp(value, minValue, maxValue)
  }

  public getBoolArg(fieldName: string) {
    const value = this.arg(fieldName).toLowerCase().trim()
    return value === 'true' || value === 'yes' || value === '1'
  }

  /**
   * @see {@link https://github.com/tdlib/telegram-bot-api/blob/master/telegram-bot-api/Client.cpp Client::update_allowed_update_types}
   */
  public updateAllowedUpdateTypes(): boolean {
    const newTypes = this.getAllowedUpdateTypes(this.arg('allowed_updates'))
    const oldTypes = this.bot.updates.allowedUpdateTypes
    if (newTypes.length > 0 && arraysDiff(newTypes, oldTypes).length > 0) {
      this.bot.updates.allowedUpdateTypes = newTypes.slice()
      return true
    }
    return false
  }

  /**
   * @see {@link https://github.com/tdlib/telegram-bot-api/blob/master/telegram-bot-api/Client.cpp Client::get_allowed_update_types}
   */
  public getAllowedUpdateTypes(allowedUpdates: string): UpdateType[] {
    if (!allowedUpdates) {
      return []
    }

    try {
      const value = jsonDecode(allowedUpdates).unwrap()
      if (!(value instanceof JsonArray)) {
        return []
      }
      const result: UpdateType[] = []
      for (const updateTypeName of value.getArray()) {
        if (!(updateTypeName instanceof JsonString)) {
          return []
        }
        const typeName = updateTypeName.getString().toLowerCase()
        if (isUpdateType(typeName)) {
          result.push(typeName)
        }
      }
      if (result.length === 0)
        return DEFAULT_ALLOWED_UPDATE_TYPES.slice()
      return result
    }
    catch (error) {
      if (error instanceof ResultError) {
        return []
      }
      throw error
    }
  }
}

/**
 * Result of processing an incoming query.
 *
 * @see https://core.telegram.org/bots/api#making-requests
 * @see https://github.com/tdlib/telegram-bot-api/tree/master/telegram-bot-api/Query.h
 */
export type QueryResult = QueryResultOk | QueryResultError

export interface QueryResultOk {
  ok: true
  result: unknown
  description?: string
}

export interface QueryResultError {
  ok: false
  error_code: number
  description: string
  parameters?: {
    migrate_to_chat_id?: number
    retry_after?: number
  }
}

export function queryOk(result: unknown, description?: string): QueryResultOk {
  return { ok: true, result, description }
}

export function queryError(
  error_code: number,
  description: string,
  parameters?: QueryResultError['parameters'],
): QueryResultError {
  return { ok: false, error_code, description, parameters }
}
