import type { ContentMessage } from './message'

export interface TelegramEventMap {
  newMessage: [message: ContentMessage]
}
