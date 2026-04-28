import { useEffect, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Slot, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator } from 'react-native'
import { getToken } from '@/lib/auth'

export default function RootLayout() {
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    getToken().then(token => {
      setAuthed(!!token)
      setReady(true)
    })
  }, [])

  useEffect(() => {
    if (!ready) return
    const inAuth = segments[0] === '(auth)'
    if (!authed && !inAuth) router.replace('/(auth)/login')
    if (authed && inAuth) router.replace('/(tabs)/jobs')
  }, [ready, authed, segments])

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
