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
  claimJob, unclaimJob, fetchPhotos,
} from '@/lib/api'
import { getInstallerProfile } from '@/lib/auth'
import type { GASJob, Comment, JobClaim } from '@/lib/types'

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Date input: accepts YYYY-MM-DD, displays as DD/MM/YYYY
function parseInputDate(raw: string): string | null {
  const clean = raw.replace(/\D/g, '')
  if (clean.length !== 8) return null
  const d = clean.slice(0, 2), m = clean.slice(2, 4), y = clean.slice(4, 8)
  const dt = new Date(`${y}-${m}-${d}`)
  if (isNaN(dt.getTime())) return null
  return `${y}-${m}-${d}`
}

function autoFormatDateInput(text: string, prev: string): string {
  const digits = text.replace(/\D/g, '')
  if (text.length < prev.length) {
    // Backspace — strip trailing slash
    return text.replace(/\/$/, '')
  }
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`
}

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
  const [dateInput, setDateInput] = useState('')
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

  async function openJobPack() {
    setPackVisible(true)
    if (photos.length === 0) {
      setPhotosLoading(true)
      try {
        const p = await fetchPhotos(id)
        setPhotos(p)
      } catch {}
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
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Try again.')
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
    } catch {
      Alert.alert('Error', 'Failed to post note. Try again.')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }
    setSending(false)
  }

  async function handleClaim() {
    const isoDate = parseInputDate(dateInput)
    if (!isoDate) {
      Alert.alert('Invalid date', 'Enter a valid date as DD/MM/YYYY')
      return
    }
    setClaimBusy(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    try {
      const result = await claimJob(id, isoDate)
      setClaim({
        installerId: result.installerId,
        installerName: result.installer.name,
        installDate: result.installDate,
        claimedAt: result.createdAt,
      })
      setClaimModalVisible(false)
      setDateInput('')
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
                onPress={() => setClaimModalVisible(true)}
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
                <Text style={styles.claimDateText}>
                  Install: {formatDate(claim!.installDate)}
                </Text>
              </View>
              <View style={styles.claimActions}>
                <TouchableOpacity
                  style={styles.claimEditBtn}
                  onPress={() => {
                    const [y, m, d] = claim!.installDate.split('-')
                    setDateInput(`${d}/${m}/${y}`)
                    setClaimModalVisible(true)
                  }}
                  disabled={claimBusy}
                >
                  <Text style={styles.claimEditText}>Change Date</Text>
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
                <Text style={[styles.claimDateText, { color: '#60a5fa' }]}>
                  Install: {formatDate(claim!.installDate)}
                </Text>
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

      {/* ── CLAIM MODAL ── */}
      <Modal visible={claimModalVisible} transparent animationType="slide" onRequestClose={() => setClaimModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setClaimModalVisible(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{isMyClaim ? 'Update Installation Date' : 'Claim This Job'}</Text>
          <Text style={styles.modalSub}>
            {isMyClaim
              ? 'Change the scheduled installation date for this job.'
              : 'Enter the scheduled installation date. Your name will be attached to this job for everyone to see.'}
          </Text>

          <Text style={styles.inputLabel}>Installation Date</Text>
          <TextInput
            style={styles.dateInput}
            value={dateInput}
            onChangeText={text => setDateInput(autoFormatDateInput(text, dateInput))}
            placeholder="DD/MM/YYYY"
            placeholderTextColor="#6b7280"
            keyboardType="numeric"
            maxLength={10}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.claimConfirmBtn, claimBusy && styles.uploadBtnDisabled]}
            onPress={handleClaim}
            disabled={claimBusy}
            activeOpacity={0.8}
          >
            {claimBusy
              ? <ActivityIndicator size="small" color="#111827" />
              : <Ionicons name="checkmark-circle-outline" size={18} color="#111827" />}
            <Text style={styles.claimConfirmText}>
              {claimBusy ? 'Saving…' : isMyClaim ? 'Update Date' : 'Confirm Claim'}
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
            {/* Claim info banner */}
            {claim && (
              <View style={styles.packClaimBanner}>
                <Ionicons name="person-circle-outline" size={18} color="#34d399" />
                <Text style={styles.packClaimText}>
                  Installer: {claim.installerName} · Install: {formatDate(claim.installDate)}
                </Text>
              </View>
            )}

            {/* Client */}
            <Text style={styles.packSection}>Client Details</Text>
            <View style={styles.packCard}>
              <PackRow label="Name" value={job.clientName} />
              <PackRow label="Phone" value={job.phone} onPress={() => Linking.openURL(`tel:${job.phone}`)} />
              <PackRow label="Email" value={job.email} onPress={() => Linking.openURL(`mailto:${job.email}`)} />
              <PackRow
                label="Address"
                value={job.address}
                onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(job.address)}`)}
                linkText="Open in Maps ↗"
              />
              {job.annualBill ? <PackRow label="Annual Bill" value={`$${job.annualBill}`} /> : null}
            </View>

            {/* Household */}
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

            {/* System */}
            <Text style={styles.packSection}>System Details</Text>
            <View style={styles.packCard}>
              {job.systemSize ? <PackRow label="Solar" value={`${job.systemSize} kW`} /> : null}
              {job.batterySize ? <PackRow label="Battery" value={`${job.batterySize} kWh`} /> : null}
              {job.totalPrice ? <PackRow label="Total Price" value={job.totalPrice} /> : null}
              {job.financeRequired !== undefined ? <PackRow label="Finance" value={job.financeRequired ? 'Required' : 'Not required'} /> : null}
            </View>

            {/* Site */}
            {(job.wifiSsid || job.epsCircuit1) ? (
              <>
                <Text style={styles.packSection}>Site Info</Text>
                <View style={styles.packCard}>
                  {job.wifiSsid ? <PackRow label="WiFi SSID" value={job.wifiSsid} /> : null}
                  {job.wifiPassword ? (
                    <PackRow
                      label="WiFi Password"
                      value={job.wifiPassword}
                      onPress={() => { Clipboard.setString(job.wifiPassword); Alert.alert('Copied', 'WiFi password copied') }}
                      linkText="Tap to copy"
                    />
                  ) : null}
                  {job.epsCircuit1 ? <PackRow label="EPS Circuit 1" value={job.epsCircuit1} /> : null}
                  {job.epsCircuit2 ? <PackRow label="EPS Circuit 2" value={job.epsCircuit2} /> : null}
                  {job.epsCircuit3 ? <PackRow label="EPS Circuit 3" value={job.epsCircuit3} /> : null}
                </View>
              </>
            ) : null}

            {/* Notes */}
            {job.notes ? (
              <>
                <Text style={styles.packSection}>Site Notes / BOM</Text>
                <View style={styles.packNotesCard}>
                  <Text style={styles.packNotesText}>{job.notes}</Text>
                </View>
              </>
            ) : null}

            {/* Photos */}
            <Text style={styles.packSection}>Client Photos</Text>
            {photosLoading ? (
              <ActivityIndicator color="#ffd100" style={{ marginVertical: 12 }} />
            ) : photos.length === 0 ? (
              <Text style={styles.packEmpty}>No photos uploaded yet.</Text>
            ) : (
              <View style={styles.photoGrid}>
                {photos.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.photoThumb}
                    onPress={() => Linking.openURL(p.url)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: p.url }} style={styles.photoImg} resizeMode="cover" />
                    <Text style={styles.photoName} numberOfLines={1}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Drive link */}
            {job.driveUrl ? (
              <TouchableOpacity
                style={styles.packDriveBtn}
                onPress={() => Linking.openURL(job.driveUrl)}
                activeOpacity={0.8}
              >
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

function PackRow({
  label, value, onPress, linkText,
}: {
  label: string
  value: string
  onPress?: () => void
  linkText?: string
}) {
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

  // Claim section
  claimSection: {
    backgroundColor: '#1f2937', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#374151', marginBottom: 14,
  },
  claimSectionMine: { borderColor: '#065f46', backgroundColor: '#064e3b22' },
  claimSectionOther: { borderColor: '#1e3a5f', backgroundColor: '#1e3a5f22' },
  claimRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  claimLabel: { fontSize: 16, fontWeight: '700', color: '#ffd100' },
  claimSub: { fontSize: 13, color: '#9ca3af', marginBottom: 14 },
  claimDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  claimDateText: { fontSize: 14, color: '#34d399', fontWeight: '600' },
  claimActions: { flexDirection: 'row', gap: 10 },
  claimBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#ffd100', borderRadius: 12, paddingVertical: 13,
  },
  claimBtnText: { fontSize: 15, fontWeight: '700', color: '#111827' },
  claimEditBtn: {
    flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center',
    backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#34d399',
  },
  claimEditText: { fontSize: 13, fontWeight: '600', color: '#34d399' },
  unclaimBtn: {
    flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center',
    backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#6b7280',
  },
  unclaimText: { fontSize: 13, fontWeight: '600', color: '#9ca3af' },
  packBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#ffd100', borderRadius: 12, paddingVertical: 13, marginBottom: 20,
  },
  packBtnText: { fontSize: 15, fontWeight: '700', color: '#111827' },

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
  uploadRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  uploadBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ffd100', borderRadius: 14, paddingVertical: 14, gap: 8,
  },
  uploadBtnReceipt: { backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#ffd100' },
  uploadBtnDisabled: { opacity: 0.5 },
  uploadBtnText: { fontSize: 14, fontWeight: '700', color: '#111827' },
  driveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginBottom: 24, paddingVertical: 8,
  },
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

  // Claim modal
  modalOverlay: { flex: 1, backgroundColor: '#00000088' },
  modalSheet: {
    backgroundColor: '#1f2937', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 48,
  },
  modalHandle: {
    width: 36, height: 4, backgroundColor: '#374151',
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 8 },
  modalSub: { fontSize: 14, color: '#9ca3af', marginBottom: 24, lineHeight: 20 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  dateInput: {
    backgroundColor: '#111827', borderRadius: 12, borderWidth: 1, borderColor: '#374151',
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 22, color: '#fff',
    fontWeight: '700', letterSpacing: 2, marginBottom: 20, textAlign: 'center',
  },
  claimConfirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#ffd100', borderRadius: 14, paddingVertical: 16,
  },
  claimConfirmText: { fontSize: 16, fontWeight: '800', color: '#111827' },

  // Job pack modal
  packModal: { flex: 1, backgroundColor: '#111827' },
  packHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16,
    backgroundColor: '#1f2937', borderBottomWidth: 1, borderBottomColor: '#374151',
  },
  packClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center' },
  packTitle: { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1 },
  packClaimBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#064e3b', borderRadius: 12, padding: 12, marginBottom: 20,
  },
  packClaimText: { fontSize: 14, color: '#34d399', fontWeight: '600', flex: 1 },
  packSection: {
    fontSize: 11, fontWeight: '700', color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 20,
  },
  packCard: {
    backgroundColor: '#1f2937', borderRadius: 14,
    borderWidth: 1, borderColor: '#374151', overflow: 'hidden',
  },
  packRow: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#374151',
  },
  packLabel: { fontSize: 13, color: '#6b7280', fontWeight: '500', marginRight: 8 },
  packValue: { fontSize: 13, color: '#fff', fontWeight: '600', textAlign: 'right' },
  packLink: { fontSize: 11, color: '#ffd100', marginTop: 2, textAlign: 'right' },
  packNotesCard: {
    backgroundColor: '#1f2937', borderRadius: 14,
    borderWidth: 1, borderColor: '#374151', padding: 14,
  },
  packNotesText: { fontSize: 14, color: '#d1d5db', lineHeight: 22, fontFamily: 'monospace' },
  packEmpty: { fontSize: 14, color: '#6b7280', fontStyle: 'italic', marginBottom: 8 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  photoThumb: {
    width: '47%', borderRadius: 10, overflow: 'hidden',
    backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151',
  },
  photoImg: { width: '100%', height: 110 },
  photoName: { fontSize: 11, color: '#9ca3af', padding: 6 },
  packDriveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 20, backgroundColor: '#1f2937', borderRadius: 14,
    borderWidth: 1, borderColor: '#ffd100', paddingVertical: 14,
  },
  packDriveBtnText: { fontSize: 15, fontWeight: '700', color: '#ffd100' },
})
