import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, TextInput, ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import * as Haptics from 'expo-haptics'
import { uploadGeneralReceipt } from '@/lib/api'

interface UploadRecord {
  fileName: string
  fileUrl: string
  description: string
  uploadedAt: string
}

export default function ReceiptsScreen() {
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [recent, setRecent] = useState<UploadRecord[]>([])

  async function pickAndUpload(source: 'camera' | 'library') {
    let result: ImagePicker.ImagePickerResult

    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') { Alert.alert('Permission needed', 'Camera access is required.'); return }
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, base64: true })
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') { Alert.alert('Permission needed', 'Photo library access is required.'); return }
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true })
    }

    if (result.canceled || !result.assets[0]) return
    const asset = result.assets[0]
    if (!asset.base64) { Alert.alert('Error', 'Could not read image data.'); return }

    setUploading(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    try {
      const ext = (asset.mimeType ?? 'image/jpeg').split('/')[1] ?? 'jpg'
      const filename = `receipt-${Date.now()}.${ext}`
      const data = await uploadGeneralReceipt(filename, asset.base64, asset.mimeType ?? 'image/jpeg', description.trim())
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setRecent(prev => [{
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        description: description.trim() || 'General receipt',
        uploadedAt: new Date().toISOString(),
      }, ...prev])
      setDescription('')
      Alert.alert('Uploaded', 'Receipt saved to the Staff Receipts folder in Drive.')
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Try again.')
    }
    setUploading(false)
  }

  function handleUpload() {
    Alert.alert('Upload Receipt', 'Choose source', [
      { text: 'Camera', onPress: () => pickAndUpload('camera') },
      { text: 'Photo Library', onPress: () => pickAndUpload('library') },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Receipts</Text>
        <Text style={styles.subtitle}>Upload staff receipts — fuel, supplies, materials</Text>
      </View>

      {/* Upload card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>New Receipt</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="Description (e.g. Fuel — Jesse's ute)"
          placeholderTextColor="#6b7280"
        />
        <TouchableOpacity
          style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
          onPress={handleUpload}
          disabled={uploading}
          activeOpacity={0.7}
        >
          {uploading
            ? <ActivityIndicator size="small" color="#111827" />
            : <Ionicons name="camera-outline" size={20} color="#111827" />}
          <Text style={styles.uploadBtnText}>{uploading ? 'Uploading to Drive…' : 'Upload Receipt Photo'}</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>Saved to → Staff Receipts / {new Date().toISOString().slice(0, 7)} in Google Drive</Text>
      </View>

      {/* Recent uploads this session */}
      {recent.length > 0 ? (
        <View style={styles.recentSection}>
          <Text style={styles.recentLabel}>Uploaded this session</Text>
          {recent.map((r, i) => (
            <View key={i} style={styles.recentCard}>
              <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
              <View style={{ flex: 1 }}>
                <Text style={styles.recentDesc}>{r.description}</Text>
                <Text style={styles.recentFile}>{r.fileName}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  card: {
    backgroundColor: '#1f2937', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#374151', marginBottom: 20,
  },
  cardLabel: {
    fontSize: 11, fontWeight: '700', color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
  },
  input: {
    backgroundColor: '#111827', borderRadius: 12, borderWidth: 1,
    borderColor: '#374151', paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: '#fff', marginBottom: 12,
  },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ffd100', borderRadius: 14, paddingVertical: 14, gap: 8,
  },
  uploadBtnDisabled: { opacity: 0.5 },
  uploadBtnText: { fontSize: 15, fontWeight: '700', color: '#111827' },
  hint: { fontSize: 11, color: '#6b7280', marginTop: 10, textAlign: 'center' },
  recentSection: { marginTop: 4 },
  recentLabel: {
    fontSize: 11, fontWeight: '700', color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },
  recentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#1f2937', borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: '#374151', marginBottom: 8,
  },
  recentDesc: { fontSize: 13, color: '#fff', fontWeight: '600' },
  recentFile: { fontSize: 11, color: '#6b7280', marginTop: 2 },
})
