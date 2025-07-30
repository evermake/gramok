/**
 * @see https://core.telegram.org/type/Message
 */

import type { ChatId } from './chat'
import type { MessageAction } from './message-action'
import type { MessageContent } from './message-content'
import type { PeerId } from './peer'

export type Message = ContentMessage | ServiceMessage

export interface ContentMessage extends BaseMessage {
  content: MessageContent
}

export interface ServiceMessage extends BaseMessage {
  action: MessageAction
}

export interface BaseMessage {
  id: number
  date: Date
  chat: ChatId
  from: PeerId
}
