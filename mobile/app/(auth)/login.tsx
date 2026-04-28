import { useRef, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { loginInstaller } from '@/lib/api'
import { saveAuth } from '@/lib/auth'

export default function LoginScreen() {
  const [name, setName] = useState('')
  const [pin, setPin] = useState(['', '', '', ''])
  const [loading, setLoading] = useState(false)
  const pinRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ]
  const router = useRouter()

  function handlePinChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...pin]
    next[index] = digit
    setPin(next)
    if (digit && index < 3) pinRefs[index + 1].current?.focus()
    if (!digit && index > 0) pinRefs[index - 1].current?.focus()
  }

  async function handleLogin() {
    const fullPin = pin.join('')
    if (!name.trim() || fullPin.length !== 4) return
    setLoading(true)
    try {
      const { token, installer } = await loginInstaller(name.trim(), fullPin)
      await saveAuth(token, installer)
      router.replace('/(tabs)/jobs')
    } catch {
      Alert.alert('Login Failed', 'Incorrect name or PIN. Try again.')
      setPin(['', '', '', ''])
      pinRefs[0].current?.focus()
    } finally {
      setLoading(false)
    }
  }

  const pinFull = pin.join('').length === 4

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo area */}
        <View style={styles.logoArea}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>HEA</Text>
          </View>
          <Text style={styles.appName}>Installer App</Text>
          <Text style={styles.tagline}>Solar &amp; Battery Installations</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Your Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Jake Smith"
            placeholderTextColor="#6b7280"
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => pinRefs[0].current?.focus()}
          />

          <Text style={[styles.label, { marginTop: 20 }]}>PIN</Text>
          <View style={styles.pinRow}>
            {pin.map((digit, i) => (
              <TextInput
                key={i}
                ref={pinRefs[i]}
                style={[styles.pinCell, digit ? styles.pinCellFilled : null]}
                value={digit ? '•' : ''}
                onChangeText={v => handlePinChange(i, v)}
                keyboardType="number-pad"
                maxLength={1}
                secureTextEntry={false}
                caretHidden
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.btn, (!name.trim() || !pinFull || loading) && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={!name.trim() || !pinFull || loading}
          >
            <Text style={styles.btnText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoArea: { alignItems: 'center', marginBottom: 40 },
  logoBox: {
    width: 72, height: 72, borderRadius: 18,
    backgroundColor: '#ffd100',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: { fontSize: 24, fontWeight: '900', color: '#111827' },
  appName: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  tagline: { fontSize: 13, color: '#6b7280' },
  card: {
    backgroundColor: '#1f2937', borderRadius: 20,
    padding: 24, borderWidth: 1, borderColor: '#374151',
  },
  label: { fontSize: 12, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  input: {
    backgroundColor: '#111827', borderRadius: 12, borderWidth: 1, borderColor: '#374151',
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#fff',
  },
  pinRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginBottom: 28 },
  pinCell: {
    width: 56, height: 60, borderRadius: 12,
    backgroundColor: '#111827', borderWidth: 1, borderColor: '#374151',
    fontSize: 24, fontWeight: '700', color: '#fff',
    textAlign: 'center',
  },
  pinCellFilled: { borderColor: '#ffd100' },
  btn: {
    backgroundColor: '#ffd100', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#111827' },
})
