import type { MessageContent } from '../telegram/message-content'
import type { MaybePromise } from '../utils/types'
import type { Query, QueryResult, QueryResultError } from './query'
import type { Message, UserFromGetMe } from './types'
import assert from 'node:assert'
import { error } from '../td/api'
import { toIntegerSafe } from '../td/misc'
import { dialogIdToPeerId } from '../telegram/dialogs'
import { sleep } from '../utils/promises'
import { LONG_POLL_MAX_TIMEOUT } from './constants'
import { queryOk } from './query'

export type BotApiMethod = (query: Query) => MaybePromise<QueryResult>

/**
 * For the full list of methods refer to the {@link https://core.telegram.org/bots/api docs} and their {@link https://github.com/tdlib/telegram-bot-api/blob/master/telegram-bot-api/Client.cpp implementation}.
 */
export const METHODS: Record<string, BotApiMethod> = {
  async getupdates(query) {
    const offset = query.getIntegerArg('offset', 0)
    const limit = query.getIntegerArg('limit', 100, 1, 100)
    const timeout = query.getIntegerArg('timeout', 0, 0, LONG_POLL_MAX_TIMEOUT)
    query.updateAllowedUpdateTypes()
    await Promise.race([
      sleep(timeout),
      query.bot.updates.waitForNonEmpty(),
    ])
    const updates = query.bot.updates.consumeUpdates({ offset, limit })
    return queryOk(updates)
  },

  async getme(query) {
    const meData = query.tg.db.findUserById(query.bot.id)
    if (!meData?.isBot) {
      throw new Error('bot is not a bot')
    }
    if (!meData.username) {
      throw new Error('bot doesn\'t have a username')
    }
    const me: UserFromGetMe = {
      id: query.bot.id,
      is_bot: true,
      first_name: meData.firstName ?? '',
      last_name: meData.lastName,
      username: meData.username,
      is_premium: meData.isPremium || undefined,
      added_to_attachment_menu: undefined, // todo
      can_join_groups: true, // todo
      can_read_all_group_messages: false, // todo
      supports_inline_queries: false, // todo
      can_connect_to_business: false, // todo
      has_main_web_app: false, // todo
    }
    return queryOk(me)
  },

  setwebhook: notImplemented,
  deletewebhook: (query) => {
    // todo: implement webhooks and check their status here
    const dropPendingUpdates = query.getBoolArg('drop_pending_updates')
    if (dropPendingUpdates) {
      query.bot.updates.clear()
    }
    return queryOk(true)
  },
  getwebhookinfo: notImplemented,
  logout: notImplemented,
  close: notImplemented,
  getmycommands: notImplemented,
  setmycommands: notImplemented,
  deletemycommands: notImplemented,
  getmydefaultadministratorrights: notImplemented,
  setmydefaultadministratorrights: notImplemented,
  getmyname: notImplemented,
  setmyname: notImplemented,
  getmydescription: notImplemented,
  setmydescription: notImplemented,
  getmyshortdescription: notImplemented,
  setmyshortdescription: notImplemented,
  getchatmenubutton: notImplemented,
  setchatmenubutton: notImplemented,
  getuserprofilephotos: notImplemented,

  sendmessage: async (query) => {
    const inputMessageText = query.getInputMessageText().unwrap()
    // TODO: implement `Client::do_send_message` with different types
    return (function doSendMessage() {
      const chatId = toIntegerSafe(query.arg('chat_id')).unwrap()
      const peerId = dialogIdToPeerId(chatId)
      assert(peerId.type === 'user', 'can only send messages to users for now')
      assert(inputMessageText.text !== null && !(inputMessageText.text instanceof error))

      // TODO: it's better to create a mock-TDLib instance for the bot
      // that will use td_api methods, and here just pass td types.
      const content: MessageContent = {
        type: 'text',
        text: {
          plain: inputMessageText.text.text,
          entities: [], // todo
        },
      }
      const sentMessage = query.tg.sendMessage(
        { type: 'user', id: query.bot.id },
        peerId,
        content,
      )

      const user = query.tg.getUserById(peerId.id)!
      user.assertIsUser()

      const result: Message.TextMessage = {
        message_id: sentMessage.id,
        date: sentMessage.date.getTime(),
        text: sentMessage.content.text.plain,
        from: {
          id: chatId,
          is_bot: user.isBot,
          is_premium: user.isPremium || undefined,
          first_name: user.firstName,
          last_name: user.lastName,
          username: user.username,
          language_code: user.language,
          added_to_attachment_menu: undefined,
        },
        chat: {
          id: chatId,
          type: 'private',
          username: user.username,
          first_name: user.firstName,
          last_name: user.lastName,
        },
      }

      return queryOk(result)
    })()
  },

  sendanimation: notImplemented,
  sendaudio: notImplemented,
  senddice: notImplemented,
  senddocument: notImplemented,
  sendphoto: notImplemented,
  sendsticker: notImplemented,
  sendvideo: notImplemented,
  sendvideonote: notImplemented,
  sendvoice: notImplemented,
  sendpaidmedia: notImplemented,
  sendgame: notImplemented,
  sendinvoice: notImplemented,
  sendlocation: notImplemented,
  sendvenue: notImplemented,
  sendcontact: notImplemented,
  sendpoll: notImplemented,
  stoppoll: notImplemented,
  sendchecklist: notImplemented,
  copymessage: notImplemented,
  copymessages: notImplemented,
  forwardmessage: notImplemented,
  forwardmessages: notImplemented,
  sendmediagroup: notImplemented,
  sendchataction: notImplemented,
  setmessagereaction: notImplemented,
  editmessagetext: notImplemented,
  editmessagelivelocation: notImplemented,
  stopmessagelivelocation: notImplemented,
  editmessagemedia: notImplemented,
  editmessagecaption: notImplemented,
  editmessagechecklist: notImplemented,
  editmessagereplymarkup: notImplemented,
  deletemessage: notImplemented,
  deletemessages: notImplemented,
  poststory: notImplemented,
  editstory: notImplemented,
  deletestory: notImplemented,
  createinvoicelink: notImplemented,
  getmystarbalance: notImplemented,
  getstartransactions: notImplemented,
  refundstarpayment: notImplemented,
  edituserstarsubscription: notImplemented,
  getavailablegifts: notImplemented,
  sendgift: notImplemented,
  giftpremiumsubscription: notImplemented,
  verifyuser: notImplemented,
  verifychat: notImplemented,
  removeuserverification: notImplemented,
  removechatverification: notImplemented,
  setgamescore: notImplemented,
  getgamehighscores: notImplemented,
  answerwebappquery: notImplemented,
  answerinlinequery: notImplemented,
  savepreparedinlinemessage: notImplemented,
  answercallbackquery: notImplemented,
  answershippingquery: notImplemented,
  answerprecheckoutquery: notImplemented,
  exportchatinvitelink: notImplemented,
  createchatinvitelink: notImplemented,
  createchatsubscriptioninvitelink: notImplemented,
  editchatinvitelink: notImplemented,
  editchatsubscriptioninvitelink: notImplemented,
  revokechatinvitelink: notImplemented,
  getbusinessconnection: notImplemented,
  readbusinessmessage: notImplemented,
  deletebusinessmessages: notImplemented,
  setbusinessaccountname: notImplemented,
  setbusinessaccountusername: notImplemented,
  setbusinessaccountbio: notImplemented,
  setbusinessaccountprofilephoto: notImplemented,
  removebusinessaccountprofilephoto: notImplemented,
  setbusinessaccountgiftsettings: notImplemented,
  getbusinessaccountstarbalance: notImplemented,
  transferbusinessaccountstars: notImplemented,
  getbusinessaccountgifts: notImplemented,
  convertgifttostars: notImplemented,
  upgradegift: notImplemented,
  transfergift: notImplemented,
  setuseremojistatus: notImplemented,
  getchat: notImplemented,
  setchatphoto: notImplemented,
  deletechatphoto: notImplemented,
  setchattitle: notImplemented,
  setchatpermissions: notImplemented,
  setchatdescription: notImplemented,
  pinchatmessage: notImplemented,
  unpinchatmessage: notImplemented,
  unpinallchatmessages: notImplemented,
  setchatstickerset: notImplemented,
  deletechatstickerset: notImplemented,
  getforumtopiciconstickers: notImplemented,
  createforumtopic: notImplemented,
  editforumtopic: notImplemented,
  closeforumtopic: notImplemented,
  reopenforumtopic: notImplemented,
  deleteforumtopic: notImplemented,
  unpinallforumtopicmessages: notImplemented,
  editgeneralforumtopic: notImplemented,
  closegeneralforumtopic: notImplemented,
  reopengeneralforumtopic: notImplemented,
  hidegeneralforumtopic: notImplemented,
  unhidegeneralforumtopic: notImplemented,
  unpinallgeneralforumtopicmessages: notImplemented,
  getchatmember: notImplemented,
  getchatadministrators: notImplemented,
  getchatmembercount: notImplemented,
  getchatmemberscount: notImplemented,
  leavechat: notImplemented,
  promotechatmember: notImplemented,
  setchatadministratorcustomtitle: notImplemented,
  banchatmember: notImplemented,
  kickchatmember: notImplemented,
  restrictchatmember: notImplemented,
  unbanchatmember: notImplemented,
  banchatsenderchat: notImplemented,
  unbanchatsenderchat: notImplemented,
  approvechatjoinrequest: notImplemented,
  declinechatjoinrequest: notImplemented,
  getuserchatboosts: notImplemented,
  getstickerset: notImplemented,
  getcustomemojistickers: notImplemented,
  uploadstickerfile: notImplemented,
  createnewstickerset: notImplemented,
  addstickertoset: notImplemented,
  replacestickerinset: notImplemented,
  setstickersettitle: notImplemented,
  setstickersetthumb: notImplemented,
  setstickersetthumbnail: notImplemented,
  setcustomemojistickersetthumbnail: notImplemented,
  deletestickerset: notImplemented,
  setstickerpositioninset: notImplemented,
  deletestickerfromset: notImplemented,
  setstickeremojilist: notImplemented,
  setstickerkeywords: notImplemented,
  setstickermaskposition: notImplemented,
  setpassportdataerrors: notImplemented,
  sendcustomrequest: notImplemented,
  answercustomquery: notImplemented,
  getfile: notImplemented,
}

function notImplemented(): QueryResultError {
  return {
    ok: false,
    error_code: 501,
    description: 'not yet implemented by gramok',
  }
}
