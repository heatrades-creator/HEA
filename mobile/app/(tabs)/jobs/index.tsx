import { useEffect, useState, useCallback, useRef } from 'react'
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet,
  RefreshControl, TextInput, Linking, Alert, ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { fetchJobs, SessionExpiredError } from '@/lib/api'
import { clearAuth } from '@/lib/auth'
import { setupNotifications } from '@/lib/notifications'
import type { GASJob } from '@/lib/types'

const VERSION = 'v2.3'
const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://www.hea-group.com.au'
const DOWNLOAD_URL = `${BASE}/installer-app`

type GroupMode = 'postcode' | 'unclaimed' | 'date'
type ServiceFilter = 'all' | 'solar' | 'battery' | 'combo' | 'other'
type Section = { title: string; data: GASJob[] }

function extractPostcode(job: GASJob): string {
  if (job.postcode && job.postcode.match(/^\d{4}$/)) return job.postcode
  const matches = job.address.match(/\b\d{4}\b/g)
  return matches ? matches[matches.length - 1] : 'Other'
}

function detectService(job: GASJob): ServiceFilter {
  const n = (job.notes || '').toLowerCase()
  if (n.includes('solar + battery')) return 'combo'
  if (n.includes('solar system')) return 'solar'
  if (n.includes('battery add-on')) return 'battery'
  return 'other'
}

function parseCreatedDate(dateStr: string): number {
  if (!dateStr) return 0
  const [datePart, timePart] = dateStr.split(' ')
  const [d, m, y] = (datePart || '').split('/')
  if (!y) return 0
  const [hh, mm] = (timePart || '00:00').split(':')
  return new Date(+y, +m - 1, +d, +hh || 0, +mm || 0).getTime()
}

function dateGroup(dateStr: string): string {
  const t = parseCreatedDate(dateStr)
  if (!t) return 'Unknown'
  const diff = Date.now() - t
  const DAY = 86_400_000
  if (diff < DAY)       return 'Today'
  if (diff < 7 * DAY)  return 'This Week'
  if (diff < 30 * DAY) return 'This Month'
  return 'Earlier'
}

function formatInstallDate(dateStr: string): string {
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    const [y, m, d] = parts
    return `${d}/${m}/${y}`
  }
  return dateStr
}

const GROUP_OPTS: { key: GroupMode; label: string }[] = [
  { key: 'postcode',  label: 'Postcode' },
  { key: 'unclaimed', label: 'Unclaimed First' },
  { key: 'date',      label: 'Date Added' },
]

const SERVICE_OPTS: { key: ServiceFilter; label: string }[] = [
  { key: 'all',     label: 'All Services' },
  { key: 'solar',   label: '☀️ Solar Only' },
  { key: 'battery', label: '🔋 Battery Only' },
  { key: 'combo',   label: '☀️🔋 Solar + Battery' },
  { key: 'other',   label: '⚡ Other' },
]

const DATE_ORDER = ['Today', 'This Week', 'This Month', 'Earlier', 'Unknown']

export default function JobsScreen() {
  const [jobs, setJobs]                   = useState<GASJob[]>([])
  const [loading, setLoading]             = useState(true)
  const [refreshing, setRefreshing]       = useState(false)
  const [search, setSearch]               = useState('')
  const [error, setError]                 = useState<string | null>(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [groupMode, setGroupMode]         = useState<GroupMode>('postcode')
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>('all')
  const notificationsSetup = useRef(false)
  const router = useRouter()

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    setError(null)
    try {
      const data = await fetchJobs()
      setJobs(data)
    } catch (e) {
      if (e instanceof SessionExpiredError) {
        setError('session_expired')
      } else {
        setError(e instanceof Error ? e.message : 'Unknown error')
      }
    }
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    fetch(`${BASE}/api/installer/version`)
      .then(r => r.json())
      .then((data: { version: string }) => {
        if (data.version !== VERSION.replace('v', '')) setUpdateAvailable(true)
      })
      .catch(() => {})
  }, [])

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!notificationsSetup.current) {
      notificationsSetup.current = true
      setupNotifications().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const id = setInterval(() => load(true), 30_000)
    return () => clearInterval(id)
  }, [load])

  // Apply search then service filter
  const searched = jobs.filter(j =>
    !search ||
    j.clientName.toLowerCase().includes(search.toLowerCase()) ||
    j.jobNumber.toLowerCase().includes(search.toLowerCase()) ||
    j.address.toLowerCase().includes(search.toLowerCase())
  )
  const filtered = serviceFilter === 'all'
    ? searched
    : searched.filter(j => detectService(j) === serviceFilter)

  // Build sections by group mode
  let sections: Section[]
  if (groupMode === 'unclaimed') {
    const avail = filtered.filter(j => !j.claim)
    const taken = filtered.filter(j => !!j.claim)
    sections = [
      ...(avail.length ? [{ title: `Available (${avail.length})`, data: avail }] : []),
      ...(taken.length ? [{ title: `Claimed (${taken.length})`,   data: taken }] : []),
    ]
  } else if (groupMode === 'date') {
    const sorted = [...filtered].sort(
      (a, b) => parseCreatedDate(b.createdDate) - parseCreatedDate(a.createdDate)
    )
    const grouped: Record<string, GASJob[]> = {}
    for (const job of sorted) {
      const g = dateGroup(job.createdDate)
      if (!grouped[g]) grouped[g] = []
      grouped[g].push(job)
    }
    sections = DATE_ORDER.filter(k => grouped[k]).map(k => ({ title: k, data: grouped[k] }))
  } else {
    const grouped: Record<string, GASJob[]> = {}
    for (const job of filtered) {
      const pc = extractPostcode(job)
      if (!grouped[pc]) grouped[pc] = []
      grouped[pc].push(job)
    }
    sections = Object.keys(grouped).sort().map(pc => ({ title: pc, data: grouped[pc] }))
  }

  const claimed   = jobs.filter(j => j.claim).length
  const unclaimed = jobs.length - claimed

  const sectionIcon = (): string => {
    if (groupMode === 'unclaimed') return 'radio-button-off-outline'
    if (groupMode === 'date')      return 'calendar-outline'
    return 'location-outline'
  }

  return (
    <View style={styles.root}>
      {error === 'session_expired' && (
        <TouchableOpacity
          style={styles.sessionExpiredBanner}
          onPress={async () => { await clearAuth(); router.replace('/(auth)/login') }}
          activeOpacity={0.85}
        >
          <Ionicons name="alert-circle-outline" size={16} color="#fff" />
          <Text style={styles.sessionExpiredText}>Session expired — tap to sign in again</Text>
        </TouchableOpacity>
      )}
      {updateAvailable && (
        <TouchableOpacity
          style={styles.updateBanner}
          onPress={() => {
            Alert.alert(
              'Update Available',
              'A new version of the app is ready. Download and reinstall to get the latest features.',
              [
                { text: 'Later', style: 'cancel' },
                { text: 'Download Now', onPress: () => Linking.openURL(DOWNLOAD_URL) },
              ]
            )
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-down-circle-outline" size={16} color="#111827" />
          <Text style={styles.updateBannerText}>App update available — tap to download</Text>
        </TouchableOpacity>
      )}

      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Active Jobs</Text>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => { setRefreshing(true); load(true) }}
            disabled={loading || refreshing}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={20} color={loading || refreshing ? '#374151' : '#ffd100'} />
          </TouchableOpacity>
        </View>
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitle}>{jobs.length} job{jobs.length !== 1 ? 's' : ''}</Text>
          <Text style={styles.version}>{VERSION}</Text>
          {claimed > 0 && (
            <View style={styles.claimedPill}>
              <Text style={styles.claimedPillText}>{claimed} claimed</Text>
            </View>
          )}
          {unclaimed > 0 && (
            <View style={styles.availablePill}>
              <Text style={styles.availablePillText}>{unclaimed} available</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search jobs…"
          placeholderTextColor="#6b7280"
        />
      </View>

      {/* Group / Sort row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipRow}>
        {GROUP_OPTS.map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.chip, groupMode === opt.key && styles.chipActive]}
            onPress={() => setGroupMode(opt.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, groupMode === opt.key && styles.chipTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[styles.chip, styles.chipDisabled]} activeOpacity={1} disabled>
          <Text style={styles.chipTextDisabled}>$ Value (soon)</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Service filter row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.chipScroll, { marginBottom: 4 }]} contentContainerStyle={styles.chipRow}>
        {SERVICE_OPTS.map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.chip, serviceFilter === opt.key && styles.chipActive]}
            onPress={() => setServiceFilter(opt.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, serviceFilter === opt.key && styles.chipTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <SectionList
        sections={sections}
        keyExtractor={item => item.jobNumber}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true) }} tintColor="#ffd100" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            {error === 'session_expired' ? (
              <>
                <Text style={styles.emptyText}>Session expired — please sign in again.</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={async () => { await clearAuth(); router.replace('/(auth)/login') }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="log-in-outline" size={16} color="#ffd100" />
                  <Text style={styles.retryText}>Sign In Again</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.emptyText}>
                  {loading ? 'Loading…' : error ? `Error: ${error}` : 'No jobs match'}
                </Text>
                {!loading && (
                  <TouchableOpacity style={styles.retryBtn} onPress={() => load()} activeOpacity={0.7}>
                    <Ionicons name="refresh-outline" size={16} color="#ffd100" />
                    <Text style={styles.retryText}>Tap to retry</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <View style={styles.sectionLine} />
            <View style={styles.sectionPill}>
              <Ionicons name={sectionIcon() as any} size={12} color="#ffd100" />
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionCount}>{section.data.length}</Text>
            </View>
            <View style={styles.sectionLine} />
          </View>
        )}
        renderItem={({ item }) => {
          const isClaimed = !!item.claim
          const svc = detectService(item)
          const svcLabel =
            svc === 'solar'   ? '☀️ Solar' :
            svc === 'battery' ? '🔋 Battery' :
            svc === 'combo'   ? '☀️🔋 Combo' : '⚡ Other'
          return (
            <TouchableOpacity
              style={[styles.card, isClaimed && styles.cardClaimed]}
              onPress={() => router.push({ pathname: '/(tabs)/jobs/[id]', params: { id: item.jobNumber } })}
              activeOpacity={0.7}
            >
              <View style={styles.cardTop}>
                <View style={styles.jobNumBadge}>
                  <Text style={styles.jobNumText}>{item.jobNumber}</Text>
                </View>
                <View style={[styles.statusChip, isClaimed ? styles.chipClaimed : styles.chipAvail]}>
                  {isClaimed
                    ? <Ionicons name="checkmark-circle" size={11} color="#34d399" style={{ marginRight: 4 }} />
                    : <Ionicons name="radio-button-off" size={11} color="#ffd100" style={{ marginRight: 4 }} />}
                  <Text style={[styles.statusText, { color: isClaimed ? '#34d399' : '#ffd100' }]}>
                    {isClaimed ? 'Claimed' : 'Available'}
                  </Text>
                </View>
              </View>

              <Text style={styles.clientName}>{item.clientName}</Text>
              <Text style={styles.address} numberOfLines={1}>{item.address}</Text>

              <View style={styles.cardFooter}>
                {item.systemSize  ? <Text style={styles.spec}>{item.systemSize} kW</Text>  : null}
                {item.batterySize ? <Text style={styles.spec}>{item.batterySize} kWh</Text> : null}
                <View style={styles.svcTag}>
                  <Text style={styles.svcTagText}>{svcLabel}</Text>
                </View>
                <View style={styles.statusTag}>
                  <Text style={styles.statusTagText}>{item.status}</Text>
                </View>
              </View>

              {isClaimed && item.claim ? (
                <View style={styles.claimBanner}>
                  <Ionicons name="person-outline" size={12} color="#34d399" />
                  <Text style={styles.claimText}>
                    {item.claim.installerName} · {formatInstallDate(item.claim.installDate)}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          )
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        SectionSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  sessionExpiredBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#ef4444', paddingHorizontal: 16, paddingVertical: 10,
  },
  sessionExpiredText: { fontSize: 13, fontWeight: '700', color: '#fff', flex: 1 },
  updateBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#ffd100', paddingHorizontal: 16, paddingVertical: 10,
  },
  updateBannerText: { fontSize: 13, fontWeight: '700', color: '#111827', flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 26, fontWeight: '800', color: '#fff' },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#374151',
  },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  subtitle: { fontSize: 13, color: '#6b7280' },
  version: { fontSize: 10, color: '#374151', fontWeight: '600' },
  claimedPill: { backgroundColor: '#05603a', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  claimedPillText: { fontSize: 11, color: '#34d399', fontWeight: '600' },
  availablePill: { backgroundColor: '#78350f', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  availablePillText: { fontSize: 11, color: '#ffd100', fontWeight: '600' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1f2937', borderRadius: 12,
    marginHorizontal: 16, marginVertical: 10,
    paddingHorizontal: 12, borderWidth: 1, borderColor: '#374151',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#fff', paddingVertical: 10 },
  // Filter chip rows
  chipScroll: { height: 36, flexShrink: 0 },
  chipRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginRight: 8,
    backgroundColor: '#6b7280',
  },
  chipActive:       { backgroundColor: '#ffd100' },
  chipDisabled:     { opacity: 0.35 },
  chipText:         { fontSize: 12, fontWeight: '600', color: '#ffffff' },
  chipTextActive:   { color: '#111827' },
  chipTextDisabled: { fontSize: 11, fontWeight: '600', color: '#9ca3af' },
  // Section headers
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 8 },
  sectionLine:   { flex: 1, height: 1, backgroundColor: '#1f2937' },
  sectionPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#1f2937', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#ffd100' },
  sectionCount: {
    fontSize: 11, color: '#6b7280', fontWeight: '600',
    backgroundColor: '#374151', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1, overflow: 'hidden',
  },
  // Cards
  card:        { backgroundColor: '#1f2937', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#374151' },
  cardClaimed: { borderColor: '#065f46' },
  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  jobNumBadge: { backgroundColor: '#111827', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  jobNumText:  { fontSize: 12, fontWeight: '700', color: '#ffd100' },
  statusChip:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  chipClaimed: { backgroundColor: '#05603a' },
  chipAvail:   { backgroundColor: '#78350f22' },
  statusText:  { fontSize: 11, fontWeight: '600' },
  clientName:  { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  address:     { fontSize: 13, color: '#9ca3af', marginBottom: 10 },
  cardFooter:  { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  spec:        { fontSize: 12, color: '#ffd100', fontWeight: '600' },
  svcTag:      { backgroundColor: '#111827', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  svcTagText:  { fontSize: 11, color: '#d1d5db', fontWeight: '600' },
  statusTag:   { marginLeft: 'auto', backgroundColor: '#111827', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusTagText: { fontSize: 11, color: '#6b7280', fontWeight: '600' },
  claimBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#065f46',
  },
  claimText: { fontSize: 12, color: '#34d399', fontWeight: '600' },
  empty:     { alignItems: 'center', paddingTop: 60, gap: 16 },
  emptyText: { color: '#6b7280', fontSize: 15 },
  retryBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#1f2937', borderRadius: 10, borderWidth: 1, borderColor: '#374151' },
  retryText: { fontSize: 14, color: '#ffd100', fontWeight: '600' },
})
