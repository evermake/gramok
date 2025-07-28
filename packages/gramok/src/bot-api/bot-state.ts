import { UpdateQueue } from './update-queue'

export class BotState {
  public readonly updates: UpdateQueue

  constructor(public readonly id: number) {
    this.updates = new UpdateQueue()
  }
}
