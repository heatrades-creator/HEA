import { useEffect, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Slot, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Updates from 'expo-updates'
import { getToken } from '@/lib/auth'

export default function RootLayout() {
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    async function init() {
      // Check for OTA update first, then mark ready
      if (!__DEV__) {
        try {
          const update = await Updates.checkForUpdateAsync()
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync()
            await Updates.reloadAsync()
            return // reloadAsync restarts the app — nothing below runs
          }
        } catch {
          // No network or update server unavailable — continue with cached bundle
        }
      }
      // Warm the global token cache from SecureStore before showing UI
      await getToken()
      setReady(true)
    }
    init()
  }, [])

  // Synchronous token check — avoids stale async Promise callbacks from rapid
  // segment changes during navigation causing spurious login redirects.
  useEffect(() => {
    if (!ready) return
    const token = global.__heaToken ?? null
    const inAuth = segments[0] === '(auth)'
    const inTabs = segments[0] === '(tabs)'
    if (!token && !inAuth) router.replace('/(auth)/login')
    if (token && inAuth) router.replace('/(tabs)/jobs')
    // Authenticated but at the root (e.g. fresh install / update) — go to tabs
    if (token && !inAuth && !inTabs) router.replace('/(tabs)/jobs')
  }, [ready, segments])

  // Navigate to job when user taps a notification
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const jobNumber = response.notification.request.content.data?.jobNumber as string | undefined
      if (jobNumber) router.push(`/(tabs)/jobs/${jobNumber}`)
    })
    return () => Notifications.removeNotificationSubscription(sub)
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#111827' }}>
      <StatusBar style="light" />
      {!ready ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' }}>
          <ActivityIndicator color="#ffd100" />
        </View>
      ) : (
        <Slot />
      )}
    </GestureHandlerRootView>
  )
}
