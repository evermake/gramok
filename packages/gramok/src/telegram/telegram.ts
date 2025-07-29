import type { OrRandom } from './random'
import { BotApi } from '../bot-api/bot-api'
import { randBool } from '../utils/random'
import { Database } from './database'
import { randomBio, randomBotSecret, randomBotUsername, randomFirstName, randomLastName, randomUserId, randomUsername, valueOrRandom } from './random'

/**
 * Mock implementation of the Telegram.
 */
export class Telegram {
  public readonly db: Database
  public readonly botApi: BotApi

  constructor() {
    this.db = new Database()
    this.botApi = new BotApi(this)
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
}

export class User {
  constructor(
    private readonly tg: Telegram,
    public readonly id: number,
  ) {}
}

export class Bot {
  constructor(
    private readonly tg: Telegram,
    public readonly id: number,
  ) {}

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
