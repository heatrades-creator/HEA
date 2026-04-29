import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Linking, ActivityIndicator, TextInput, Alert, Clipboard,
} from 'react-native'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { fetchJob, fetchComments, postComment } from '@/lib/api'
import type { GASJob, Comment } from '@/lib/types'

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()
  const [job, setJob] = useState<GASJob | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    Promise.all([fetchJob(id), fetchComments(id)]).then(([j, c]) => {
      setJob(j)
      setComments(c)
      navigation.setOptions({ title: j.jobNumber })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  async function submitComment() {
    if (!commentText.trim() || !id) return
    setSending(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    try {
      const c = await postComment(id, commentText.trim())
      setComments(prev => [...prev, c])
      setCommentText('')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch {
      Alert.alert('Error', 'Failed to post note. Try again.')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }
    setSending(false)
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#ffd100" /></View>
  }

  if (!job) {
    return <View style={styles.center}><Text style={styles.errorText}>Job not found</Text></View>
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.jobNumber}>{job.jobNumber}</Text>
        <View style={styles.statusChip}>
          <Text style={styles.statusText}>{job.status}</Text>
        </View>
      </View>
      <Text style={styles.clientName}>{job.clientName}</Text>

      {/* Address + Maps */}
      <TouchableOpacity
        style={styles.addressRow}
        onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(job.address)}`)}
        activeOpacity={0.7}
      >
        <Ionicons name="navigate-outline" size={15} color="#ffd100" />
        <Text style={styles.addressText}>{job.address}</Text>
        <Text style={styles.mapsLink}>Maps ↗</Text>
      </TouchableOpacity>

      {/* Contact */}
      <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`tel:${job.phone}`)}>
        <Ionicons name="call-outline" size={16} color="#ffd100" />
        <Text style={styles.contactText}>{job.phone}</Text>
      </TouchableOpacity>

      {/* System specs */}
      <View style={styles.specRow}>
        {job.systemSize ? (
          <View style={styles.specCard}>
            <Text style={styles.specValue}>{job.systemSize}</Text>
            <Text style={styles.specLabel}>kW Solar</Text>
          </View>
        ) : null}
        {job.batterySize ? (
          <View style={styles.specCard}>
            <Text style={styles.specValue}>{job.batterySize}</Text>
            <Text style={styles.specLabel}>kWh Battery</Text>
          </View>
        ) : null}
        {job.totalPrice ? (
          <View style={styles.specCard}>
            <Text style={styles.specValue}>{job.totalPrice}</Text>
            <Text style={styles.specLabel}>Quote</Text>
          </View>
        ) : null}
      </View>

      {/* Site Info: WiFi + EPS */}
      {(job.wifiSsid || job.epsCircuit1) ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Site Info</Text>
          <View style={styles.infoGrid}>
            {job.wifiSsid ? (
              <TouchableOpacity
                style={styles.infoCard}
                onPress={() => {
                  Clipboard.setString(job.wifiPassword || job.wifiSsid)
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  Alert.alert('Copied', 'WiFi password copied')
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="wifi-outline" size={18} color="#ffd100" style={{ marginBottom: 6 }} />
                <Text style={styles.infoLabel}>WiFi</Text>
                <Text style={styles.infoValue}>{job.wifiSsid}</Text>
                {job.wifiPassword ? <Text style={styles.infoSub}>Tap to copy password</Text> : null}
              </TouchableOpacity>
            ) : null}
            {(job.epsCircuit1 || job.epsCircuit2 || job.epsCircuit3) ? (
              <View style={styles.infoCard}>
                <Ionicons name="battery-charging-outline" size={18} color="#ffd100" style={{ marginBottom: 6 }} />
                <Text style={styles.infoLabel}>EPS Circuits</Text>
                {job.epsCircuit1 ? <Text style={styles.infoValue}>{job.epsCircuit1}</Text> : null}
                {job.epsCircuit2 ? <Text style={styles.infoValue}>{job.epsCircuit2}</Text> : null}
                {job.epsCircuit3 ? <Text style={styles.infoValue}>{job.epsCircuit3}</Text> : null}
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Notes (BOM / site details) */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Site Notes / BOM</Text>
        <View style={styles.notesBox}>
          <Text style={styles.notesText}>{job.notes || 'No site notes.'}</Text>
        </View>
      </View>

      {/* Drive photos */}
      {job.driveUrl ? (
        <TouchableOpacity style={styles.driveBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL(job.driveUrl) }}>
          <Ionicons name="images-outline" size={18} color="#111827" />
          <Text style={styles.driveBtnText}>View Photos in Drive</Text>
        </TouchableOpacity>
      ) : null}

      {/* Field notes / comments */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Field Notes ({comments.length})</Text>
        {comments.length === 0 ? (
          <Text style={styles.emptyNotes}>No field notes yet. Be the first to add one.</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {comments.map(c => (
              <View key={c.id} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{(c.installer?.name ?? 'HEA')[0].toUpperCase()}</Text>
                  </View>
                  <Text style={styles.commentAuthor}>{c.installer?.name ?? 'HEA Office'}</Text>
                  <Text style={styles.commentTime}>{timeAgo(c.createdAt)}</Text>
                </View>
                <Text style={styles.commentBody}>{c.body}</Text>
                {c.replies.map(r => (
                  <View key={r.id} style={styles.replyRow}>
                    <Text style={styles.replyAuthor}>{r.installer?.name ?? 'HEA Office'}</Text>
                    <Text style={styles.replyBody}>{r.body}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Comment input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.commentInput}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Add a field note…"
            placeholderTextColor="#6b7280"
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!commentText.trim() || sending) && styles.sendBtnDisabled]}
            onPress={submitComment}
            disabled={!commentText.trim() || sending}
          >
            <Ionicons name="send" size={18} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' },
  errorText: { color: '#6b7280', fontSize: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  jobNumber: { fontSize: 14, fontWeight: '700', color: '#ffd100' },
  statusChip: { backgroundColor: '#d9770622', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { color: '#ffd100', fontSize: 11, fontWeight: '600' },
  clientName: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 8 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  addressText: { flex: 1, fontSize: 14, color: '#9ca3af' },
  mapsLink: { fontSize: 12, color: '#ffd100', fontWeight: '700' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  contactText: { fontSize: 15, color: '#ffd100', fontWeight: '600' },
  specRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  specCard: {
    flex: 1, backgroundColor: '#1f2937', borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: '#374151', alignItems: 'center',
  },
  specValue: { fontSize: 18, fontWeight: '800', color: '#fff' },
  specLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },
  infoGrid: { flexDirection: 'row', gap: 10 },
  infoCard: {
    flex: 1, backgroundColor: '#1f2937', borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: '#374151',
  },
  infoLabel: { fontSize: 10, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  infoValue: { fontSize: 13, color: '#d1d5db', fontWeight: '600', marginBottom: 2 },
  infoSub: { fontSize: 11, color: '#6b7280', marginTop: 4 },
  notesBox: { backgroundColor: '#1f2937', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#374151' },
  notesText: { fontSize: 14, color: '#d1d5db', lineHeight: 22, fontFamily: 'monospace' },
  driveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ffd100', borderRadius: 14, paddingVertical: 14,
    gap: 8, marginBottom: 24,
  },
  driveBtnText: { fontSize: 15, fontWeight: '700', color: '#111827' },
  emptyNotes: { fontSize: 14, color: '#6b7280', fontStyle: 'italic' },
  commentCard: { backgroundColor: '#1f2937', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#374151' },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  avatarCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ffd100', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 11, fontWeight: '800', color: '#111827' },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: '#fff', flex: 1 },
  commentTime: { fontSize: 11, color: '#6b7280' },
  commentBody: { fontSize: 14, color: '#d1d5db', lineHeight: 20 },
  replyRow: { marginTop: 8, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: '#374151' },
  replyAuthor: { fontSize: 12, fontWeight: '600', color: '#9ca3af', marginBottom: 2 },
  replyBody: { fontSize: 13, color: '#d1d5db' },
  inputRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-end', marginTop: 12 },
  commentInput: {
    flex: 1, backgroundColor: '#1f2937', borderRadius: 12,
    borderWidth: 1, borderColor: '#374151', paddingHorizontal: 14,
    paddingVertical: 10, fontSize: 14, color: '#fff', maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#ffd100', alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
})
