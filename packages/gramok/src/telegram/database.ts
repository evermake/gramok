import type { Message } from './message'
import { checkOk, validateBotUsername, validateUserId, validateUsername } from './validation'

/**
 * In-memory database of the mock Telegram.
 */
export class Database {
  private users: UserData[]
  private privateChats: Map<PrivateChatId, PrivateChatData>

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

  public getUserById(id: number): UserData | undefined {
    return this.users.find(user => user.id === id)
  }

  public isUsernameTaken(username: string): boolean {
    return this.usernamesLower().has(username.toLowerCase())
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

/**
 * String representation of a private chat ID, which is in format:
 * `<user_id_1>:<user_id_2>`, where `user_id_1 <= user_id_2`.
 */
type PrivateChatId = `${number}:${number}`

export interface PrivateChatData {
  messages: Message[]
}
