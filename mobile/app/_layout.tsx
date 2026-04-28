import { useEffect, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Slot, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator } from 'react-native'
import { getToken } from '@/lib/auth'

export default function RootLayout() {
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    getToken().then(() => setReady(true))
  }, [])

  // Re-read token on every navigation change so login state is always fresh
  useEffect(() => {
    if (!ready) return
    getToken().then(token => {
      const inAuth = segments[0] === '(auth)'
      if (!token && !inAuth) router.replace('/(auth)/login')
      if (token && inAuth) router.replace('/(tabs)/jobs')
    })
  }, [ready, segments])

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
