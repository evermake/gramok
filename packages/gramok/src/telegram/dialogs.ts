/* eslint-disable yoda */

import type { PeerId } from './peer'
import assert from 'node:assert'

/**
 * Converts peer ID to dialog ID in bot API format.
 *
 * @see https://core.telegram.org/api/bots/ids
 */
export function peerIdToDialogId(peerId: PeerId): number {
  switch (peerId.type) {
    case 'user':
      assert(Number.isSafeInteger(peerId.id) && peerId.id >= 1 && peerId.id <= 0xFFFFFFFFFF, 'invalid user ID')
      return peerId.id
    case 'group':
      assert(Number.isSafeInteger(peerId.id) && peerId.id >= 1 && peerId.id <= 999999999999, 'invalid group ID')
      return peerId.id * -1
    case 'channel':
      assert(Number.isSafeInteger(peerId.id) && peerId.id >= 1 && peerId.id <= 997852516352, 'invalid channel ID')
      return (1000000000000 + peerId.id) * -1
  }
}

/**
 * Converts dialog ID in bot API format to peer ID.
 *
 * @see https://core.telegram.org/api/bots/ids
 */
export function dialogIdToPeerId(dialogId: number): PeerId {
  assert(Number.isSafeInteger(dialogId), 'invalid dialog ID')
  if (1 <= dialogId && dialogId <= 0xFFFFFFFFFF) {
    return {
      type: 'user',
      id: dialogId,
    }
  }
  if (-999999999999 <= dialogId && dialogId <= -1) {
    return {
      type: 'group',
      id: dialogId * -1,
    }
  }
  if (-1997852516352 <= dialogId && dialogId <= -1000000000001) {
    return {
      type: 'channel',
      id: (dialogId + 1000000000000) * -1,
    }
  }
  throw new Error(`Invalid dialog ID: ${dialogId}`)
}
