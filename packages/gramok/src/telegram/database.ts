import type { ChatId, PrivateChatIdStr } from './chat'
import type { ContentMessage, Message } from './message'
import { checkOk, validateBotUsername, validateUserId, validateUsername } from './validation'

/**
 * In-memory database of the mock Telegram.
 */
export class Database {
  private users: UserData[]
  private privateChats: Map<PrivateChatIdStr, PrivateChatData>

  public readonly botSecrets: Map<number, string>

  constructor() {
    this.users = []
    this.privateChats = new Map()
    this.botSecrets = new Map()
  }

  public insertUser(user: UserData): UserData {
    checkOk(validateUserId(user.id))
    if (user.username) {
      checkOk(user.isBot ? validateBotUsername(user.username) : validateUsername(user.username))
      if (this.isUsernameTaken(user.username)) {
        throw new Error(`Username "${user.username}" is already taken`)
      }
    }
    if (this.userIds().has(user.id)) {
      throw new Error(`User with ID ${user.id} already exists`)
    }
    const frozen = Object.freeze(Object.assign({}, user))
    this.users.push(frozen)
    return frozen
  }

  public findUserById(id: number): UserData | undefined {
    return this.users.find(user => user.id === id)
  }

  public findUsernameOwner(username: string): UserData | undefined {
    return this.users.find(user => user.username === username)
  }

  public isUsernameTaken(username: string): boolean {
    return this.usernamesLower().has(username.toLowerCase())
  }

  public addMessage(message: InputContentMessage): ContentMessage {
    const now = new Date()
    const chat = this.getChat(message.chat)
    const newMessage: ContentMessage = {
      ...message,
      id: ++chat.messageIdCounter,
      date: now,
    }
    chat.messages.push(newMessage)
    return newMessage
  }

  public getChat(chatId: ChatId): PrivateChatData {
    if (chatId.type === 'private') {
      let chat = this.privateChats.get(chatId.toString())
      if (!chat) {
        chat = {
          messageIdCounter: 0,
          messages: [],
        }
        this.privateChats.set(chatId.toString(), chat)
      }
      return chat
    }
    throw new Error(`chats of type ${chatId.type} are not supported yet`)
  }

  private userIds(): Set<number> {
    return new Set(this.users.map(user => user.id))
  }

  private usernamesLower(): Set<string> {
    return new Set(
      this.users
        .filter(user => user.username)
        .map(user => user.username!.toLowerCase()),
    )
  }
}

export type InputContentMessage = Omit<ContentMessage, 'id' | 'date'>

export interface UserData {
  // Basic info (https://core.telegram.org/constructor/user)
  id: number
  isBot: boolean
  isPremium: boolean
  language?: string
  firstName?: string
  lastName?: string
  username?: string

  // Extended info (https://core.telegram.org/constructor/userFull)
  about?: string
  // botInfo: ... TODO
}

export interface PrivateChatData {
  messageIdCounter: number
  messages: Message[]
}
