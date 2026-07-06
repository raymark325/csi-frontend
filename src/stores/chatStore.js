/**
 * chatStore.js — Pinia store for the Messenger-style chat system.
 *
 * Manages per-room state:
 *   - messages (deduped, sorted asc by id)
 *   - pagination cursors (oldestId, latestId)
 *   - hasMore flag (are there older messages on the server?)
 *   - loading states
 *
 * Integrates with chatCache.js for IndexedDB persistence.
 */

import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import API from '../services/api';
import { getMessages, saveMessages, clearRoom } from '../services/chatCache';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Notify } from 'quasar';

// Shape of a single room's state
function createRoomState() {
  return {
    messages:     [],   // array, sorted ascending by id
    hasMore:      true, // are there older messages on the server?
    oldestId:     null, // id of the oldest loaded message
    latestId:     null, // id of the newest loaded message
    initialLoaded: false,
    loadingInitial: false,
    loadingOlder:  false,
    loadingNewer:  false,
  };
}

export const useChatStore = defineStore('chat', () => {
  // Keyed by sectionSubjectId (string for Map safety)
  const rooms = reactive({}); // { [roomId]: roomState }

  // ── Helpers ──────────────────────────────────────────────────────────────

  function getRoom(roomId) {
    const key = String(roomId);
    if (!rooms[key]) {
      rooms[key] = createRoomState();
    }
    return rooms[key];
  }

  /**
   * Merge messages into a room, deduplicating by id and sorting ascending.
   */
  function mergeMessages(room, incoming) {
    if (!Array.isArray(incoming) || incoming.length === 0) return;
    const safe = incoming.filter(m => m && m.id != null);
    const existingIds = new Set(room.messages.map(m => m.id));
    const fresh = safe.filter(m => !existingIds.has(m.id));
    room.messages = [...room.messages, ...fresh].sort((a, b) => a.id - b.id);
  }

  /**
   * Prepend older messages (from scroll-up fetch) at the beginning.
   * Returns how many pixels of new content were added (for scroll preservation).
   */
  function prependMessages(room, incoming) {
    if (!Array.isArray(incoming) || incoming.length === 0) return 0;
    const safe = incoming.filter(m => m && m.id != null);
    const existingIds = new Set(room.messages.map(m => m.id));
    const fresh = safe.filter(m => !existingIds.has(m.id));
    if (fresh.length === 0) return 0;
    fresh.sort((a, b) => a.id - b.id);
    room.messages = [...fresh, ...room.messages];
    return fresh.length;
  }

  function updateCursors(room, { oldestId, latestId, hasMore }) {
    if (oldestId && (!room.oldestId || oldestId < room.oldestId)) {
      room.oldestId = oldestId;
    }
    if (latestId && (!room.latestId || latestId > room.latestId)) {
      room.latestId = latestId;
    }
    if (hasMore !== undefined) {
      room.hasMore = hasMore;
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Initial load for a room.
   * 1. Immediately returns cached messages (for instant render)
   * 2. Fetches latest from server in background
   * 3. Merges server response with cache
   */
  async function loadInitial(roomId) {
    const room = getRoom(roomId);
    if (room.loadingInitial) return;

    room.loadingInitial = true;

    // Step 1: Show cached messages immediately
    try {
      const cached = (await getMessages(roomId)).filter(m => m && m.id != null);
      if (cached.length > 0) {
        room.messages = cached;
        room.oldestId = cached[0].id;
        room.latestId = cached[cached.length - 1].id;
        room.initialLoaded = true;
      }
    } catch { /* ignore cache errors */ }

    // Step 2: Fetch latest from server
    try {
      const raw = await API.get(`/subjects/${roomId}/messages?limit=30`);

      // Handle both old plain-array format and new envelope format
      const msgs    = Array.isArray(raw) ? raw : (raw?.messages ?? []);
      const hasMore = Array.isArray(raw) ? true : (raw?.hasMore ?? false);
      const oldest  = Array.isArray(raw) ? null : raw?.oldestId;
      const latest  = Array.isArray(raw) ? null : raw?.latestId;

      mergeMessages(room, msgs);
      updateCursors(room, { oldestId: oldest, latestId: latest, hasMore });
      room.initialLoaded = true;

      await saveMessages(roomId, msgs);
    } catch (err) {
      console.error('[ChatStore] loadInitial failed', err);
      room.initialLoaded = true; // prevent infinite spinner
    } finally {
      room.loadingInitial = false;
    }
  }

  /**
   * Load older messages (triggered by scrolling to top).
   * Prepends them; returns the count of new messages added (for scroll preservation).
   */
  async function loadOlder(roomId) {
    const room = getRoom(roomId);
    if (room.loadingOlder || !room.hasMore || !room.oldestId) return 0;

    room.loadingOlder = true;
    try {
      const raw = await API.get(`/subjects/${roomId}/messages?before=${room.oldestId}&limit=30`);
      const msgs    = Array.isArray(raw) ? raw : (raw?.messages ?? []);
      const hasMore = Array.isArray(raw) ? false : (raw?.hasMore ?? false);
      const oldest  = Array.isArray(raw) ? null : raw?.oldestId;

      const count = prependMessages(room, msgs);
      updateCursors(room, { oldestId: oldest, hasMore });

      await saveMessages(roomId, msgs);
      return count ?? 0;
    } catch (err) {
      console.error('[ChatStore] loadOlder failed', err);
      return 0;
    } finally {
      room.loadingOlder = false;
    }
  }

  /**
   * Reconnect recovery: fetch all messages newer than the last known id.
   */
  async function fetchMissed(roomId) {
    const room = getRoom(roomId);
    if (!room.latestId || room.loadingNewer) return;

    room.loadingNewer = true;
    try {
      const res = await API.get(`/subjects/${roomId}/messages?after=${room.latestId}`);
      if (res.messages.length > 0) {
        mergeMessages(room, res.messages);
        updateCursors(room, { latestId: res.latestId });
        await saveMessages(roomId, res.messages);
      }
    } catch (err) {
      console.error('[ChatStore] fetchMissed failed', err);
    } finally {
      room.loadingNewer = false;
    }
  }

  /**
   * Append a realtime message that arrived via WebSocket.
   */
  function appendRealtime(roomId, message) {
    const room = getRoom(roomId);
    const exists = room.messages.some(m => m.id === message.id);
    if (!exists) {
      room.messages.push(message);
      room.latestId = message.id;
      // Cache it immediately (fire-and-forget)
      saveMessages(roomId, [message]).catch(() => {});
    }
  }

  /**
   * Optimistically send a message.
   * Inserts a temporary "sending" bubble immediately,
   * then replaces with the confirmed server response.
   */
  async function sendMessage(roomId, text) {
    const room    = getRoom(roomId);
    const tempId  = `temp_${Date.now()}`;
    // Import authStore here to avoid circular dep at module level
    const { useAuthStore } = await import('./auth');
    const authStore = useAuthStore();

    const tempMsg = {
      id:      tempId,
      user_id: authStore.user?.id,
      section_id: roomId,
      message: text,
      created_at: new Date().toISOString(),
      _status: 'sending',
      user: authStore.user ? {
        id:   authStore.user.id,
        name: authStore.user.name,
        role: authStore.user.role,
        profile: authStore.user.profile ?? null,
      } : null,
    };

    room.messages.push(tempMsg);

    try {
      const confirmed = await API.post(`/subjects/${roomId}/messages`, { message: text });
      // Replace temp message with confirmed one
      const idx = room.messages.findIndex(m => m.id === tempId);
      if (idx !== -1) {
        room.messages.splice(idx, 1, { ...confirmed, _status: 'sent' });
      } else {
        // If WebSocket already delivered it, just merge
        mergeMessages(room, [confirmed]);
      }
      room.latestId = confirmed.id;
      await saveMessages(roomId, [confirmed]);
      return confirmed;
    } catch (err) {
      // Mark temp message as failed
      const idx = room.messages.findIndex(m => m.id === tempId);
      if (idx !== -1) {
        room.messages[idx]._status = 'failed';
      }
      throw err;
    }
  }

  /**
   * Clear all state and cache for a room.
   */
  async function resetRoom(roomId) {
    const key = String(roomId);
    if (rooms[key]) {
      Object.assign(rooms[key], createRoomState());
    }
    await clearRoom(roomId).catch(() => {});
  }

  /**
   * Initialize global listeners for all the user's sections.
   * Shows a LocalNotification/Quasar Notify if message arrives and room is not actively viewed.
   */
  const activeChannels = new Set();
  const activeViewedRoom = ref(null); // The room ID currently open in ChatRoom.vue



  const pendingChatOpen = ref(null);

  function triggerChatOpen(sectionId) {
    pendingChatOpen.value = sectionId;
    // reset it slightly later so it can trigger watchers again if needed
    setTimeout(() => { pendingChatOpen.value = null; }, 1000);
  }

  // Unread badge logic
  const unreadCounts = reactive(JSON.parse(localStorage.getItem('csi_chat_unread') || '{}'));

  function saveUnread() {
    localStorage.setItem('csi_chat_unread', JSON.stringify(unreadCounts));
  }

  function incrementUnread(roomId) {
    const key = String(roomId);
    unreadCounts[key] = (unreadCounts[key] || 0) + 1;
    saveUnread();
  }

  function clearUnread(roomId) {
    const key = String(roomId);
    if (unreadCounts[key]) {
      unreadCounts[key] = 0;
      saveUnread();
    }
  }

  const totalUnreadCount = computed(() => {
    return Object.values(unreadCounts).reduce((acc, val) => acc + val, 0);
  });

  function getUnreadCount(roomId) {
    return unreadCounts[String(roomId)] || 0;
  }

  function setActiveViewedRoom(roomId) {
    activeViewedRoom.value = roomId;
    if (roomId) {
      clearUnread(roomId);
    }
  }

  async function initGlobalListeners(sectionIds) {
    if (!window.Echo) return;
    
    // Request local notification permissions
    try {
      const perm = await LocalNotifications.requestPermissions();
    } catch(e) {}

    // Initialize FCM Push Notifications
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      let permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      PushNotifications.addListener('registration', async (token) => {
        // Send token to backend to be saved
        try {
          await API.post('/user/fcm-token', { token: token.value });
        } catch (e) {
          console.error('Failed to save FCM token', e);
        }
      });
      
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on registration: ' + JSON.stringify(error));
      });

      // Listen for push notifications received in foreground
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        // We can show Quasar Toast if needed here, but Echo usually handles realtime in foreground.
      });

      // Handle when the user clicks the notification!
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        const data = notification.notification.data;
        if (data) {
          if (data.type === 'announcement') {
            window.location.hash = '#/announcements';
          } else if (data.section_id) {
            triggerChatOpen(data.section_id);
          }
        }
      });

      // Local notifications click
      LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        const extra = notification.notification.extra;
        if (extra) {
          if (extra.type === 'announcement') {
            window.location.hash = '#/announcements';
          } else if (extra.section_id) {
            triggerChatOpen(extra.section_id);
          }
        }
      });

      if (permStatus.receive === 'granted') {
        // Register with Apple / Google to receive push via APNS/FCM
        await PushNotifications.register();
      }

    } catch (e) {
      console.log('PushNotifications not supported on this platform', e);
    }

    sectionIds.forEach(roomId => {
      const channelName = `section.${roomId}`;
      if (activeChannels.has(channelName)) return;
      
      activeChannels.add(channelName);
      window.Echo.join(channelName)
        .listen('MessageSent', async (e) => {
          const message = e.message;
          const { useAuthStore } = await import('./auth');
          const authStore = useAuthStore();
          
          // Don't notify for our own messages
          if (String(message.user_id) === String(authStore.user?.id)) return;
          
          // Append to store if viewing or not
          appendRealtime(roomId, message);
          
          // If we are NOT actively viewing this room, show a notification
          if (activeViewedRoom.value != roomId) {
            incrementUnread(roomId);

            const senderName = message.user?.name || 'Someone';
            const textPreview = message.message.substring(0, 40) + (message.message.length > 40 ? '...' : '');
            
            // Show Quasar in-app toast
            Notify.create({
              message: `New message from ${senderName}`,
              caption: textPreview,
              color: 'primary',
              icon: 'chat',
              position: 'top',
              timeout: 4000,
              actions: [
                { label: 'View', color: 'white', handler: () => triggerChatOpen(roomId) }
              ]
            });

            // Show Android Notification Bar push notification
            try {
              await LocalNotifications.schedule({
                notifications: [
                  {
                    title: `New message from ${senderName}`,
                    body: textPreview,
                    id: Math.floor(Math.random() * 100000),
                    schedule: { at: new Date(Date.now() + 100) },
                    actionTypeId: "",
                    extra: { section_id: roomId }
                  }
                ]
              });
            } catch(err) {}
          }
        });
    });
  }

  return {
    rooms,
    getRoom,
    loadInitial,
    loadOlder,
    fetchMissed,
    appendRealtime,
    sendMessage,
    resetRoom,
    initGlobalListeners,
    setActiveViewedRoom,
    pendingChatOpen,
    triggerChatOpen,
    unreadCounts,
    totalUnreadCount,
    getUnreadCount,
    clearUnread
  };
});
