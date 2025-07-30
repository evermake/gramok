import type { formattedText } from './formatted-text'
import type { linkPreviewOptions } from './link-preview-options'
import type { object_ptr } from './misc'

export class InputMessageContent {}

export class inputMessageText extends InputMessageContent {
  constructor(
    public text: object_ptr<formattedText>,
    public linkPreviewOptions: object_ptr<linkPreviewOptions>,
    public clearDraft: boolean,
  ) {
    super()
  }
}
