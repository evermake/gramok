import type { Update, UpdateType } from './types'
import { checkSorted } from '../utils/array'
import { DEFAULT_ALLOWED_UPDATE_TYPES } from './constants'

export type InputUpdate = Omit<Update, 'update_id'>

export class UpdateQueue {
  private updateIdCounter: number
  private pendingUpdates: Update[]
  private pendingNonEmptyPromise: { promise: Promise<void>, resolve: () => void } | null
  public allowedUpdateTypes: UpdateType[]

  constructor() {
    this.updateIdCounter = 0
    this.pendingUpdates = []
    this.pendingNonEmptyPromise = null
    this.allowedUpdateTypes = DEFAULT_ALLOWED_UPDATE_TYPES.slice()
  }

  public clear() {
    this.pendingUpdates.length = 0
  }

  public enqueue(...updates: InputUpdate[]) {
    this.pendingUpdates.push(
      ...updates
        .filter(this.isUpdateAllowed.bind(this))
        .map(update => ({
          update_id: ++this.updateIdCounter,
          ...update,
        })),
    )
    if (!this.isEmpty()) {
      this.onNonEmpty()
    }
  }

  /**
   * Returns updates from the queue and updates the queue according to the
   * docs of {@link https://core.telegram.org/bots/api#getupdates getUpdates} method.
   */
  public consumeUpdates(options: { limit?: number, offset?: number } = {}): Update[] {
    const { limit, offset } = options

    checkSorted(this.pendingUpdates, (a, b) => a.update_id - b.update_id)

    if (offset !== undefined) {
      if (offset >= 0) {
        const startIndex = this.pendingUpdates.findIndex(update => update.update_id >= offset)

        if (startIndex === -1) {
          this.pendingUpdates = []
          return []
        }

        this.pendingUpdates.splice(0, startIndex)
      }
      else {
        const count = Math.abs(offset)
        this.pendingUpdates = this.pendingUpdates.slice(-count)
      }
    }

    const result = limit !== undefined
      ? this.pendingUpdates.slice(0, limit)
      : this.pendingUpdates.slice()

    return result
  }

  /**
   * Returns a promise that resolves when the queue becomes non-empty.
   */
  public waitForNonEmpty(): Promise<void> {
    if (!this.isEmpty()) {
      return Promise.resolve()
    }

    if (!this.pendingNonEmptyPromise) {
      const { promise, resolve } = Promise.withResolvers<void>()
      this.pendingNonEmptyPromise = { promise, resolve }
    }

    return this.pendingNonEmptyPromise.promise
  }

  public isEmpty(): boolean {
    return this.pendingUpdates.length > 0
  }

  private onNonEmpty(): void {
    if (this.pendingNonEmptyPromise) {
      this.pendingNonEmptyPromise.resolve()
      this.pendingNonEmptyPromise = null
    }
  }

  private isUpdateAllowed(update: InputUpdate) {
    return this.allowedUpdateTypes.some(type => Object.hasOwn(update, type))
  }
}
