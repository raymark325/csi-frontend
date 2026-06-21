<template>
  <div>
    <!-- Floating Chat Button -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]" style="z-index: 1000;">
      <q-btn fab icon="chat" color="primary" @click="isOpen = true" class="shadow-4">
        <q-badge v-if="unreadCount > 0" color="red" floating>{{ unreadCount }}</q-badge>
      </q-btn>
    </q-page-sticky>

    <!-- Chat Dialog -->
    <q-dialog v-model="isOpen" position="right" maximized transition-show="slide-left" transition-hide="slide-right">
      <q-card class="column full-height glass-card" style="width: 400px; max-width: 100vw; border-radius: 20px 0 0 20px;">
        <!-- Header -->
        <q-card-section class="row items-center justify-between q-pb-sm" style="border-bottom: 1px solid rgba(0,0,0,0.05); background: var(--sms-blue);">
          <div class="text-h6 text-white font-weight-bold row items-center">
            <q-icon name="forum" class="q-mr-sm" size="24px" />
            Class Chat
          </div>
          <q-btn icon="close" flat round dense color="white" v-close-popup />
        </q-card-section>

        <!-- Use ChatRoom -->
        <ChatRoom ref="chatRoomRef" :sectionId="sectionId" @unread="handleUnread" style="flex: 1;" />
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import ChatRoom from './ChatRoom.vue';

const props = defineProps({
  sectionId: {
    type: Number,
    required: true
  }
});

const isOpen = ref(false);
const unreadCount = ref(0);
const chatRoomRef = ref(null);

const handleUnread = () => {
  if (!isOpen.value) {
    unreadCount.value++;
  }
};

watch(isOpen, (newVal) => {
  if (newVal) {
    unreadCount.value = 0;
    if (chatRoomRef.value) {
      setTimeout(() => {
        chatRoomRef.value.scrollToBottom();
      }, 50);
    }
  }
});
</script>
