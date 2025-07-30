/* eslint-disable new-cap */

import type { JsonValue } from '../td/json'
import type { Result } from '../td/result'
import type { Telegram } from '../telegram/telegram'
import type { BotState } from './bot-state'
import type { UpdateType } from './types'
import assert from 'node:assert'
import * as td_api from '../td/api'
import { JsonArray, jsonDecode, JsonNull, JsonObject, JsonString } from '../td/json'
import { ERR, OK, ResultError, SAFE } from '../td/result'
import { arraysDiff } from '../utils/array'
import { clamp } from '../utils/clamp'
import { strSize } from '../utils/string'
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

  /**
   * @see {@link https://github.com/tdlib/telegram-bot-api/blob/master/telegram-bot-api/Client.cpp Client::get_input_message_text}
   */
  public getInputMessageText(): Result<td_api.inputMessageText> {
    const linkPreviewOptions = this.getLinkPreviewOptions().unwrap()
    return getInputMessageText(
      this.arg('text'),
      linkPreviewOptions,
      this.arg('parse_mode'),
      this.getInputEntities('entities'),
    )
  }

  public getInputEntities(fieldName: string): JsonValue {
    const entities = this.arg(fieldName)
    if (entities.length > 0) {
      const value = SAFE(() => jsonDecode(entities))
      if (value.isOk()) {
        return value.value
      }
    }
    return new JsonNull()
  }

  public getLinkPreviewOptions(): Result<td_api.object_ptr<td_api.linkPreviewOptions>> {
    const linkPreviewOptions = this.arg('link_preview_options')
    if (linkPreviewOptions.length === 0) {
      return OK(getLinkPreviewOptions_1(this.getBoolArg('disable_web_page_preview')))
    }
    const rValue = SAFE(() => jsonDecode(linkPreviewOptions))
    if (rValue.isError()) {
      return ERR(400, 'Can\'t parse link preview options JSON object')
    }
    return getLinkPreviewOptions_2(rValue.unwrap())
  }
}

function getInputMessageText(
  text: string,
  linkPreviewOptions: td_api.object_ptr<td_api.linkPreviewOptions>,
  parseMode: string,
  inputEntities: JsonValue,
): Result<td_api.inputMessageText> {
  if (text.length === 0) {
    return ERR(400, 'Message text is empty')
  }
  const formattedText = getFormattedText(text, parseMode, inputEntities).unwrap()
  return OK(new td_api.inputMessageText(formattedText, linkPreviewOptions, false))
}

function getLinkPreviewOptions_1(disableWebPagePreview: boolean): td_api.object_ptr<td_api.linkPreviewOptions> {
  // legacy
  if (!disableWebPagePreview) {
    return null
  }
  return new td_api.linkPreviewOptions(true, '', false, false, false)
}

function getLinkPreviewOptions_2(value: JsonValue): Result<td_api.object_ptr<td_api.linkPreviewOptions>> {
  if (!(value instanceof JsonObject)) {
    return ERR(400, 'Object expected as link preview options')
  }
  const obj = value
  const is_disabled = obj.getOptionalBoolField('is_disabled').unwrap()
  const url = obj.getOptionalStringField('url').unwrap()
  const prefer_small_media = obj.getOptionalBoolField('prefer_small_media').unwrap()
  const prefer_large_media = obj.getOptionalBoolField('prefer_large_media').unwrap()
  const show_above_text = obj.getOptionalBoolField('show_above_text').unwrap()
  return OK(new td_api.linkPreviewOptions(is_disabled, url, prefer_small_media, prefer_large_media, show_above_text))
}

function getFormattedText(
  text: string,
  parseMode: string,
  inputEntities: JsonValue,
): Result<td_api.formattedText> {
  if (strSize(text) > (1 << 15)) {
    return ERR(400, 'Text is too long')
  }

  parseMode = parseMode.toLowerCase()
  if (text && parseMode && parseMode !== 'none') {
    let textParseMode: td_api.object_ptr<td_api.TextParseMode>
    if (parseMode === 'markdown') {
      textParseMode = new td_api.textParseModeMarkdown(1)
    }
    else if (parseMode === 'markdownv2') {
      textParseMode = new td_api.textParseModeMarkdown(2)
    }
    else if (parseMode === 'html') {
      textParseMode = new td_api.textParseModeHTML()
    }
    else {
      return ERR(400, 'Unsupported parse_mode')
    }

    const parsedText = td_api.parseTextEntities(text, textParseMode)
    if (parsedText instanceof td_api.error) {
      return ERR(parsedText.code, parsedText.message)
    }

    assert(parsedText instanceof td_api.formattedText)
    return OK(parsedText)
  }

  const entities: Array<td_api.object_ptr<td_api.textEntity>> = []
  if (inputEntities instanceof JsonArray) {
    for (const inputEntity of inputEntities.getArray()) {
      const rEntity = SAFE(() => getTextEntity(inputEntity))
      if (rEntity.isError()) {
        return ERR(400, `Can't parse MessageEntity: ${rEntity.message}`)
      }
      else if (rEntity.value === null) {
        continue
      }
      entities.push(rEntity.value)
    }
  }

  return OK(new td_api.formattedText(text, entities))
}

function getTextEntity(value: JsonValue): Result<td_api.object_ptr<td_api.textEntity>> {
  if (!(value instanceof JsonObject)) {
    return ERR(400, 'expected an Object')
  }

  const object = value
  const offset = object.getRequiredIntField('offset').unwrap()
  const length = object.getRequiredIntField('length').unwrap()
  const type = getTextEntityType(object).unwrap()

  if (type === null) {
    return OK(null)
  }

  return OK(new td_api.textEntity(offset, length, type))
}

function getTextEntityType(object: JsonObject): Result<td_api.object_ptr<td_api.TextEntityType>> {
  const type = object.getRequiredStringField('type').unwrap()
  if (!type) {
    return ERR('Type is not specified')
  }

  if (type === 'bold') {
    return OK(new td_api.textEntityTypeBold())
  }
  // TODO

  return ERR('Unsupported type specified')
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
