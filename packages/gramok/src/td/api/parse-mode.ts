import type { object_ptr } from './misc'
import { formattedText } from './formatted-text'

export class TextParseMode {}

export class textParseModeHTML extends TextParseMode {}

export class textParseModeMarkdown extends TextParseMode {
  constructor(
    public version: number,
  ) {
    super()
  }
}

export function parseTextEntities(
  text: string,
  _parseMode: object_ptr<TextParseMode>,
): object_ptr<formattedText> {
  // TODO: Actually parse the text.
  return new formattedText(text, [])
}
