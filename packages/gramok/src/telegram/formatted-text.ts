import type { MessageEntity } from '@grammyjs/types'

export function utf16CodeUnitsLength(text: string): number {
  let length = 0
  for (const byte of new TextEncoder().encode(text)) {
    if ((byte & 0xC0) !== 0x80) {
      length += (byte >= 0xF0 ? 2 : 1)
    }
  }
  return length
}

interface Pos { offset: number, length: number }

export function findBotCommands(text: string): Pos[] {
  return Array
    // eslint-disable-next-line regexp/no-useless-escape, regexp/prefer-w
    .from(text.matchAll(/(?<!\b|[\/<>])\/([a-zA-Z0-9_]{1,64})(?:@([a-zA-Z0-9_]{3,32}))?(?!\B|[\/<>])/gu))
    .map(val => ({ offset: utf16CodeUnitsLength(text.slice(0, val.index)), length: utf16CodeUnitsLength(val[0]) }))
}

// TODO: move it to td directory, change types, implement other entities
export function findEntities(
  text: string,
  skipBotCommands: boolean,
  _skipMediaTimestamps: boolean,
) {
  const entities: MessageEntity[] = []

  const addEntities = (type: 'bot_command', findFn: (text: string) => Pos[]) => {
    const positions = findFn(text)
    entities.push(...positions.map(({ offset, length }) => ({ type, offset, length })))
  }

  if (!skipBotCommands) {
    addEntities('bot_command', findBotCommands)
  }

  return entities
}

export interface FormattedText {
  plain: string
  entities: MessageEntity[]
}
