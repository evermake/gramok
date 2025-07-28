import type { Update } from '@grammyjs/types'

export * from '@grammyjs/types'

export type UpdateType = Exclude<keyof Update, 'update_id'>

export function isUpdateType(s: string): s is UpdateType {
  return Boolean(_isUpdateType(s as UpdateType))
}

/** Helper to make sure TypeScript checks all possible update types. */
function _isUpdateType(s: UpdateType): true {
  switch (s) {
    case 'message':
    case 'edited_message':
    case 'channel_post':
    case 'edited_channel_post':
    case 'business_connection':
    case 'business_message':
    case 'edited_business_message':
    case 'deleted_business_messages':
    case 'message_reaction':
    case 'message_reaction_count':
    case 'inline_query':
    case 'chosen_inline_result':
    case 'callback_query':
    case 'shipping_query':
    case 'pre_checkout_query':
    case 'poll':
    case 'poll_answer':
    case 'my_chat_member':
    case 'chat_member':
    case 'chat_join_request':
    case 'chat_boost':
    case 'removed_chat_boost':
    case 'purchased_paid_media':
      return true
  }
}
