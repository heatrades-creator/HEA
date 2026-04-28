import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, TextInput,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { fetchJobs } from '@/lib/api'
import type { GASJob } from '@/lib/types'

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Booked:        { bg: '#7c3aed22', text: '#a78bfa' },
  'In Progress': { bg: '#d9770622', text: '#ffd100' },
}

export default function JobsScreen() {
  const [jobs, setJobs] = useState<GASJob[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const router = useRouter()

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    try {
      const data = await fetchJobs()
      setJobs(data)
    } catch {}
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

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Active Jobs</Text>
        <Text style={styles.subtitle}>{jobs.length} job{jobs.length !== 1 ? 's' : ''}</Text>
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

      <FlatList
        data={filtered}
        keyExtractor={item => item.jobNumber}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true) }} tintColor="#ffd100" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{loading ? 'Loading…' : 'No active jobs'}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const color = STATUS_COLORS[item.status] ?? { bg: '#374151', text: '#9ca3af' }
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push({ pathname: '/(tabs)/jobs/[id]', params: { id: item.jobNumber } })}
              activeOpacity={0.7}
            >
              <View style={styles.cardTop}>
                <View style={[styles.badge, { backgroundColor: color.bg }]}>
                  <Text style={[styles.badgeText, { color: color.text }]}>{item.jobNumber}</Text>
                </View>
                <View style={[styles.statusChip, { backgroundColor: color.bg }]}>
                  <Text style={[styles.statusText, { color: color.text }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.clientName}>{item.clientName}</Text>
              <Text style={styles.address} numberOfLines={1}>{item.address}</Text>
              <View style={styles.cardFooter}>
                {item.systemSize ? <Text style={styles.spec}>{item.systemSize} kW</Text> : null}
                {item.batterySize ? <Text style={styles.spec}>{item.batterySize} kWh battery</Text> : null}
              </View>
            </TouchableOpacity>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1f2937', borderRadius: 12,
    marginHorizontal: 16, marginVertical: 12,
    paddingHorizontal: 12, borderWidth: 1, borderColor: '#374151',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#fff', paddingVertical: 10 },
  card: {
    backgroundColor: '#1f2937', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#374151',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '600' },
  clientName: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  address: { fontSize: 13, color: '#9ca3af', marginBottom: 10 },
  cardFooter: { flexDirection: 'row', gap: 12 },
  spec: { fontSize: 12, color: '#ffd100', fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#6b7280', fontSize: 15 },
})
