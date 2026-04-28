import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet,
  Linking, RefreshControl, TextInput, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { fetchContacts } from '@/lib/api'
import type { Contact } from '@/lib/types'

const CATEGORY_LABELS: Record<string, string> = {
  supplier: 'Suppliers',
  electrician: 'Electricians',
  other: 'Other',
}

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    try {
      const data = await fetchContacts()
      setContacts(data)
    } catch {}
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { load() }, [])

  const filtered = contacts.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.company ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? '').includes(search)
  )

  const sections = Object.entries(CATEGORY_LABELS)
    .map(([key, title]) => ({
      title,
      data: filtered.filter(c => c.category === key),
    }))
    .filter(s => s.data.length > 0)

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#ffd100" /></View>
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Contacts</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search contacts…"
          placeholderTextColor="#6b7280"
        />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true) }} tintColor="#ffd100" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No contacts yet. Admin can add them from the dashboard.</Text>
          </View>
        }
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name[0].toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.name}>{item.name}</Text>
                {item.company ? <Text style={styles.company}>{item.company}</Text> : null}
                {item.notes ? <Text style={styles.notes} numberOfLines={1}>{item.notes}</Text> : null}
              </View>
            </View>
            <View style={styles.actions}>
              {item.phone ? (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => Linking.openURL(`tel:${item.phone}`)}
                >
                  <Ionicons name="call" size={18} color="#ffd100" />
                </TouchableOpacity>
              ) : null}
              {item.email ? (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => Linking.openURL(`mailto:${item.email}`)}
                >
                  <Ionicons name="mail" size={18} color="#ffd100" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1f2937', borderRadius: 12,
    marginHorizontal: 16, marginVertical: 12,
    paddingHorizontal: 12, borderWidth: 1, borderColor: '#374151',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#fff', paddingVertical: 10 },
  sectionHeader: {
    fontSize: 11, fontWeight: '700', color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingVertical: 8, paddingTop: 16,
  },
  card: {
    backgroundColor: '#1f2937', borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: '#374151',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#ffd100' },
  name: { fontSize: 15, fontWeight: '700', color: '#fff' },
  company: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  notes: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center',
  },
  separator: { height: 8 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#6b7280', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
})
