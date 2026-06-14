import { defineStore } from 'pinia';

export const useUiStore = defineStore('ui', {
  state: () => ({
    darkMode: localStorage.getItem('darkMode') === 'true',
    sidebarOpen: true,
  }),
  actions: {
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },
    setSidebar(isOpen) {
      this.sidebarOpen = isOpen;
    },
    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      localStorage.setItem('darkMode', this.darkMode);
      // Toggle Quasar dark mode if needed (or hand-coded CSS dark mode)
      import('quasar').then(({ Dark }) => {
        Dark.set(this.darkMode);
      });
    },
    initDarkMode() {
      import('quasar').then(({ Dark }) => {
        Dark.set(this.darkMode);
      });
    }
  }
});
