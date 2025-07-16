<script setup lang="ts">
import { ArrowLeft, ChatLines, DoubleCheck, Emoji, MediaImage, MenuScale, Plus, Search, Send, User } from '@iconoir/vue';
import { checkImage, getImage } from '@/utils/image';
import Input from '@/components/common/Input.vue';
import rooms from '@/json/list_rooms.json'
import { useRoute } from 'vue-router';
import { formatHour12, formatTime, getDayDifference } from '@/utils/time';
import { computed, ref } from '@vue/reactivity';
import { nextTick, onMounted, watch } from '@vue/runtime-core';
import type { TEmoji, TResponseChatRoom } from '@/types';
import { clickById, moveItem } from '@/utils/general';
import EmojiPicker from 'vue3-emoji-picker'

type TChat = {
    meta: TResponseChatRoom,
    lastSeen: string,
    data: { id: number, chat: string, time: string, byCustomer: boolean }[]
}

const route = useRoute()
const cleanRooms = ref<TResponseChatRoom[]>([])
const currentChat = ref<TChat | null>(null)
const allChatRooms = ref<TChat[]>([])
const message = ref<InstanceType<typeof Input> | null>(null)
const id = computed(() => route.query.id)
const chats = ref<HTMLDivElement | null>(null)
const chatrooms = ref<HTMLDivElement | null>(null)
const room_key = 'list_rooms'
const chat_key = 'list_chats'

const getFormatedTime = (time: string) => {
    let formatedTime = formatTime(time, { day: 'numeric', month: 'numeric', year: 'numeric' })
    const dayFromNow = getDayDifference(time)
    if (dayFromNow === 0) formatedTime = formatHour12(time)
    if (dayFromNow === 1) formatedTime = 'Kemarin'
    if (dayFromNow > 1 && dayFromNow <= 7) formatedTime = formatTime(time, { weekday: 'long' })
    return {
        time: formatedTime,
        dayDiff: dayFromNow
    }
}

const lastChatIdentifier = (room: TResponseChatRoom) => {
    const byCustomer = !!room.last_customer_comment_text && (room.last_customer_timestamp >= room.last_comment_timestamp)
    const chat = byCustomer ? room.last_customer_comment_text! : room.last_comment_text!
    let time = byCustomer ? room.last_customer_timestamp : room.last_comment_timestamp
    time = getFormatedTime(time).time
    return { byCustomer, chat, time }
}

const initChat = async (scrollToId = false) => {
    if (!route.query.id) return
    const chatData = localStorage.getItem(chat_key)
    allChatRooms.value = chatData ? JSON.parse(chatData) : []
    if (allChatRooms.value.length === 0) {
        allChatRooms.value = cleanRooms.value.map(room => {
            const chatNumber = +room.room_id.slice(-2)
            const lastDate = new Date(room.last_comment_timestamp)
            const dummyChat = [...new Array(chatNumber)].map((_, idx) => {
                const date = new Date(lastDate.getTime() - (chatNumber - idx + 1) * 60 * 1000);
                return {
                    id: idx + 1,
                    chat: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Repellendus numquam architecto veritatis autem nihil in odio at perferendis velit dolorum!',
                    time: getFormatedTime(date.toDateString()).time,
                    byCustomer: idx % 2 === 0
                }
            })

            const { chat, time, byCustomer } = lastChatIdentifier(room!)

            const lastSeen = getFormatedTime(room.last_customer_timestamp)
            let lastSeenLabel = 'Terakhir terlihat '
            if (lastSeen.dayDiff === 0) lastSeenLabel = lastSeenLabel + 'hari ini pukul '
            if (lastSeen.dayDiff > 7) lastSeenLabel = lastSeenLabel + 'pada '
            return {
                meta: room,
                lastSeen: lastSeenLabel + lastSeen.time,
                data: [...dummyChat, { id: room.id, chat, time, byCustomer }]
            } as TChat
        })
        localStorage.setItem(chat_key, JSON.stringify(allChatRooms.value))
    }

    const selectedRoom = allChatRooms.value.find(room => room.meta.room_id === route.query.id!)
    if (!selectedRoom) return
    currentChat.value = { ...selectedRoom }

    await nextTick();
    if (scrollToId) {
        const el = document.getElementById(selectedRoom.meta.room_id);
        if (el) {
            el.scrollIntoView({ block: 'nearest' });
        }
    }
}

const initRoom = async () => {
    const roomData = localStorage.getItem(room_key)
    if (roomData) {
        cleanRooms.value = JSON.parse(roomData)
        initChat(true)
        return
    }

    for (const room of rooms.data.customer_rooms) {
        const image = await checkImage(room.user_avatar_url)
        cleanRooms.value.push({ ...room, image })
    }
    localStorage.setItem(room_key, JSON.stringify(cleanRooms.value))
    initChat(true)
}

const onSelectEmoji = (emoji: TEmoji) => {
    const msg = message.value?.getElement();
    if (!msg) return;

    const start = msg.selectionStart ?? 0;
    const end = msg.selectionEnd ?? 0;
    const text = msg.value;

    const newText = text.slice(0, start) + emoji.i + text.slice(end);
    msg.value = newText;
    const cursorPos = start + emoji.i.length;
    msg.setSelectionRange(cursorPos, cursorPos);
    msg.focus();
}


const sendMessage = () => {
    const msg = message.value?.getElement()
    if (!msg.value) return
    const currentDate = new Date().toISOString()
    currentChat.value?.data.push({
        id: currentChat.value?.data.length + 1,
        chat: msg.value,
        time: getFormatedTime(currentDate).time,
        byCustomer: false
    })

    const roomIndex = cleanRooms.value.findIndex(room => room.room_id === route.query.id!)
    cleanRooms.value[roomIndex].last_comment_text = msg.value
    cleanRooms.value[roomIndex].last_comment_timestamp = currentDate
    allChatRooms.value[roomIndex] = currentChat.value!

    msg.value = ''
    moveItem(cleanRooms.value, roomIndex, 0)
    moveItem(allChatRooms.value, roomIndex, 0)

    console.log(currentChat.value)

    localStorage.setItem(room_key, JSON.stringify(cleanRooms.value))
    localStorage.setItem(chat_key, JSON.stringify(allChatRooms.value))

    if (chatrooms.value) {
        chatrooms.value.scrollTop = 0;
    }
}

watch(id, () => { initChat() })
watch(currentChat, async () => {
    await nextTick();
    if (chats.value) {
        chats.value.scrollTop = chats.value.scrollHeight;
    }
}, { deep: true })

onMounted(async () => { await initRoom() })
</script>

<template>
    <div class="flex gap-4 lg:gap-6 relative overflow-hidden">
        <div
            class="bg-white border border-neutral-200/80 w-full md:max-w-80 lg:max-w-96 h-screen sm:h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] p-5 sm:rounded-2xl flex flex-col gap-4">
            <div :class="{ 'fixed md:relative': !id }"
                class="flex flex-col gap-4 bg-white top-0 left-0 sm:left-[calc(1rem+1.5vw)] md:left-0 sm:top-4 md:top-0 w-full sm:w-[calc(100%-2rem-3vw)] md:w-full p-5 md:p-0 sm:rounded-t-2xl">
                <router-link to="/profile" class="flex gap-2 items-center group" aria-label="profile-link">
                    <div class="min-w-12 h-12 rounded-full overflow-hidden">
                        <img :src="getImage('pp.jpeg')" alt="user picture" width="48" height="48"
                            class="object-cover object-top w-full h-full">
                    </div>
                    <div class="flex flex-col gap-0.5">
                        <strong class="text-slate-800 font-semibold block truncate">Fajar Maulana</strong>
                        <span
                            class="text-xs font-medium text-sky-600 group-hover:text-sky-700 group-active:text-sky-800 transition-colors duration-300">
                            Lihat Profil >
                        </span>
                    </div>
                </router-link>
                <Input with-prefix type="text" wrapper-class="min-h-10" placeholder="Cari pesan ..."
                    @prefix="input => input.focus()">
                <template #prefix>
                    <Search width="20" height="20" class="text-slate-400" />
                </template>
                </Input>
            </div>
            <div class="pt-[120px] md:pt-0">
                <div class="flex gap-4 justify-between items-center">
                    <span class="font-medium text-slate-500 text-sm">Daftar Pesan</span>
                    <ChatLines width="16" height="16" class="text-slate-500 -scale-x-100" />
                </div>
                <div ref="chatrooms"
                    class="flex flex-col gap-1 mt-2 overflow-y-auto max-h-[calc(100vh-170px)] sm:max-h-[calc(100vh-200px)] md:max-h-[calc(100vh-218px)] -mx-5 px-2 pb-2">
                    <router-link v-for="room in cleanRooms" :key="room.room_id" :to="`/chat?id=${room.room_id}`"
                        :replace="!!id" :id="room.room_id" aria-label="chatroom"
                        :class="id! === room.room_id ? 'bg-slate-200' : 'hover:bg-slate-100 active:bg-slate-200'"
                        class="flex gap-2 items-center py-2.5 px-3 rounded-xl transition-colors duration-300">
                        <div class="min-w-12 h-12 rounded-full overflow-hidden bg-neutral-300">
                            <img v-if="room.image" :src="room.image" alt="customer picture" width="48" height="48"
                                class="object-cover object-top w-full h-full">
                            <span v-else class="h-full w-full grid place-items-center">
                                <User width="28" height="28" class="text-slate-600" />
                            </span>
                        </div>
                        <div class="flex flex-col gap-0.5 w-full overflow-hidden">
                            <div class="flex gap-2 justify-between items-center">
                                <b class="text-slate-800 font-semibold block truncate">{{ room.name }}</b>
                                <span class="text-slate-400 text-xs font-medium">
                                    {{ lastChatIdentifier(room).time }}</span>
                            </div>
                            <div class="text-sm text-slate-500 flex items-center gap-1">
                                <DoubleCheck v-if="!lastChatIdentifier(room).byCustomer" height="14"
                                    class="text-sky-600 max-w-3.5 min-w-3.5" />
                                <MediaImage v-if="lastChatIdentifier(room).chat.startsWith('[file]')" height="14"
                                    class="text-slate-500 max-w-3.5 min-w-3.5" />
                                <p class="truncate">{{ lastChatIdentifier(room).chat.startsWith('[file]') ? 'Foto' :
                                    lastChatIdentifier(room).chat }}</p>
                            </div>
                        </div>
                    </router-link>
                </div>
            </div>
        </div>
        <div :class="!id ? '-right-full md:right-0' : 'right-0'"
            class="absolute md:relative transition-[right] duration-300 w-full h-screen sm:h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] bg-white border border-neutral-200/80 sm:rounded-2xl overflow-hidden">
            <template v-if="currentChat">
                <div :class="{ 'fixed md:relative': !!id }"
                    class="py-4 top-0 left-0 sm:left-[calc(1rem+1.5vw)] md:left-0 sm:top-4 md:top-0 w-full sm:w-[calc(100%-2rem-3vw)] md:w-full bg-white px-5 border-b border-neutral-200/80 flex items-center justify-between gap-4 min-h-fit sm:rounded-t-2xl">
                    <div class="flex gap-2 items-center overflow-hidden">
                        <router-link to="/chat" aria-label="back" replace
                            class="grid md:hidden place-items-center min-w-9 h-9 rounded-full hover:bg-sky-100 active:bg-sky-200 transition-colors duration-300">
                            <ArrowLeft width="20" height="20" stroke-width="2.5" class="text-slate-500" />
                        </router-link>
                        <div class="min-w-12 h-12 rounded-full overflow-hidden bg-neutral-300">
                            <img v-if="currentChat.meta.image" :src="currentChat.meta.image" alt="customer picture"
                                width="48" height="48" class="object-cover object-top w-full h-full">
                            <span v-else class="h-full w-full grid place-items-center">
                                <User width="28" height="28" class="text-slate-600" />
                            </span>
                        </div>
                        <div class="flex flex-col gap-0.5 w-full overflow-hidden">
                            <strong class="text-slate-800 font-semibold block truncate">
                                {{ currentChat.meta.name }}
                            </strong>
                            <span class="text-xs text-slate-600 block truncate text-right">
                                {{ currentChat.lastSeen }}
                            </span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button aria-label="search-chat" class="group grid place-items-center w-9 h-9">
                            <Search width="24" height="24" stroke-width="2.5"
                                class="text-slate-500 group-hover:text-sky-600 group-active:text-sky-700 transition-colors duration-300" />
                        </button>
                        <button aria-label="menu" class="group grid place-items-center w-9 h-9">
                            <MenuScale width="24" height="24" stroke-width="2.5"
                                class="-scale-x-100 text-slate-500 group-hover:text-sky-600 group-active:text-sky-700 transition-colors duration-300" />
                        </button>
                    </div>
                </div>
                <div ref="chats" :style="{ backgroundImage: `url(${getImage('bg.webp')})` }"
                    class=" bg-no-repeat bg-cover h-[calc(100%-80px)] sm:h-[calc(100%-64px)] md:h-[calc(100%-160px)] overflow-y-auto px-5 pt-24 xs:pt-20 sm:pt-24 md:pt-5 pb-5 flex flex-col gap-3">
                    <div v-for="chat in currentChat.data" :key="chat.id" class="flex"
                        :class="{ 'justify-end': !chat.byCustomer }">
                        <div class="p-3 w-4/5 rounded-2xl"
                            :class="[chat.byCustomer ? 'bg-sky-200 rounded-tl-none' : 'bg-white border border-neutral-200/80 rounded-tr-none', chat.chat.startsWith('[file]') ? 'max-w-[200px]' : 'max-w-screen-xs']">
                            <img v-if="chat.chat.startsWith('[file]')" :src="chat.chat.split(' ')[1]" alt="chat-pict"
                                class="w-full h-auto">
                            <p v-else class="text-slate-800">
                                {{ chat.chat }}
                            </p>
                            <span class="text-slate-500 font-semibold text-xs block text-right mt-1">
                                {{ chat.time }}
                            </span>
                        </div>
                    </div>
                </div>
                <div :class="{ 'fixed md:absolute': !!id }"
                    class="w-full bg-white py-4 px-5 border-t border-neutral-200/80 h-20 inset-x-0 bottom-0 flex items-center gap-2">
                    <label for="emoji"
                        class="fixed inset-0 peer select-none pointer-events-none has-[:checked]:pointer-events-auto">
                        <input type="checkbox" name="emoji" id="emoji" class="hidden">
                    </label>
                    <EmojiPicker native class="absolute left-0 bottom-16 scale-0 peer-has-[:checked]:scale-100"
                        @select="onSelectEmoji" />
                    <Input with-prefix ref="message" type="text" wrapper-class="min-h-12" prefix-class="ml-1 group"
                        placeholder="Ketik pesan ..." @keyup.enter="sendMessage" @prefix="() => clickById('emoji')">
                    <template #prefix>
                        <Emoji width="20" height="20"
                            class="text-slate-400 group-hover:text-sky-600 group-active:text-sky-700 transition-colors duration-300" />
                    </template>
                    </Input>
                    <button aria-label="show-product"
                        class="border-2 border-neutral-200 hover:border-sky-600 active:border-sky-700 transition-colors duration-300 grid place-items-center min-w-12 max-w-12 h-12 rounded-full group">
                        <Plus width="28" height="28"
                            class="text-neutral-200 group-hover:text-sky-600 group-active:text-sky-700 transition-colors duration-300" />
                    </button>
                    <button aria-label="send-message" @click="sendMessage"
                        class="bg-sky-600 hover:bg-sky-700 active:bg-sky-800 transition-colors duration-300 grid place-items-center min-w-12 max-w-12 h-12 rounded-full">
                        <Send width="24" height="24" class="text-white" />
                    </button>
                </div>
            </template>
            <div v-else class="h-full w-full p-5 grid place-items-center">
                <img :src="getImage('chat-placeholder.svg')" alt="chat-placeholder" width="726" height="494"
                    class="max-w-56 sm:max-w-80 h-auto">
            </div>
        </div>
    </div>
</template>