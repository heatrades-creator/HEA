import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Linking, ActivityIndicator, TextInput, Alert, Modal,
  Clipboard, Image,
} from 'react-native'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import * as ImagePicker from 'expo-image-picker'
import {
  fetchJob, fetchComments, postComment, uploadJobPhoto, uploadJobReceipt,
  claimJob, unclaimJob, fetchPhotos, fetchAllClaims,
} from '@/lib/api'
import { getInstallerProfile } from '@/lib/auth'
import type { GASJob, Comment, JobClaim } from '@/lib/types'

const MAX_JOBS_PER_DAY = 5

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// ── Month Calendar ─────────────────────────────────────────────────────────
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_NAMES = ['Mo','Tu','We','Th','Fr','Sa','Su']

interface ClaimSummary {
  installDate: string
  installerId: string
  jobNumber: string
}

function MonthCalendar({
  selectedDate,
  onSelect,
  claims,
  myId,
  excludeJobNumber,
}: {
  selectedDate: string | null
  onSelect: (date: string) => void
  claims: ClaimSummary[]
  myId: string | null
  excludeJobNumber: string
}) {
  const initial = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date()
  const [year, setYear] = useState(initial.getFullYear())
  const [month, setMonth] = useState(initial.getMonth())

  const todayStr = toISODate(new Date())

  // Group claims by date, excluding the current job so editing doesn't inflate the count
  const byDate: Record<string, { count: number; mine: boolean }> = {}
  for (const c of claims) {
    if (c.jobNumber === excludeJobNumber) continue
    if (!byDate[c.installDate]) byDate[c.installDate] = { count: 0, mine: false }
    byDate[c.installDate].count++
    if (c.installerId === myId) byDate[c.installDate].mine = true
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  // Build grid cells (Mon-first)
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = (firstDay.getDay() + 6) % 7
  const cells: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const rows: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))

  return (
    <View>
      <View style={calStyles.nav}>
        <TouchableOpacity onPress={prevMonth} style={calStyles.navBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={calStyles.monthTitle}>{MONTH_NAMES[month]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} style={calStyles.navBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={calStyles.row}>
        {DAY_NAMES.map(d => (
          <View key={d} style={calStyles.cell}>
            <Text style={calStyles.dayName}>{d}</Text>
          </View>
        ))}
      </View>

      {rows.map((row, ri) => (
        <View key={ri} style={calStyles.row}>
          {row.map((d, ci) => {
            if (!d) return <View key={ci} style={calStyles.cell} />
            const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            const info = byDate[ds]
            const count = info?.count ?? 0
            const mine = info?.mine ?? false
            const full = count >= MAX_JOBS_PER_DAY
            const isSelected = selectedDate === ds
            const isPast = ds < todayStr

            return (
              <TouchableOpacity
                key={ci}
                style={[
                  calStyles.cell, calStyles.dateCell,
                  isSelected && calStyles.cellSelected,
                  full && !isSelected && calStyles.cellFull,
                  isPast && calStyles.cellPast,
                ]}
                onPress={() => { if (!full && !isPast) onSelect(ds) }}
                disabled={full || isPast}
                activeOpacity={0.7}
              >
                <Text style={[
                  calStyles.dateNum,
                  isSelected && calStyles.dateNumSelected,
                  isPast && calStyles.dateNumPast,
                ]}>{d}</Text>
                {count > 0 && (
                  <View style={calStyles.dots}>
                    {Array.from({ length: Math.min(count, 5) }, (_, i) => (
                      <View key={i} style={[
                        calStyles.dot,
                        full ? calStyles.dotFull : mine ? calStyles.dotMine : calStyles.dotOther,
                      ]} />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      ))}

      <View style={calStyles.legend}>
        <View style={calStyles.legendItem}><View style={[calStyles.dot, calStyles.dotMine]} /><Text style={calStyles.legendText}>Your job</Text></View>
        <View style={calStyles.legendItem}><View style={[calStyles.dot, calStyles.dotOther]} /><Text style={calStyles.legendText}>Team job</Text></View>
        <View style={calStyles.legendItem}><View style={[calStyles.dot, calStyles.dotFull]} /><Text style={calStyles.legendText}>Full (5/day max)</Text></View>
      </View>
    </View>
  )
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()
  const [job, setJob] = useState<GASJob | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState<'photo' | 'receipt' | null>(null)
  const [myId, setMyId] = useState<string | null>(null)

  // Claim state
  const [claim, setClaim] = useState<JobClaim | null>(null)
  const [claimModalVisible, setClaimModalVisible] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [calendarClaims, setCalendarClaims] = useState<ClaimSummary[]>([])
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [claimBusy, setClaimBusy] = useState(false)

  // Job pack modal
  const [packVisible, setPackVisible] = useState(false)
  const [photos, setPhotos] = useState<Array<{ name: string; url: string; id: string }>>([])
  const [photosLoading, setPhotosLoading] = useState(false)

  useEffect(() => {
    Promise.all([fetchJob(id), fetchComments(id), getInstallerProfile()])
      .then(([j, c, profile]) => {
        setJob(j)
        setClaim(j.claim)
        setComments(c)
        setMyId(profile?.id ?? null)
        navigation.setOptions({ title: j.jobNumber })
        setLoading(false)
      }).catch(() => setLoading(false))
  }, [id])

  // Load all claims when modal opens (for calendar availability)
  useEffect(() => {
    if (!claimModalVisible) return
    setCalendarLoading(true)
    fetchAllClaims()
      .then(setCalendarClaims)
      .catch(() => {})
      .finally(() => setCalendarLoading(false))
  }, [claimModalVisible])

  async function openJobPack() {
    setPackVisible(true)
    if (photos.length === 0) {
      setPhotosLoading(true)
      try { const p = await fetchPhotos(id); setPhotos(p) } catch {}
      setPhotosLoading(false)
    }
  }

  async function pickAndUpload(type: 'photo' | 'receipt') {
    Alert.alert(
      type === 'photo' ? 'Site Photo' : 'Job Receipt',
      'Choose source',
      [
        {
          text: 'Camera', onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync()
            if (status !== 'granted') { Alert.alert('Permission needed', 'Camera access is required.'); return }
            const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, base64: true })
            if (!result.canceled) await doUpload(type, result.assets[0])
          },
        },
        {
          text: 'Photo Library', onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
            if (status !== 'granted') { Alert.alert('Permission needed', 'Photo library access is required.'); return }
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true })
            if (!result.canceled) await doUpload(type, result.assets[0])
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    )
  }

  async function doUpload(type: 'photo' | 'receipt', asset: ImagePicker.ImagePickerAsset) {
    if (!asset.base64) { Alert.alert('Error', 'Could not read image data.'); return }
    setUploading(type)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    try {
      const ext = (asset.mimeType ?? 'image/jpeg').split('/')[1] ?? 'jpg'
      const filename = `${type}-${Date.now()}.${ext}`
      if (type === 'photo') {
        await uploadJobPhoto(id, filename, asset.base64, asset.mimeType ?? 'image/jpeg')
      } else {
        await uploadJobReceipt(id, filename, asset.base64, asset.mimeType ?? 'image/jpeg')
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Alert.alert('Uploaded', type === 'photo' ? 'Photo saved to job folder in Drive.' : 'Receipt saved to job folder in Drive.')
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Unknown error. Try again.')
    }
    setUploading(null)
  }

  async function submitComment() {
    if (!commentText.trim() || !id) return
    setSending(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    try {
      const c = await postComment(id, commentText.trim())
      setComments(prev => [...prev, c])
      setCommentText('')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Note failed', e instanceof Error ? e.message : 'Could not post note. Try again.')
    }
    setSending(false)
  }

  async function handleClaim() {
    if (!selectedDate) {
      Alert.alert('Select a date', 'Tap a date on the calendar to set your installation date.')
      return
    }
    setClaimBusy(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    try {
      const result = await claimJob(id, selectedDate)
      setClaim({
        installerId: result.installerId,
        installerName: result.installer.name,
        installDate: result.installDate,
        claimedAt: result.createdAt,
      })
      setClaimModalVisible(false)
      setSelectedDate(null)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Could not claim', e instanceof Error ? e.message : 'Try again.')
    }
    setClaimBusy(false)
  }

  async function handleUnclaim() {
    Alert.alert('Unclaim job?', 'This removes your name and installation date from this job.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unclaim', style: 'destructive', onPress: async () => {
          setClaimBusy(true)
          try {
            await unclaimJob(id)
            setClaim(null)
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Try again.')
          }
          setClaimBusy(false)
        },
      },
    ])
  }

  function addToGoogleCalendar() {
    if (!claim || !job) return
    const [y, m, d] = claim.installDate.split('-').map(Number)
    const end = new Date(y, m - 1, d + 1)
    const startStr = `${y}${String(m).padStart(2,'0')}${String(d).padStart(2,'0')}`
    const endStr = `${end.getFullYear()}${String(end.getMonth()+1).padStart(2,'0')}${String(end.getDate()).padStart(2,'0')}`
    const text = encodeURIComponent(`HEA Solar Installation — ${job.jobNumber}`)
    const details = encodeURIComponent(`Client: ${job.clientName}\nJob: ${job.jobNumber}\nAddress: ${job.address}`)
    const location = encodeURIComponent(job.address)
    Linking.openURL(
      `https://calendar.google.com/calendar/r/eventedit?text=${text}&dates=${startStr}/${endStr}&details=${details}&location=${location}`
    )
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#ffd100" /></View>
  }

  if (!job) {
    return <View style={styles.center}><Text style={styles.errorText}>Job not found</Text></View>
  }

  const isMyClaim = claim?.installerId === myId
  const isClaimed = !!claim

  return (
    <>
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

        {/* ── CLAIM SECTION ── */}
        <View style={[styles.claimSection, isClaimed && (isMyClaim ? styles.claimSectionMine : styles.claimSectionOther)]}>
          {!isClaimed ? (
            <>
              <View style={styles.claimRow}>
                <Ionicons name="radio-button-off-outline" size={20} color="#ffd100" />
                <Text style={styles.claimLabel}>Unclaimed</Text>
              </View>
              <Text style={styles.claimSub}>Tap below to claim this job and set your installation date.</Text>
              <TouchableOpacity
                style={styles.claimBtn}
                onPress={() => { setSelectedDate(null); setClaimModalVisible(true) }}
                activeOpacity={0.8}
              >
                <Ionicons name="person-add-outline" size={16} color="#111827" />
                <Text style={styles.claimBtnText}>Claim This Job</Text>
              </TouchableOpacity>
            </>
          ) : isMyClaim ? (
            <>
              <View style={styles.claimRow}>
                <Ionicons name="checkmark-circle" size={20} color="#34d399" />
                <Text style={[styles.claimLabel, { color: '#34d399' }]}>You claimed this job</Text>
              </View>
              <View style={styles.claimDateRow}>
                <Ionicons name="calendar-outline" size={14} color="#34d399" />
                <Text style={styles.claimDateText}>Install: {formatDate(claim!.installDate)}</Text>
              </View>
              <View style={styles.claimActions}>
                <TouchableOpacity
                  style={styles.claimEditBtn}
                  onPress={() => { setSelectedDate(claim!.installDate); setClaimModalVisible(true) }}
                  disabled={claimBusy}
                >
                  <Text style={styles.claimEditText}>Change Date</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.calendarBtn}
                  onPress={addToGoogleCalendar}
                >
                  <Ionicons name="calendar-outline" size={14} color="#60a5fa" />
                  <Text style={styles.calendarBtnText}>Add to Calendar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.unclaimBtn}
                  onPress={handleUnclaim}
                  disabled={claimBusy}
                >
                  <Text style={styles.unclaimText}>Unclaim</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.claimRow}>
                <Ionicons name="checkmark-circle" size={20} color="#60a5fa" />
                <Text style={[styles.claimLabel, { color: '#60a5fa' }]}>Claimed by {claim!.installerName}</Text>
              </View>
              <View style={styles.claimDateRow}>
                <Ionicons name="calendar-outline" size={14} color="#60a5fa" />
                <Text style={[styles.claimDateText, { color: '#60a5fa' }]}>Install: {formatDate(claim!.installDate)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Job Pack button (only when claimed) */}
        {isClaimed && (
          <TouchableOpacity style={styles.packBtn} onPress={openJobPack} activeOpacity={0.8}>
            <Ionicons name="document-text-outline" size={18} color="#111827" />
            <Text style={styles.packBtnText}>View Job Pack</Text>
          </TouchableOpacity>
        )}

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

        {/* Site Info */}
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

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Site Notes / BOM</Text>
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>{job.notes || 'No site notes.'}</Text>
          </View>
        </View>

        {/* Upload actions */}
        <View style={styles.uploadRow}>
          <TouchableOpacity
            style={[styles.uploadBtn, uploading === 'photo' && styles.uploadBtnDisabled]}
            onPress={() => pickAndUpload('photo')}
            disabled={uploading !== null}
            activeOpacity={0.7}
          >
            {uploading === 'photo'
              ? <ActivityIndicator size="small" color="#111827" />
              : <Ionicons name="camera-outline" size={18} color="#111827" />}
            <Text style={styles.uploadBtnText}>{uploading === 'photo' ? 'Uploading…' : 'Site Photo'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.uploadBtn, styles.uploadBtnReceipt, uploading === 'receipt' && styles.uploadBtnDisabled]}
            onPress={() => pickAndUpload('receipt')}
            disabled={uploading !== null}
            activeOpacity={0.7}
          >
            {uploading === 'receipt'
              ? <ActivityIndicator size="small" color="#ffd100" />
              : <Ionicons name="receipt-outline" size={18} color="#ffd100" />}
            <Text style={[styles.uploadBtnText, { color: '#ffd100' }]}>{uploading === 'receipt' ? 'Uploading…' : 'Job Receipt'}</Text>
          </TouchableOpacity>
        </View>

        {/* Drive folder */}
        {job.driveUrl ? (
          <TouchableOpacity style={styles.driveBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL(job.driveUrl) }}>
            <Ionicons name="folder-outline" size={18} color="#6b7280" />
            <Text style={styles.driveBtnAlt}>View all files in Drive ↗</Text>
          </TouchableOpacity>
        ) : null}

        {/* Field notes */}
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
                  {(c.replies ?? []).map(r => (
                    <View key={r.id} style={styles.replyRow}>
                      <Text style={styles.replyAuthor}>{r.installer?.name ?? 'HEA Office'}</Text>
                      <Text style={styles.replyBody}>{r.body}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

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
              {sending
                ? <ActivityIndicator size="small" color="#111827" />
                : <Ionicons name="send" size={18} color="#111827" />}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ── CLAIM MODAL ── */}
      <Modal visible={claimModalVisible} transparent animationType="slide" onRequestClose={() => setClaimModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setClaimModalVisible(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{claim && isMyClaim ? 'Change Installation Date' : 'Claim This Job'}</Text>
          <Text style={styles.modalSub}>
            {claim && isMyClaim
              ? 'Select the new scheduled installation date.'
              : 'Choose your installation date. Your name will be attached to this job for the whole team to see.'}
          </Text>

          {calendarLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator color="#ffd100" />
              <Text style={{ color: '#6b7280', marginTop: 8, fontSize: 13 }}>Loading team schedule…</Text>
            </View>
          ) : (
            <MonthCalendar
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              claims={calendarClaims}
              myId={myId}
              excludeJobNumber={id}
            />
          )}

          {selectedDate && (
            <View style={styles.selectedDateBanner}>
              <Ionicons name="calendar" size={16} color="#111827" />
              <Text style={styles.selectedDateText}>
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.claimConfirmBtn, (!selectedDate || claimBusy) && styles.claimConfirmDisabled]}
            onPress={handleClaim}
            disabled={!selectedDate || claimBusy}
            activeOpacity={0.8}
          >
            {claimBusy
              ? <ActivityIndicator size="small" color="#111827" />
              : <Ionicons name="checkmark-circle-outline" size={18} color="#111827" />}
            <Text style={styles.claimConfirmText}>
              {claimBusy ? 'Saving…' : claim && isMyClaim ? 'Update Date' : 'Confirm Claim'}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── JOB PACK MODAL ── */}
      <Modal visible={packVisible} animationType="slide" onRequestClose={() => setPackVisible(false)}>
        <View style={styles.packModal}>
          <View style={styles.packHeader}>
            <TouchableOpacity onPress={() => setPackVisible(false)} style={styles.packClose}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.packTitle}>Job Pack — {job.jobNumber}</Text>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
            {claim && (
              <View style={styles.packClaimBanner}>
                <Ionicons name="person-circle-outline" size={18} color="#34d399" />
                <Text style={styles.packClaimText}>
                  Installer: {claim.installerName} · Install: {formatDate(claim.installDate)}
                </Text>
              </View>
            )}

            <Text style={styles.packSection}>Client Details</Text>
            <View style={styles.packCard}>
              <PackRow label="Name" value={job.clientName} />
              <PackRow label="Phone" value={job.phone} onPress={() => Linking.openURL(`tel:${job.phone}`)} />
              <PackRow label="Email" value={job.email} onPress={() => Linking.openURL(`mailto:${job.email}`)} />
              <PackRow label="Address" value={job.address} onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(job.address)}`)} linkText="Open in Maps ↗" />
              {job.annualBill ? <PackRow label="Annual Bill" value={`$${job.annualBill}`} /> : null}
            </View>

            {(job.occupants || job.homeDaytime || job.hotWater) ? (
              <>
                <Text style={styles.packSection}>Household Profile</Text>
                <View style={styles.packCard}>
                  {job.occupants ? <PackRow label="Occupants" value={job.occupants} /> : null}
                  {job.homeDaytime ? <PackRow label="Home Daytime" value={job.homeDaytime} /> : null}
                  {job.hotWater ? <PackRow label="Hot Water" value={job.hotWater} /> : null}
                  {job.gasAppliances ? <PackRow label="Gas Appliances" value={job.gasAppliances} /> : null}
                  {job.ev ? <PackRow label="EV" value={job.ev} /> : null}
                </View>
              </>
            ) : null}

            <Text style={styles.packSection}>System Details</Text>
            <View style={styles.packCard}>
              {job.systemSize ? <PackRow label="Solar" value={`${job.systemSize} kW`} /> : null}
              {job.batterySize ? <PackRow label="Battery" value={`${job.batterySize} kWh`} /> : null}
              {job.totalPrice ? <PackRow label="Total Price" value={job.totalPrice} /> : null}
              {job.financeRequired !== undefined ? <PackRow label="Finance" value={job.financeRequired ? 'Required' : 'Not required'} /> : null}
            </View>

            <Text style={styles.packSection}>Site Info</Text>
            <View style={styles.packCard}>
              <PackRow label="WiFi SSID" value={job.wifiSsid || '—'} />
              {job.wifiPassword ? (
                <PackRow label="WiFi Password" value={job.wifiPassword} onPress={() => { Clipboard.setString(job.wifiPassword); Alert.alert('Copied', 'WiFi password copied') }} linkText="Tap to copy" />
              ) : (
                <PackRow label="WiFi Password" value="—" />
              )}
              <PackRow label="EPS Circuit 1" value={job.epsCircuit1 || '—'} />
              <PackRow label="EPS Circuit 2" value={job.epsCircuit2 || '—'} />
              <PackRow label="EPS Circuit 3" value={job.epsCircuit3 || '—'} />
            </View>

            {job.notes ? (
              <>
                <Text style={styles.packSection}>Site Notes / BOM</Text>
                <View style={styles.packNotesCard}>
                  <Text style={styles.packNotesText}>{job.notes}</Text>
                </View>
              </>
            ) : null}

            <Text style={styles.packSection}>Client Photos</Text>
            {photosLoading ? (
              <ActivityIndicator color="#ffd100" style={{ marginVertical: 12 }} />
            ) : photos.length === 0 ? (
              <Text style={styles.packEmpty}>No photos uploaded yet.</Text>
            ) : (
              <View style={styles.photoGrid}>
                {photos.map(p => (
                  <TouchableOpacity key={p.id} style={styles.photoThumb} onPress={() => Linking.openURL(p.url)} activeOpacity={0.8}>
                    <Image source={{ uri: p.url }} style={styles.photoImg} resizeMode="cover" />
                    <Text style={styles.photoName} numberOfLines={1}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {job.driveUrl ? (
              <TouchableOpacity style={styles.packDriveBtn} onPress={() => Linking.openURL(job.driveUrl)} activeOpacity={0.8}>
                <Ionicons name="folder-open-outline" size={18} color="#ffd100" />
                <Text style={styles.packDriveBtnText}>Open Client Drive Folder ↗</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </>
  )
}

function PackRow({ label, value, onPress, linkText }: { label: string; value: string; onPress?: () => void; linkText?: string }) {
  return (
    <View style={styles.packRow}>
      <Text style={styles.packLabel}>{label}</Text>
      {onPress ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={styles.packValue}>{value}</Text>
          {linkText ? <Text style={styles.packLink}>{linkText}</Text> : null}
        </TouchableOpacity>
      ) : (
        <Text style={[styles.packValue, { flex: 1, textAlign: 'right' }]}>{value}</Text>
      )}
    </View>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────

const calStyles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center' },
  monthTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  row: { flexDirection: 'row', marginBottom: 2 },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 3 },
  dayName: { fontSize: 10, color: '#6b7280', fontWeight: '700' },
  dateCell: { minHeight: 40, borderRadius: 8, paddingTop: 4, justifyContent: 'center' },
  cellSelected: { backgroundColor: '#ffd100' },
  cellFull: { backgroundColor: '#1f2937', opacity: 0.4 },
  cellPast: { opacity: 0.3 },
  dateNum: { fontSize: 13, fontWeight: '600', color: '#fff', textAlign: 'center' },
  dateNumSelected: { color: '#111827' },
  dateNumPast: { color: '#4b5563' },
  dots: { flexDirection: 'row', gap: 2, justifyContent: 'center', flexWrap: 'wrap', marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  dotMine: { backgroundColor: '#34d399' },
  dotOther: { backgroundColor: '#ffd100' },
  dotFull: { backgroundColor: '#ef4444' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 14, marginBottom: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendText: { fontSize: 11, color: '#6b7280' },
})

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
  claimSection: { backgroundColor: '#1f2937', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#374151', marginBottom: 14 },
  claimSectionMine: { borderColor: '#065f46', backgroundColor: '#064e3b22' },
  claimSectionOther: { borderColor: '#1e3a5f', backgroundColor: '#1e3a5f22' },
  claimRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  claimLabel: { fontSize: 16, fontWeight: '700', color: '#ffd100' },
  claimSub: { fontSize: 13, color: '#9ca3af', marginBottom: 14 },
  claimDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  claimDateText: { fontSize: 14, color: '#34d399', fontWeight: '600' },
  claimActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  claimBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#ffd100', borderRadius: 12, paddingVertical: 13 },
  claimBtnText: { fontSize: 15, fontWeight: '700', color: '#111827' },
  claimEditBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#34d399', minWidth: 90 },
  claimEditText: { fontSize: 12, fontWeight: '600', color: '#34d399' },
  calendarBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4, backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#60a5fa', minWidth: 90 },
  calendarBtnText: { fontSize: 12, fontWeight: '600', color: '#60a5fa' },
  unclaimBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#6b7280', minWidth: 90 },
  unclaimText: { fontSize: 12, fontWeight: '600', color: '#9ca3af' },
  packBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#ffd100', borderRadius: 12, paddingVertical: 13, marginBottom: 20 },
  packBtnText: { fontSize: 15, fontWeight: '700', color: '#111827' },
  specRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  specCard: { flex: 1, backgroundColor: '#1f2937', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#374151', alignItems: 'center' },
  specValue: { fontSize: 18, fontWeight: '800', color: '#fff' },
  specLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  infoGrid: { flexDirection: 'row', gap: 10 },
  infoCard: { flex: 1, backgroundColor: '#1f2937', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#374151' },
  infoLabel: { fontSize: 10, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  infoValue: { fontSize: 13, color: '#d1d5db', fontWeight: '600', marginBottom: 2 },
  infoSub: { fontSize: 11, color: '#6b7280', marginTop: 4 },
  notesBox: { backgroundColor: '#1f2937', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#374151' },
  notesText: { fontSize: 14, color: '#d1d5db', lineHeight: 22, fontFamily: 'monospace' },
  uploadRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  uploadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffd100', borderRadius: 14, paddingVertical: 14, gap: 8 },
  uploadBtnReceipt: { backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#ffd100' },
  uploadBtnDisabled: { opacity: 0.5 },
  uploadBtnText: { fontSize: 14, fontWeight: '700', color: '#111827' },
  driveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 24, paddingVertical: 8 },
  driveBtnAlt: { fontSize: 13, color: '#6b7280' },
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
  commentInput: { flex: 1, backgroundColor: '#1f2937', borderRadius: 12, borderWidth: 1, borderColor: '#374151', paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#fff', maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#ffd100', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  modalOverlay: { flex: 1, backgroundColor: '#00000088' },
  modalSheet: { backgroundColor: '#1f2937', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48 },
  modalHandle: { width: 36, height: 4, backgroundColor: '#374151', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 8 },
  modalSub: { fontSize: 14, color: '#9ca3af', marginBottom: 20, lineHeight: 20 },
  selectedDateBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ffd100', borderRadius: 12, padding: 12, marginTop: 16, marginBottom: 4 },
  selectedDateText: { fontSize: 14, fontWeight: '700', color: '#111827', flex: 1 },
  claimConfirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#ffd100', borderRadius: 14, paddingVertical: 16, marginTop: 16 },
  claimConfirmDisabled: { opacity: 0.4 },
  claimConfirmText: { fontSize: 16, fontWeight: '800', color: '#111827' },
  packModal: { flex: 1, backgroundColor: '#111827' },
  packHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16, backgroundColor: '#1f2937', borderBottomWidth: 1, borderBottomColor: '#374151' },
  packClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center' },
  packTitle: { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1 },
  packClaimBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#064e3b', borderRadius: 12, padding: 12, marginBottom: 20 },
  packClaimText: { fontSize: 14, color: '#34d399', fontWeight: '600', flex: 1 },
  packSection: { fontSize: 11, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 20 },
  packCard: { backgroundColor: '#1f2937', borderRadius: 14, borderWidth: 1, borderColor: '#374151', overflow: 'hidden' },
  packRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#374151' },
  packLabel: { fontSize: 13, color: '#6b7280', fontWeight: '500', marginRight: 8 },
  packValue: { fontSize: 13, color: '#fff', fontWeight: '600', textAlign: 'right' },
  packLink: { fontSize: 11, color: '#ffd100', marginTop: 2, textAlign: 'right' },
  packNotesCard: { backgroundColor: '#1f2937', borderRadius: 14, borderWidth: 1, borderColor: '#374151', padding: 14 },
  packNotesText: { fontSize: 14, color: '#d1d5db', lineHeight: 22, fontFamily: 'monospace' },
  packEmpty: { fontSize: 14, color: '#6b7280', fontStyle: 'italic', marginBottom: 8 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  photoThumb: { width: '47%', borderRadius: 10, overflow: 'hidden', backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151' },
  photoImg: { width: '100%', height: 110 },
  photoName: { fontSize: 11, color: '#9ca3af', padding: 6 },
  packDriveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, backgroundColor: '#1f2937', borderRadius: 14, borderWidth: 1, borderColor: '#ffd100', paddingVertical: 14 },
  packDriveBtnText: { fontSize: 15, fontWeight: '700', color: '#ffd100' },
})
