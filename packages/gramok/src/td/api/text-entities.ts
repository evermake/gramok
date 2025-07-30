import type { object_ptr } from './misc'

export class TextEntityType {}

export class textEntityTypeBold extends TextEntityType {}

export class textEntity {
  constructor(
    public offset: number,
    public length: number,
    public type: object_ptr<TextEntityType>,
  ) {}
}
