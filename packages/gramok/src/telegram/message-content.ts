/**
 * @see https://github.com/tdlib/td/blob/master/td/telegram/MessageContent.h
 * @see https://github.com/tdlib/td/blob/master/td/telegram/MessageContent.cpp
 * @see https://github.com/tdlib/td/blob/master/td/telegram/MessageContentType.h
 * @see https://github.com/tdlib/td/blob/master/td/telegram/MessageContentType.cpp
 */

import type { FormattedText } from './formatted-text'

export type MessageContent = MessageContentText

export interface MessageContentText {
  type: 'text'
  text: FormattedText
}
