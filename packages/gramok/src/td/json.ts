/**
 * @see https://github.com/tdlib/td/tree/master/tdutils/td/utils/JsonBuilder.cpp
 */

import type { Result } from './result'
import { toIntegerSafe } from './misc'
import { ERR, OK, SAFE } from './result'

export enum JsonValueType {
  Null = 'Null',
  Number = 'Number',
  Boolean = 'Boolean',
  String = 'String',
  Array = 'Array',
  Object = 'Object',
}

export type JsonValue
= | JsonNull
  | JsonNumber
  | JsonBoolean
  | JsonString
  | JsonArray
  | JsonObject

export function getTypeName(type: JsonValueType): string {
  return type
}

export function isJsonValue(value: unknown): value is JsonValue {
  return value instanceof JsonNull
    || value instanceof JsonNumber
    || value instanceof JsonBoolean
    || value instanceof JsonString
    || value instanceof JsonArray
    || value instanceof JsonObject
}

export function jsonDecode(raw: string): Result<JsonValue> {
  let parsed
  try {
    parsed = JSON.parse(raw)
  }
  catch (error) {
    return ERR(400, `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  return createJsonValue(parsed)
}

function createJsonValue(value: any): Result<JsonValue> {
  switch (typeof value) {
    case 'string':
      return OK(new JsonString(value))
    case 'number':
      return OK(new JsonNumber(JSON.stringify(value)))
    case 'boolean':
      return OK(new JsonBoolean(value))
    case 'object':
      if (value === null) {
        return OK(new JsonNull())
      }
      if (Array.isArray(value)) {
        return OK(new JsonArray(value.map(v => createJsonValue(v).unwrap())))
      }
      return OK(new JsonObject(Object.entries(value).map(([key, value]) => [key, createJsonValue(value).unwrap()])))
  }
  throw new Error(`Invalid JSON value: ${value}`)
}

export class JsonNull {
  public readonly type: JsonValueType = JsonValueType.Null
  constructor() {}
}

export class JsonNumber {
  public readonly type: JsonValueType = JsonValueType.Number
  constructor(private readonly val: string) {}
  public getNumber(): string {
    return this.val
  }
}

export class JsonBoolean {
  public readonly type: JsonValueType = JsonValueType.Boolean
  constructor(private readonly val: boolean) {}
  public getBoolean(): boolean {
    return this.val
  }
}

export class JsonString {
  public readonly type: JsonValueType = JsonValueType.String
  constructor(private readonly val: string) {}
  public getString(): string {
    return this.val
  }
}

export class JsonArray {
  public readonly type: JsonValueType = JsonValueType.Array
  constructor(private readonly val: JsonValue[]) {}
  public getArray(): JsonValue[] {
    return this.val
  }
}

export class JsonObject {
  public readonly type: JsonValueType = JsonValueType.Object
  constructor(private readonly fieldValues: Array<[string, JsonValue]>) {}

  public fieldCount(): number {
    return this.fieldValues.length
  }

  public extractField(name: string): JsonValue {
    const field = this.fieldValues.find(([n]) => n === name)
    return field ? field[1] : new JsonNull()
  }

  public extractOptionalField(name: string, type: JsonValueType): Result<JsonValue> {
    const field = this.fieldValues.find(([n]) => n === name)
    if (field) {
      if (!(field instanceof JsonNull) && field[1].type !== type) {
        return ERR(400, `Field "${name}" must be of type ${getTypeName(type)}`)
      }
      return OK(field[1])
    }
    return OK(new JsonNull())
  }

  public extractRequiredField(name: string, type: JsonValueType): Result<JsonValue> {
    const field = this.fieldValues.find(([n]) => n === name)
    if (field) {
      if (!(field instanceof JsonNull) && field[1].type !== type) {
        return ERR(400, `Field "${name}" must be of type ${getTypeName(type)}`)
      }
      return OK(field[1])
    }
    return ERR(400, `Can't find field "${name}"`)
  }

  public getField(name: string): JsonValue | undefined {
    const field = this.fieldValues.find(([n]) => n === name)
    return field ? field[1] : undefined
  }

  public hasField(name: string): boolean {
    return this.getField(name) !== undefined
  }

  public getOptionalBoolField(name: string, defaultValue: boolean = false): Result<boolean> {
    const value = this.getField(name)
    if (value) {
      if (value instanceof JsonBoolean) {
        return OK(value.getBoolean())
      }
      return ERR(400, `Field "${name}" must be of type Boolean`)
    }
    return OK(defaultValue)
  }

  public getRequiredBoolField(name: string): Result<boolean> {
    const value = this.getField(name)
    if (value) {
      if (value instanceof JsonBoolean) {
        return OK(value.getBoolean())
      }
      return ERR(400, `Field "${name}" must be of type Boolean`)
    }
    return ERR(400, `Can't find field "${name}"`)
  }

  private getIntegerField(name: string, value: string): Result<number> {
    const result = SAFE(() => toIntegerSafe(value))
    if (result.isOk()) {
      return result
    }
    return ERR(400, `Field "${name}" must be a valid Number`)
  }

  public getOptionalIntField(name: string, defaultValue: number = 0): Result<number> {
    const value = this.getField(name)
    if (value) {
      if (value instanceof JsonString) {
        return this.getIntegerField(name, value.getString())
      }
      if (value instanceof JsonNumber) {
        return this.getIntegerField(name, value.getNumber())
      }
      return ERR(400, `Field "${name}" must be a Number`)
    }
    return OK(defaultValue)
  }

  public getRequiredIntField(name: string): Result<number> {
    const value = this.getField(name)
    if (value) {
      if (value instanceof JsonString) {
        return this.getIntegerField(name, value.getString())
      }
      if (value instanceof JsonNumber) {
        return this.getIntegerField(name, value.getNumber())
      }
      return ERR(400, `Field "${name}" must be a Number`)
    }
    return ERR(400, `Can't find field "${name}"`)
  }

  public getOptionalLongField = this.getOptionalIntField
  public getRequiredLongField = this.getRequiredIntField

  public getOptionalDoubleField = this.getOptionalIntField
  public getRequiredDoubleField = this.getRequiredIntField

  public getOptionalStringField(name: string, defaultValue: string = ''): Result<string> {
    const value = this.getField(name)
    if (value) {
      if (value instanceof JsonString) {
        return OK(value.getString())
      }
      if (value instanceof JsonNumber) {
        return OK(value.getNumber())
      }
      return ERR(400, `Field "${name}" must be of type String`)
    }
    return OK(defaultValue)
  }

  public getRequiredStringField(name: string): Result<string> {
    const value = this.getField(name)
    if (value) {
      if (value instanceof JsonString) {
        return OK(value.getString())
      }
      if (value instanceof JsonNumber) {
        return OK(value.getNumber())
      }
      return ERR(400, `Field "${name}" must be of type String`)
    }
    return ERR(400, `Can't find field "${name}"`)
  }
}
