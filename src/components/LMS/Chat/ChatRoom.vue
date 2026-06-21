<template>
  <div class="column full-height" style="min-height: 400px;">
    <!-- Messages Area -->
    <q-card-section class="col scroll q-pa-md chat-area" ref="chatArea" style="flex: 1; overflow-y: auto;">
      <div v-if="loading" class="row justify-center q-pa-md">
        <q-spinner-dots color="primary" size="2em" />
      </div>
      <div v-else-if="messages.length === 0" class="text-center text-muted q-py-xl">
        No messages yet. Start the conversation!
      </div>
      <div v-else class="q-gutter-y-md">
        <div v-for="msg in messages" :key="msg.id" :class="['row', isMe(msg) ? 'justify-end' : 'justify-start']">
          <div class="row items-end" style="max-width: 80%;">
            <q-avatar v-if="!isMe(msg)" size="32px" class="q-mr-sm">
              <img :src="getAvatar(msg)" />
            </q-avatar>
            
            <div :class="['message-bubble', isMe(msg) ? 'bubble-me' : 'bubble-other']">
              <div v-if="!isMe(msg)" class="text-caption text-weight-bold q-mb-xs" style="font-size: 11px; opacity: 0.8;">
                {{ msg.user?.name }} <span v-if="msg.user?.role === 'teacher'" class="text-primary">(Teacher)</span>
              </div>
              <div>{{ msg.message }}</div>
              <div class="text-right q-mt-xs" style="font-size: 10px; opacity: 0.6;">
                {{ formatTime(msg.created_at) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </q-card-section>

    <!-- Input Area -->
    <q-card-section class="q-pa-md" style="border-top: 1px solid rgba(0,0,0,0.05); background: white;">
      <form @submit.prevent="sendMessage" class="row items-center q-gutter-x-sm">
        <q-input 
          v-model="newMessage" 
          class="col" 
          outlined 
          rounded 
          dense 
          placeholder="Type a message..." 
          bg-color="grey-1"
          :disable="sending"
        />
        <q-btn 
          round 
          dense 
          unelevated 
          color="primary" 
          icon="send" 
          type="submit" 
          :loading="sending"
          :disable="!newMessage.trim()"
        />
      </form>
    </q-card-section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useAuthStore } from '../../../stores/auth';
import API from '../../../services/api';

const props = defineProps({
  sectionId: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['unread']);

const authStore = useAuthStore();
const loading = ref(true);
const sending = ref(false);
const messages = ref([]);
const newMessage = ref('');
const chatArea = ref(null);

let echoChannel = null;

const isMe = (msg) => {
  return msg.user_id === authStore.user?.id;
};

const getAvatar = (msg) => {
  if (msg.user?.profile?.profile_picture) {
    return `http://localhost:8000/storage/${msg.user.profile.profile_picture}`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.user?.name || 'U')}&background=random`;
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const scrollToBottom = async () => {
  await nextTick();
  if (chatArea.value && chatArea.value.$el) {
    const el = chatArea.value.$el;
    el.scrollTop = el.scrollHeight;
  }
};

const loadMessages = async () => {
  try {
    loading.value = true;
    const res = await API.get(`/sections/${props.sectionId}/messages`);
    messages.value = res;
    scrollToBottom();
  } catch (err) {
    console.error("Failed to load messages", err);
  } finally {
    loading.value = false;
  }
};

const sendMessage = async () => {
  if (!newMessage.value.trim()) return;
  
  const text = newMessage.value;
  newMessage.value = '';
  sending.value = true;
  
  try {
    const res = await API.post(`/sections/${props.sectionId}/messages`, {
      message: text
    });
    if (!messages.value.find(m => m.id === res.id)) {
      messages.value.push(res);
      scrollToBottom();
    }
  } catch (err) {
    console.error("Failed to send message", err);
  } finally {
    sending.value = false;
  }
};

const initEcho = () => {
  if (!window.Echo) return;

  echoChannel = window.Echo.join(`section.${props.sectionId}`)
    .listen('MessageSent', (e) => {
      if (!messages.value.find(m => m.id === e.message.id)) {
        messages.value.push(e.message);
        emit('unread');
        scrollToBottom();
      }
    });
};

watch(() => props.sectionId, (newId, oldId) => {
  if (oldId && echoChannel && window.Echo) {
    window.Echo.leave(`section.${oldId}`);
  }
  if (newId) {
    loadMessages();
    setTimeout(() => {
      initEcho();
    }, 500);
  }
});

defineExpose({ scrollToBottom });

onMounted(() => {
  loadMessages();
  setTimeout(() => {
    initEcho();
  }, 1000);
});

onUnmounted(() => {
  if (echoChannel && window.Echo) {
    window.Echo.leave(`section.${props.sectionId}`);
  }
});
</script>

<style scoped>
.chat-area {
  background: #f8fafc;
}
.message-bubble {
  padding: 10px 14px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}
.bubble-me {
  background: var(--sms-blue);
  color: white;
  border-bottom-right-radius: 4px;
}
.bubble-other {
  background: white;
  color: #333;
  border-bottom-left-radius: 4px;
}
</style>
