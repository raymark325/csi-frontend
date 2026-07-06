import { boot } from 'quasar/wrappers'
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { Capacitor } from '@capacitor/core'

export default boot(async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      // Notify the updater that the app has successfully started.
      // If a new update was applied, this tells Capgo to confirm the update and not roll back.
      await CapacitorUpdater.notifyAppReady()
      console.log('CapacitorUpdater: App ready notified')
    } catch (err) {
      console.error('CapacitorUpdater: Failed to notify app ready', err)
    }
  }
})
