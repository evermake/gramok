import { assert } from 'node:console'

export type ChatId
  = | PrivateChatId
    | ChannelChatId
    | GroupChatId
    | SecretChatId

export interface ChannelChatId {
  type: 'channel'
  id: number
}

export interface GroupChatId {
  type: 'group'
  id: number
}

export interface SecretChatId {
  type: 'secret'
  id: number
}

export class PrivateChatId {
  public readonly type = 'private'

  public readonly firstId: number
  public readonly secondId: number

  constructor(user1Id: number, user2Id: number) {
    if (user1Id > user2Id) {
      this.firstId = user2Id
      this.secondId = user1Id
    }
    else {
      this.firstId = user1Id
      this.secondId = user2Id
    }
  }

  public toString(): PrivateChatIdStr {
    return `${this.firstId}:${this.secondId}`
  }

  public static fromString(str: PrivateChatIdStr): PrivateChatId {
    assert(str.match(/^\d+:\d+$/), 'Invalid private chat ID')
    const [firstId, secondId] = str.split(':').map(Number)
    return new PrivateChatId(firstId, secondId)
  }
}

/**
 * String representation of a private chat ID, which is in format:
 * `<user_id_1>:<user_id_2>`, where `user_id_1 <= user_id_2`.
 */
export type PrivateChatIdStr = `${number}:${number}`
