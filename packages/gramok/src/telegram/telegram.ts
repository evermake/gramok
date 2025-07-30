import type { ChatId } from './chat'
import type { TelegramEventMap } from './events'
import type { ContentMessage, Message } from './message'
import type { MessageContent } from './message-content'
import type { PeerId } from './peer'
import type { OrRandom } from './random'
import assert from 'node:assert'
import EventEmitter from 'node:events'
import { BotApi } from '../bot-api/bot-api'
import { randBool } from '../utils/random'
import { PrivateChatId } from './chat'
import { Database } from './database'
import { findEntities } from './formatted-text'
import { randomBio, randomBotSecret, randomBotUsername, randomFirstName, randomLastName, randomUserId, randomUsername, valueOrRandom } from './random'

/**
 * Mock implementation of the Telegram.
 */
export class Telegram {
  public readonly db: Database
  public readonly botApi: BotApi
  private readonly ee: EventEmitter<TelegramEventMap>

  // Events
  public readonly on: Telegram['ee']['on']
  public readonly once: Telegram['ee']['once']
  public readonly off: Telegram['ee']['off']

  constructor() {
    this.db = new Database()
    this.botApi = new BotApi(this)

    this.ee = new EventEmitter()
    this.on = this.ee.on.bind(this.ee)
    this.once = this.ee.once.bind(this.ee)
    this.off = this.ee.off.bind(this.ee)
  }

  public addUser(user: {
    id: OrRandom<number>
    username?: OrRandom<string>
    firstName: OrRandom<string>
    lastName?: OrRandom<string>
    language?: OrRandom<string>
    bio?: OrRandom<string>
    premium?: OrRandom<boolean>
  }): User {
    const {
      id,
      username,
      firstName,
      lastName,
      bio,
      language,
      premium = false,
    } = user
    const inserted = this.db.insertUser({
      isBot: false,
      id: valueOrRandom(id, randomUserId),
      username: username == null ? undefined : valueOrRandom(username, randomUsername),
      firstName: valueOrRandom(firstName, randomFirstName),
      lastName: lastName == null ? undefined : valueOrRandom(lastName, randomLastName),
      about: bio == null ? undefined : valueOrRandom(bio, randomBio),
      language: language == null ? undefined : valueOrRandom(language, randomLastName),
      isPremium: valueOrRandom(premium, randBool),
    })
    return new User(this, inserted.id)
  }

  public addBot(bot: {
    id: OrRandom<number>
    username: OrRandom<string>
    name: OrRandom<string>
    bio?: OrRandom<string>
  }): Bot {
    const {
      id,
      username,
      name,
      bio,
    } = bot
    const inserted = this.db.insertUser({
      isBot: true,
      isPremium: false,
      id: valueOrRandom(id, randomUserId),
      username: valueOrRandom(username, randomBotUsername),
      firstName: valueOrRandom(name, randomFirstName),
      about: bio == null ? undefined : valueOrRandom(bio, randomBio),
    })
    this.db.botSecrets.set(inserted.id, randomBotSecret())
    return new Bot(this, inserted.id)
  }

  public checkBotAuth(botId: number, secret: string): boolean {
    return this.db.botSecrets.get(botId) === secret
  }

  public getByUsername(username: string): User | Bot | undefined {
    const userData = this.db.findUsernameOwner(username)
    if (userData) {
      return userData.isBot
        ? new Bot(this, userData.id)
        : new User(this, userData.id)
    }
    return undefined
  }

  public getUserById(id: number): User | Bot | undefined {
    const userData = this.db.findUserById(id)
    if (userData) {
      return userData.isBot
        ? new Bot(this, userData.id)
        : new User(this, userData.id)
    }
    return undefined
  }

  public sendMessage(
    as: PeerId,
    to: PeerId,
    content: MessageContent,
    // TODO: add send options
  ): ContentMessage {
    // TODO: Check that `as` can send messages to `to`.
    let chat: ChatId
    if (as.type === 'user' && to.type === 'user') {
      chat = new PrivateChatId(as.id, to.id)
    }
    else {
      throw new Error(`sending messages as ${as.type} to ${to.type} is not yet supported`)
    }
    const message = this.db.addMessage({
      from: as,
      chat,
      content: {
        type: content.type,
        text: {
          plain: content.text.plain,
          entities: content.text.entities.length === 0
            ? findEntities(content.text.plain, false, false)
            : content.text.entities,
        },
      },
    })
    this.ee.emit('newMessage', message)
    return message
  }
}

/**
 * Private chat between two users or a user and a bot.
 */
export class PrivateChat {
  private id: PrivateChatId
  public readonly first: User | Bot
  public readonly second: User | Bot

  constructor(
    private readonly tg: Telegram,
    user1: BaseUser | number,
    user2: BaseUser | number,
  ) {
    const chatId = new PrivateChatId(
      typeof user1 === 'number' ? user1 : user1.id,
      typeof user2 === 'number' ? user2 : user2.id,
    )
    const first = this.tg.getUserById(chatId.firstId)
    const second = this.tg.getUserById(chatId.secondId)
    assert(first != null, `User with ID ${chatId.firstId} not found`)
    assert(second != null, `User with ID ${chatId.secondId} not found`)
    assert(!(first.isBot && second.isBot), 'Bot cannot talk with bot')
    this.first = first
    this.second = second
    this.id = chatId
  }

  public get messages(): Message[] {
    return this.tg.db.getChat(this.id).messages
  }
}

export class BaseUser {
  constructor(
    protected readonly tg: Telegram,
    public readonly id: number,
  ) {}

  private get data() {
    const data = this.tg.db.findUserById(this.id)
    assert(data != null, `User with ID ${this.id} does not exist`)
    return data
  }

  public get isBot(): boolean { return this.data.isBot }
  public get isPremium(): boolean { return this.data.isPremium }
  public get username(): string | undefined { return this.data.username }
  public get firstName(): string { return this.data.firstName ?? '' }
  public get lastName(): string | undefined { return this.data.lastName }
  public get language(): string | undefined { return this.data.language }

  public assertIsUser(): asserts this is User {
    assert(this instanceof User, 'User is not a user')
  }

  public assertIsBot(): asserts this is Bot {
    assert(this instanceof Bot, 'User is not a bot')
  }

  public chatWith(other: BaseUser | number): PrivateChat {
    return new PrivateChat(this.tg, this, other)
  }
}

export class User extends BaseUser {}

export class Bot extends BaseUser {
  /**
   * Returns the bot's token to authorize requests to {@link BotApi Bot API}.
   */
  public get token(): string {
    const secret = this.tg.db.botSecrets.get(this.id)
    if (!secret) {
      throw new Error('Bot doesn\'t have a secret in the database')
    }
    return `${this.id}:${secret}`
  }
}
