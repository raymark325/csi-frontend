<template>
  <div class="chat-root column full-height">

    <!-- Load-older spinner (top) -->
    <transition name="slide-down">
      <div v-if="room?.loadingOlder" class="row justify-center items-center q-py-sm load-older-bar">
        <q-spinner-dots color="primary" size="20px" />
        <span class="q-ml-sm text-caption text-grey-6">Loading older messages...</span>
      </div>
    </transition>

    <!-- Messages Area -->
    <div
      class="col chat-area q-pa-md"
      ref="chatAreaRef"
      @scroll="onScroll"
    >
      <!-- No messages state -->
      <div v-if="!room?.initialLoaded && room?.loadingInitial" class="absolute-center">
        <q-spinner-dots color="primary" size="40px" />
      </div>
      <div v-else-if="messages.length === 0 && room?.initialLoaded" class="text-center text-grey-5 q-py-xl">
        <q-icon name="chat_bubble_outline" size="48px" class="q-mb-md" />
        <div class="text-h6">No messages yet</div>
        <div class="text-caption">Start the conversation!</div>
      </div>

      <!-- Message list -->
      <div v-else class="q-gutter-y-sm">

        <!-- End of history indicator -->
        <div v-if="!room?.hasMore && messages.length > 0" class="text-center text-grey-5 q-py-sm">
          <q-separator class="q-mb-sm" />
          <span class="text-caption">Beginning of conversation</span>
        </div>

        <!-- Messages -->
        <div
          v-for="(msg, index) in messages"
          :key="msg.id"
          :class="['row', isMe(msg) ? 'justify-end' : 'justify-start']"
        >
          <!-- Show date separator when date changes -->
          <div v-if="showDateSep(index)" class="full-width text-center q-py-xs q-mb-xs">
            <q-chip dense color="grey-3" text-color="grey-7" size="sm">
              {{ formatDate(msg.created_at) }}
            </q-chip>
          </div>

          <div :class="['row items-end', isMe(msg) ? 'reverse-row' : '']" style="max-width: 78%;">
            <q-avatar size="30px" :class="isMe(msg) ? 'q-ml-xs' : 'q-mr-xs'" style="flex-shrink:0;">
              <img :src="getAvatar(msg)" loading="lazy" />
            </q-avatar>

            <div :class="['msg-bubble', isMe(msg) ? 'bubble-me' : 'bubble-other']">
              <!-- Sender name -->
              <div
                class="text-weight-bold q-mb-xs"
                style="font-size: 11px; opacity: 0.75;"
                :class="isMe(msg) ? 'text-right' : 'text-left'"
              >
                {{ getSenderName(msg) }}
              </div>

              <!-- Message content -->
              <div :class="isMe(msg) ? 'text-right' : 'text-left'" style="word-break: break-word;">
                {{ msg.message }}
              </div>

              <!-- Timestamp + status -->
              <div
                class="row items-center q-mt-xs q-gutter-x-xs"
                :class="isMe(msg) ? 'justify-end' : 'justify-start'"
                style="font-size: 10px; opacity: 0.6;"
              >
                <span>{{ formatTime(msg.created_at) }}</span>
                <!-- Delivery status (only for own messages) -->
                <q-icon
                  v-if="isMe(msg)"
                  :name="statusIcon(msg)"
                  :color="msg._status === 'failed' ? 'negative' : 'white'"
                  size="12px"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Scroll anchor -->
        <div ref="bottomAnchorRef" />
      </div>
    </div>

    <!-- "New Messages" banner (shown when user scrolled up and new msg arrives) -->
    <transition name="slide-up">
      <div
        v-if="hasNewMessages && !isNearBottom"
        class="new-msg-banner row items-center justify-center q-pa-sm cursor-pointer"
        @click="scrollToBottom(true)"
      >
        <q-icon name="arrow_downward" class="q-mr-xs" />
        New messages ↓
      </div>
    </transition>

    <!-- Offline indicator -->
    <transition name="slide-up">
      <div v-if="isOffline" class="offline-bar row items-center justify-center q-py-xs">
        <q-icon name="wifi_off" class="q-mr-xs" size="14px" />
        <span class="text-caption">You're offline. Reconnecting...</span>
      </div>
    </transition>

    <!-- Input Area -->
    <div class="q-pa-md input-area">
      <form @submit.prevent="handleSend" class="row items-center q-gutter-x-sm">
        <q-input
          v-model="newMessage"
          class="col"
          outlined
          rounded
          dense
          autogrow
          placeholder="Type a message..."
          bg-color="grey-1"
          :disable="isOffline"
          @keydown.enter.exact.prevent="handleSend"
        />
        <q-btn
          round dense unelevated
          color="primary"
          icon="send"
          type="submit"
          :loading="sending"
          :disable="!newMessage.trim() || isOffline"
        />
      </form>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useAuthStore } from '../../../stores/auth';
import { useChatStore } from '../../../stores/chatStore';

const props = defineProps({
  sectionId: { type: Number, required: true }
});
const emit = defineEmits(['unread']);

const authStore  = useAuthStore();
const chatStore  = useChatStore();

const chatAreaRef    = ref(null);
const bottomAnchorRef = ref(null);
const newMessage     = ref('');
const sending        = ref(false);
const isOffline      = ref(!navigator.onLine);
const isNearBottom   = ref(true);
const hasNewMessages = ref(false);

let echoChannel = null;
const NEAR_BOTTOM_THRESHOLD = 150; // px

// ── Computed ──────────────────────────────────────────────────────────────────

const room = computed(() => chatStore.getRoom(props.sectionId));

const messages = computed(() => room.value?.messages ?? []);

// ── Formatting helpers ────────────────────────────────────────────────────────

const isMe = (msg) => msg.user_id === authStore.user?.id;

const getSenderName = (msg) => {
  if (isMe(msg)) return 'You';
  return msg.user?.name || 'Unknown';
};

const getAvatar = (msg) => {
  if (msg.user?.profile?.profile_picture) {
    return `http://localhost:8000/storage/${msg.user.profile.profile_picture}`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.user?.name || 'U')}&background=random&size=64`;
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const today = new Date();
  const diff  = Math.floor((today - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const showDateSep = (index) => {
  if (index === 0) return true;
  const curr = new Date(messages.value[index].created_at).toDateString();
  const prev = new Date(messages.value[index - 1].created_at).toDateString();
  return curr !== prev;
};

const statusIcon = (msg) => {
  if (msg._status === 'sending') return 'schedule';
  if (msg._status === 'failed')  return 'error_outline';
  return 'done'; // sent
};

// ── Scroll helpers ────────────────────────────────────────────────────────────

const getScrollEl = () => chatAreaRef.value;

const checkNearBottom = () => {
  const el = getScrollEl();
  if (!el) return true;
  return el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD;
};

const scrollToBottom = async (force = false) => {
  await nextTick();
  const el = getScrollEl();
  if (!el) return;
  if (force || isNearBottom.value) {
    el.scrollTo({ top: el.scrollHeight, behavior: force ? 'smooth' : 'instant' });
    hasNewMessages.value = false;
  }
};

// Scroll event — detect top (load older) and near-bottom tracking
const onScroll = async () => {
  const el = getScrollEl();
  if (!el) return;

  isNearBottom.value = checkNearBottom();

  if (isNearBottom.value) hasNewMessages.value = false;

  // Trigger load-older when within 80px of the very top
  if (el.scrollTop <= 80 && room.value?.hasMore && !room.value?.loadingOlder) {
    const prevScrollHeight = el.scrollHeight;

    await chatStore.loadOlder(props.sectionId);

    // Restore scroll position — user should not feel any jump
    await nextTick();
    el.scrollTop = el.scrollHeight - prevScrollHeight;
  }
};

// ── Send ──────────────────────────────────────────────────────────────────────

const handleSend = async () => {
  const text = newMessage.value.trim();
  if (!text || sending.value) return;

  newMessage.value = '';
  sending.value    = true;

  // Inject current user info for optimistic bubble
  const me = authStore.user;
  // chatStore.sendMessage will optimistically insert a temp message
  try {
    await chatStore.sendMessage(props.sectionId, text);
    await scrollToBottom();
  } catch (err) {
    console.error('[ChatRoom] send failed', err);
  } finally {
    sending.value = false;
  }
};

// ── WebSocket (Realtime) ──────────────────────────────────────────────────────

const initEcho = () => {
  if (!window.Echo) return;

  echoChannel = window.Echo.join(`section.${props.sectionId}`)
    .listen('MessageSent', (e) => {
      const wasNearBottom = checkNearBottom();

      chatStore.appendRealtime(props.sectionId, e.message);
      emit('unread');

      if (wasNearBottom) {
        scrollToBottom();
      } else {
        hasNewMessages.value = true;
      }
    });
};

const leaveEcho = () => {
  if (echoChannel && window.Echo) {
    window.Echo.leave(`section.${props.sectionId}`);
    echoChannel = null;
  }
};

// ── Network recovery ──────────────────────────────────────────────────────────

const handleOnline = async () => {
  isOffline.value = false;
  await chatStore.fetchMissed(props.sectionId);
  await scrollToBottom();
};

const handleOffline = () => {
  isOffline.value = true;
};

// ── Lifecycle ─────────────────────────────────────────────────────────────────

const initRoom = async () => {
  await chatStore.loadInitial(props.sectionId);
  await scrollToBottom();
  setTimeout(initEcho, 800);
};

watch(() => props.sectionId, (newId, oldId) => {
  if (oldId) leaveEcho();
  if (newId) {
    hasNewMessages.value = false;
    initRoom();
  }
});

onMounted(async () => {
  await initRoom();
  window.addEventListener('online',  handleOnline);
  window.addEventListener('offline', handleOffline);
});

onUnmounted(() => {
  leaveEcho();
  window.removeEventListener('online',  handleOnline);
  window.removeEventListener('offline', handleOffline);
});

defineExpose({ scrollToBottom });
</script>

<style scoped>
.chat-root {
  background: var(--q-color-grey-1, #f8fafc);
}

/* Scrollable message area */
.chat-area {
  overflow-y: auto;
  overscroll-behavior: contain;
  scroll-behavior: auto; /* we control smooth ourselves */
}

/* Message bubbles */
.msg-bubble {
  padding: 9px 13px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.5;
  max-width: 100%;
  box-shadow: 0 1px 2px rgba(0,0,0,0.08);
}
.bubble-me {
  background: var(--sms-blue, #1976d2);
  color: white;
  border-bottom-right-radius: 4px;
}
.bubble-other {
  background: white;
  color: #222;
  border-bottom-left-radius: 4px;
}

/* Row reversal for own messages */
.reverse-row {
  flex-direction: row-reverse;
}

/* Load-older bar */
.load-older-bar {
  background: rgba(255,255,255,0.9);
  border-bottom: 1px solid rgba(0,0,0,0.06);
  z-index: 10;
}

/* "New messages" floating banner */
.new-msg-banner {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--sms-blue, #1976d2);
  color: white;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 16px;
  z-index: 50;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  white-space: nowrap;
}

/* Offline banner */
.offline-bar {
  background: #ff5252;
  color: white;
  font-size: 12px;
}

/* Input area */
.input-area {
  border-top: 1px solid rgba(0,0,0,0.06);
  background: white;
}

/* Transitions */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.25s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>
