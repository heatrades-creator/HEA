import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet,
  RefreshControl, TextInput,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { fetchJobs } from '@/lib/api'
import type { GASJob } from '@/lib/types'

function extractPostcode(address: string): string {
  const matches = address.match(/\b\d{4}\b/g)
  return matches ? matches[matches.length - 1] : 'Other'
}

function formatInstallDate(dateStr: string): string {
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    const [y, m, d] = parts
    return `${d}/${m}/${y}`
  }
  return dateStr
}

const VERSION = 'v2.1'

export default function JobsScreen() {
  const [jobs, setJobs] = useState<GASJob[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    setError(null)
    try {
      const data = await fetchJobs()
      setJobs(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    }
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { load() }, [])

  const filtered = jobs.filter(j =>
    !search ||
    j.clientName.toLowerCase().includes(search.toLowerCase()) ||
    j.jobNumber.toLowerCase().includes(search.toLowerCase()) ||
    j.address.toLowerCase().includes(search.toLowerCase())
  )

  // Group by postcode, sort sections ascending
  const grouped: Record<string, GASJob[]> = {}
  for (const job of filtered) {
    const pc = extractPostcode(job.address)
    if (!grouped[pc]) grouped[pc] = []
    grouped[pc].push(job)
  }
  const sections = Object.keys(grouped)
    .sort()
    .map(postcode => ({ title: postcode, data: grouped[postcode] }))

  const claimed = jobs.filter(j => j.claim).length
  const unclaimed = jobs.length - claimed

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Active Jobs</Text>
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

      <SectionList
        sections={sections}
        keyExtractor={item => item.jobNumber}
        contentContainerStyle={{ padding: 16, gap: 0, paddingBottom: 100 }}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true) }} tintColor="#ffd100" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{loading ? 'Loading…' : error ? `Error: ${error}` : 'No active jobs'}</Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <View style={styles.sectionLine} />
            <View style={styles.sectionPill}>
              <Ionicons name="location-outline" size={12} color="#ffd100" />
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionCount}>{section.data.length}</Text>
            </View>
            <View style={styles.sectionLine} />
          </View>
        )}
        renderItem={({ item }) => {
          const isClaimed = !!item.claim
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
                <View style={[styles.statusChip, isClaimed ? styles.chipClaimed : styles.chipAvailable]}>
                  {isClaimed
                    ? <Ionicons name="checkmark-circle" size={11} color="#34d399" style={{ marginRight: 4 }} />
                    : <Ionicons name="radio-button-off" size={11} color="#ffd100" style={{ marginRight: 4 }} />}
                  <Text style={[styles.statusText, isClaimed ? { color: '#34d399' } : { color: '#ffd100' }]}>
                    {isClaimed ? 'Claimed' : 'Available'}
                  </Text>
                </View>
              </View>

              <Text style={styles.clientName}>{item.clientName}</Text>
              <Text style={styles.address} numberOfLines={1}>{item.address}</Text>

              <View style={styles.cardFooter}>
                {item.systemSize ? <Text style={styles.spec}>{item.systemSize} kW</Text> : null}
                {item.batterySize ? <Text style={styles.spec}>{item.batterySize} kWh battery</Text> : null}
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
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff' },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  subtitle: { fontSize: 13, color: '#6b7280' },
  claimedPill: {
    backgroundColor: '#05603a', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2,
  },
  claimedPillText: { fontSize: 11, color: '#34d399', fontWeight: '600' },
  availablePill: {
    backgroundColor: '#78350f', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2,
  },
  availablePillText: { fontSize: 11, color: '#ffd100', fontWeight: '600' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1f2937', borderRadius: 12,
    marginHorizontal: 16, marginVertical: 12,
    paddingHorizontal: 12, borderWidth: 1, borderColor: '#374151',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#fff', paddingVertical: 10 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 10, marginTop: 8,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#1f2937' },
  sectionPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#1f2937', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#ffd100' },
  sectionCount: {
    fontSize: 11, color: '#6b7280', fontWeight: '600',
    backgroundColor: '#374151', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: '#1f2937', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#374151',
  },
  cardClaimed: { borderColor: '#065f46' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  jobNumBadge: { backgroundColor: '#111827', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  jobNumText: { fontSize: 12, fontWeight: '700', color: '#ffd100' },
  statusChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  chipClaimed: { backgroundColor: '#05603a' },
  chipAvailable: { backgroundColor: '#78350f22' },
  statusText: { fontSize: 11, fontWeight: '600' },
  clientName: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  address: { fontSize: 13, color: '#9ca3af', marginBottom: 10 },
  cardFooter: { flexDirection: 'row', gap: 12 },
  spec: { fontSize: 12, color: '#ffd100', fontWeight: '600' },
  claimBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: '#065f46',
  },
  claimText: { fontSize: 12, color: '#34d399', fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#6b7280', fontSize: 15 },
  version: { fontSize: 10, color: '#374151', fontWeight: '600' },
})
