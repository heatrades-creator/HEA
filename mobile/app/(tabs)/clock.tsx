import { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, Modal, ActivityIndicator,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import QRCode from 'react-native-qrcode-svg'
import { Ionicons } from '@expo/vector-icons'
import { clockIn, clockOut } from '@/lib/api'
import { getInstallerProfile } from '@/lib/auth'
import { encodeQRPayload, decodeQRPayload } from '@/lib/qr'
import type { InstallerProfile } from '@/lib/types'

type ClockState = 'idle' | 'clocked_in' | 'clocked_out'

export default function ClockScreen() {
  const [state, setState] = useState<ClockState>('idle')
  const [jobNumber, setJobNumber] = useState('')
  const [activeJob, setActiveJob] = useState('')
  const [loading, setLoading] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [showScanner, setShowScanner] = useState(false)
  const [installer, setInstaller] = useState<InstallerProfile | null>(null)
  const [permission, requestPermission] = useCameraPermissions()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const clockInTimeRef = useRef<number>(0)

  useEffect(() => {
    getInstallerProfile().then(setInstaller)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  function startTimer() {
    clockInTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - clockInTimeRef.current) / 1000))
    }, 1000)
  }

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setElapsed(0)
  }

  function formatElapsed(sec: number): string {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  async function handleClockIn() {
    if (!jobNumber.trim()) return
    setLoading(true)
    try {
      await clockIn(jobNumber.trim())
      setActiveJob(jobNumber.trim())
      setState('clocked_in')
      startTimer()
    } catch {
      Alert.alert('Error', 'Failed to clock in. Check job number and try again.')
    }
    setLoading(false)
  }

  async function handleClockOut() {
    setLoading(true)
    try {
      await clockOut(activeJob)
      stopTimer()
      setState('clocked_out')
    } catch {
      Alert.alert('Error', 'Failed to clock out. Try again.')
    }
    setLoading(false)
  }

  function handleReset() {
    setState('idle')
    setJobNumber('')
    setActiveJob('')
  }

  async function handleScanResult(data: string) {
    setShowScanner(false)
    const payload = decodeQRPayload(data)
    if (!payload) {
      Alert.alert('Invalid QR', 'This QR code is not a valid HEA job sign-in.')
      return
    }
    setLoading(true)
    try {
      await clockIn(payload.jobNumber)
      setActiveJob(payload.jobNumber)
      setJobNumber(payload.jobNumber)
      setState('clocked_in')
      startTimer()
      Alert.alert('Clocked In', `You're now clocked in to ${payload.jobNumber}`)
    } catch {
      Alert.alert('Error', 'Failed to clock in. Try again.')
    }
    setLoading(false)
  }

  const qrValue = state === 'clocked_in' && installer
    ? encodeQRPayload(activeJob, installer.name)
    : ''

  return (
    <View style={styles.root}>
      {state === 'idle' && (
        <View style={styles.content}>
          <Text style={styles.heading}>Clock In</Text>
          <Text style={styles.sub}>Enter the job number to start tracking your hours.</Text>

          <TextInput
            style={styles.input}
            value={jobNumber}
            onChangeText={setJobNumber}
            placeholder="e.g. TS023"
            placeholderTextColor="#6b7280"
            autoCapitalize="characters"
            returnKeyType="done"
            onSubmitEditing={handleClockIn}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, (!jobNumber.trim() || loading) && styles.btnDisabled]}
            onPress={handleClockIn}
            disabled={!jobNumber.trim() || loading}
          >
            {loading ? <ActivityIndicator color="#111827" /> : (
              <>
                <Ionicons name="timer-outline" size={20} color="#111827" />
                <Text style={styles.primaryBtnText}>Clock In</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => {
              if (!permission?.granted) requestPermission().then(p => { if (p.granted) setShowScanner(true) })
              else setShowScanner(true)
            }}
          >
            <Ionicons name="qr-code-outline" size={20} color="#ffd100" />
            <Text style={styles.scanBtnText}>Scan to Join Job</Text>
          </TouchableOpacity>
        </View>
      )}

      {state === 'clocked_in' && (
        <View style={styles.content}>
          <View style={styles.clockedBadge}>
            <View style={styles.dot} />
            <Text style={styles.clockedLabel}>CLOCKED IN</Text>
          </View>
          <Text style={styles.activeJob}>{activeJob}</Text>
          <Text style={styles.timer}>{formatElapsed(elapsed)}</Text>

          <View style={styles.qrSection}>
            <Text style={styles.qrLabel}>Show this QR to a colleague to let them sign in</Text>
            <View style={styles.qrBox}>
              <QRCode value={qrValue} size={180} backgroundColor="#fff" color="#111827" />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.outBtn, loading && styles.btnDisabled]}
            onPress={handleClockOut}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="stop-circle-outline" size={20} color="#fff" />
                <Text style={styles.outBtnText}>Clock Out</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {state === 'clocked_out' && (
        <View style={styles.content}>
          <Ionicons name="checkmark-circle" size={64} color="#22c55e" style={{ marginBottom: 16 }} />
          <Text style={styles.heading}>Clocked Out</Text>
          <Text style={styles.sub}>Your hours for {activeJob} have been logged to the timesheet.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleReset}>
            <Text style={styles.primaryBtnText}>Clock In to Another Job</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* QR Scanner modal */}
      <Modal visible={showScanner} presentationStyle="fullScreen" animationType="slide">
        <View style={styles.scannerRoot}>
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => handleScanResult(data)}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame} />
            <Text style={styles.scannerHint}>Scan a colleague's job QR code</Text>
          </View>
          <TouchableOpacity style={styles.closeScanner} onPress={() => setShowScanner(false)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  heading: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 8 },
  sub: { fontSize: 14, color: '#9ca3af', marginBottom: 28, lineHeight: 20 },
  input: {
    backgroundColor: '#1f2937', borderRadius: 14, borderWidth: 1, borderColor: '#374151',
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, color: '#fff',
    fontWeight: '700', letterSpacing: 1, marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: '#ffd100', borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#111827' },
  btnDisabled: { opacity: 0.4 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#374151' },
  dividerText: { fontSize: 13, color: '#6b7280' },
  scanBtn: {
    borderWidth: 1, borderColor: '#ffd100', borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  scanBtnText: { fontSize: 16, fontWeight: '700', color: '#ffd100' },
  clockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e' },
  clockedLabel: { fontSize: 12, fontWeight: '700', color: '#22c55e', letterSpacing: 1 },
  activeJob: { fontSize: 36, fontWeight: '900', color: '#ffd100', marginBottom: 8 },
  timer: { fontSize: 52, fontWeight: '300', color: '#fff', fontVariant: ['tabular-nums'], marginBottom: 32 },
  qrSection: { alignItems: 'center', marginBottom: 32 },
  qrLabel: { fontSize: 13, color: '#9ca3af', textAlign: 'center', marginBottom: 16 },
  qrBox: { backgroundColor: '#fff', padding: 16, borderRadius: 20 },
  outBtn: {
    backgroundColor: '#374151', borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  outBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  scannerRoot: { flex: 1, backgroundColor: '#000' },
  scannerOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  scannerFrame: {
    width: 240, height: 240, borderRadius: 20,
    borderWidth: 2, borderColor: '#ffd100',
  },
  scannerHint: { color: '#fff', fontSize: 14, marginTop: 24, textAlign: 'center' },
  closeScanner: {
    position: 'absolute', top: 56, right: 24,
    backgroundColor: '#00000080', borderRadius: 20, padding: 8,
  },
})
