/**
 * Implementation of the Telegram with in-memory DB that mimics real behavior.
 */
export class Telegram {
  #storage: Storage

  constructor() {
    this.#storage = new Storage()
  }

  public createUser(userInfo: Partial<User>) {}

  public createBot(botInfo) {}
}

interface User {
  id: number
  firstName: string
  lastName: string | null
  bio: string | null
  username: string | null
  hasPremium: boolean
}

interface Bot {
  id: number
  username: string
  name: string
}

class Storage {
  #users: Map<number, User>
  #bots: Map<number, Bot>
}

export interface Chat {}
