export type PeerId = UserId | ChannelId | GroupId

export interface UserId {
  type: 'user'
  id: number
}

export interface ChannelId {
  type: 'channel'
  id: number
}

export interface GroupId {
  type: 'group'
  id: number
}
