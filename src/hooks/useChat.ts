import { computed, reactive, ref, toRefs } from '@vue/reactivity'
import { nextTick, onMounted, watch } from '@vue/runtime-core'
import { useRoute } from 'vue-router'
import { checkImage, convertBlob, getImage } from '@/utils/image'
import { formatHour12, formatTime, getDayDifference } from '@/utils/time'
import { clickById, moveItem } from '@/utils/general'
import rooms from '@/json/list_rooms.json'
import type { TEmoji, TResponseChatRoom } from '@/types'
import Input from '@/components/common/Input.vue'

type TChat = {
  meta: TResponseChatRoom
  lastSeen: string
  data: { id: number; chat: string; time: string; byCustomer: boolean }[]
}

const room_key = 'list_rooms'
const chat_key = 'list_chats'

const getFormattedTime = (time: string) => {
  let label = formatTime(time, { day: 'numeric', month: 'numeric', year: 'numeric' })
  const diff = getDayDifference(time)
  if (diff === 0) label = formatHour12(time)
  if (diff === 1) label = 'Kemarin'
  if (diff > 1 && diff <= 7) label = formatTime(time, { weekday: 'long' })
  return { time: label, dayDiff: diff }
}

const getLastChat = (room: TResponseChatRoom) => {
  const byCustomer =
    !!room.last_customer_comment_text && room.last_customer_timestamp >= room.last_comment_timestamp
  const text = byCustomer ? room.last_customer_comment_text! : room.last_comment_text!
  const time = getFormattedTime(
    byCustomer ? room.last_customer_timestamp : room.last_comment_timestamp,
  ).time
  return { byCustomer, chat: text, time }
}

export default function useChat() {
  const route = useRoute()
  const id = computed(() => route.query.id)

  const state = reactive({
    cleanRooms: [] as TResponseChatRoom[],
    allChatRooms: [] as TChat[],
    currentChat: null as TChat | null,
  })

  const message = ref<InstanceType<typeof Input> | null>(null)
  const chats = ref<HTMLDivElement | null>(null)
  const chatrooms = ref<HTMLDivElement | null>(null)

  const loadChatsFromStorage = () => {
    const stored = localStorage.getItem(chat_key)
    return stored ? (JSON.parse(stored) as TChat[]) : []
  }

  const createDummyChats = (room: TResponseChatRoom): TChat => {
    const count = +room.room_id.slice(-2)
    const lastDate = new Date(room.last_comment_timestamp)

    const dummy = Array.from({ length: count }, (_, i) => {
      const date = new Date(lastDate.getTime() - (count - i + 1) * 60_000)
      return {
        id: i + 1,
        chat: 'Lorem ipsum dolor sit amet consectetur adipisicing elit.',
        time: getFormattedTime(date.toDateString()).time,
        byCustomer: i % 2 === 0,
      }
    })

    const { chat, time, byCustomer } = getLastChat(room)
    const seen = getFormattedTime(room.last_customer_timestamp)
    const seenLabel =
      seen.dayDiff === 0
        ? 'Terakhir terlihat hari ini pukul '
        : seen.dayDiff > 7
          ? 'Terakhir terlihat pada '
          : 'Terakhir terlihat '

    return {
      meta: room,
      lastSeen: seenLabel + seen.time,
      data: [...dummy, { id: room.id, chat, time, byCustomer }],
    }
  }

  const initChat = async (scrollToId = false) => {
    if (!id.value) return

    state.allChatRooms = loadChatsFromStorage()
    if (!state.allChatRooms.length) {
      state.allChatRooms = state.cleanRooms.map(createDummyChats)
      localStorage.setItem(chat_key, JSON.stringify(state.allChatRooms))
    }

    const selected = state.allChatRooms.find((r) => r.meta.room_id === id.value)
    if (selected) {
      state.currentChat = { ...selected }
      await nextTick()
      if (scrollToId) {
        document.getElementById(selected.meta.room_id)?.scrollIntoView({ block: 'nearest' })
      }
    }
  }

  const initRoom = async () => {
    const stored = localStorage.getItem(room_key)
    if (stored) {
      state.cleanRooms = JSON.parse(stored)
      await initChat(true)
      return
    }

    const loaded = []
    for (const r of rooms.data.customer_rooms) {
      const image = await checkImage(r.user_avatar_url)
      loaded.push({ ...r, image })
    }
    state.cleanRooms = loaded
    localStorage.setItem(room_key, JSON.stringify(state.cleanRooms))
    await initChat(true)
  }

  const updateChat = (chat: string, callback?: () => void) => {
    console.log(chat)
    const now = new Date().toISOString()

    state.currentChat?.data.push({
      id: state.currentChat.data.length + 1,
      chat,
      time: getFormattedTime(now).time,
      byCustomer: false,
    })

    const idx = state.cleanRooms.findIndex((r) => r.room_id === id.value)
    Object.assign(state.cleanRooms[idx], {
      last_comment_text: chat,
      last_comment_timestamp: now,
    })
    state.allChatRooms[idx] = state.currentChat!

    moveItem(state.cleanRooms, idx, 0)
    moveItem(state.allChatRooms, idx, 0)

    void (callback && callback())
    void (chatrooms.value && (chatrooms.value.scrollTop = 0))

    localStorage.setItem(room_key, JSON.stringify(state.cleanRooms))
    localStorage.setItem(chat_key, JSON.stringify(state.allChatRooms))
  }

  const sendMessage = () => {
    const msg = message.value?.getElement()
    if (!msg?.value) return

    updateChat(msg.value, () => (msg.value = ''))
  }

  const onSelectEmoji = (emoji: TEmoji) => {
    const msg = message.value?.getElement()
    if (!msg) return
    const { selectionStart = 0, selectionEnd = 0, value } = msg
    msg.value = value.slice(0, selectionStart) + emoji.i + value.slice(selectionEnd)
    const cursor = selectionStart + emoji.i.length
    msg.setSelectionRange(cursor, cursor)
    msg.focus()
  }

  const imageData = ref<string | null>(null)

  const uploadImage = async (event: Event) => {
    const target = event.target as HTMLInputElement
    if (!target.files || target.files.length === 0) return

    imageData.value = await convertBlob(target.files[0])
    updateChat('[file] ' + imageData.value + ' [/file]')
  }

  watch(id, () => initChat())
  watch(
    () => state.currentChat,
    async () => {
      await nextTick()
      void (chats.value && (chats.value.scrollTop = chats.value.scrollHeight))
    },
    { deep: true },
  )

  onMounted(() => initRoom())

  return {
    ...toRefs(state),
    message,
    chats,
    chatrooms,
    id,
    getImage,
    clickById,
    sendMessage,
    uploadImage,
    onSelectEmoji,
    getLastChat,
  }
}
