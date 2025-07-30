import type { object_ptr } from './misc'
import type { textEntity } from './text-entities'

export class formattedText {
  constructor(
    public text: string,
    public entities: object_ptr<textEntity>[],
  ) {}
}
