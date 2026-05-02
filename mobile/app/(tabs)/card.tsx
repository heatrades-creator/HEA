import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, Modal, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { getInstallerProfile } from '@/lib/auth'
import { BusinessCard3D } from '@/components/BusinessCard3D'
import {
  getCardSettings, saveCardSettings, CARD_DEFAULTS,
} from '@/lib/card-settings'
import type { InstallerProfile } from '@/lib/types'
import type { CardSettings } from '@/lib/card-settings'

function Field({
  label,
  value,
  placeholder,
  onChangeText,
  keyboardType,
  autoCapitalize,
}: {
  label: string
  value: string
  placeholder?: string
  onChangeText: (v: string) => void
  keyboardType?: 'default' | 'phone-pad' | 'email-address'
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
}) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={s.fieldInput}
        value={value}
        placeholder={placeholder ?? label}
        placeholderTextColor="#4b5563"
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        autoCorrect={false}
      />
    </View>
  )
}

export default function CardScreen() {
  const [installer, setInstaller] = useState<InstallerProfile | null>(null)
  const [settings, setSettings] = useState<CardSettings>(CARD_DEFAULTS)
  const [showModal, setShowModal] = useState(false)
  const [draft, setDraft] = useState<CardSettings>(CARD_DEFAULTS)
  const [cardKey, setCardKey] = useState(0)

  // Reset the card to front face whenever this tab comes into focus
  useFocusEffect(useCallback(() => {
    setCardKey(k => k + 1)
  }, []))

  useEffect(() => {
    Promise.all([getInstallerProfile(), getCardSettings()]).then(([profile, saved]) => {
      setInstaller(profile)
      setSettings(saved)
    })
  }, [])

  const openCustomise = () => {
    const d = { ...settings }
    // Clear title if it was accidentally set to the installer's name
    if (d.title === installer!.name) d.title = ''
    setDraft(d)
    setShowModal(true)
  }

  const handleSave = async () => {
    await saveCardSettings(draft)
    setSettings({ ...draft })
    setShowModal(false)
  }

  if (!installer) return <View style={s.root} />

  const resolvedTitle =
    settings.title || (installer.role === 'lead' ? 'Lead Installer' : 'Solar Installer')

  return (
    <View style={s.root}>
      <Text style={s.heading}>Business Card</Text>
      <Text style={s.hint}>Drag or tap to flip</Text>

      <View style={s.cardArea}>
        <BusinessCard3D
          key={cardKey}
          installer={installer}
          settings={settings}
          resolvedTitle={resolvedTitle}
        />
      </View>

      <Text style={s.sub}>
        Show the front to introduce yourself.{'\n'}Flip to the QR code for a free quote.
      </Text>

      <TouchableOpacity style={s.customiseBtn} onPress={openCustomise} activeOpacity={0.75}>
        <Text style={s.customiseBtnText}>Customise card</Text>
      </TouchableOpacity>

      {/* ── Customise modal ─────────────────────────────────────────────── */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={s.modal}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Customise Card</Text>
            <Pressable onPress={() => setShowModal(false)} hitSlop={16}>
              <Text style={s.modalClose}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={s.modalBody}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={s.sectionLabel}>YOUR DETAILS</Text>
            <Field
              label="Job title"
              value={draft.title}
              placeholder="e.g. CEO, Lead Installer, Solar Installer"
              onChangeText={v => setDraft(d => ({ ...d, title: v }))}
            />
            <Field
              label="Tagline"
              value={draft.tagline}
              onChangeText={v => setDraft(d => ({ ...d, tagline: v }))}
            />
            <Field
              label="Phone"
              value={draft.phone}
              placeholder="e.g. 0400 000 000"
              onChangeText={v => setDraft(d => ({ ...d, phone: v }))}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
            <Field
              label="Email"
              value={draft.email}
              placeholder="e.g. you@hea-group.com.au"
              onChangeText={v => setDraft(d => ({ ...d, email: v }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={[s.sectionLabel, { marginTop: 20 }]}>COMPANY DETAILS</Text>
            <Field
              label="ABN"
              value={draft.abn}
              onChangeText={v => setDraft(d => ({ ...d, abn: v }))}
            />
            <Field
              label="REC number"
              value={draft.rec}
              onChangeText={v => setDraft(d => ({ ...d, rec: v }))}
            />
          </ScrollView>

          <View style={s.modalFooter}>
            <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Text style={s.saveBtnText}>Save changes</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 36,
  },
  cardArea: {
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
  },
  sub: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  customiseBtn: {
    borderWidth: 1,
    borderColor: '#ffd100',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  customiseBtnText: {
    color: '#ffd100',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // ── Modal ──────────────────────────────────────────────────────────────────
  modal: {
    flex: 1,
    backgroundColor: '#111827',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalClose: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  modalBody: {
    padding: 20,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4b5563',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  field: { gap: 6 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9ca3af',
  },
  fieldInput: {
    backgroundColor: '#1f2937',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#ffffff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#374151',
  },
  modalFooter: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  saveBtn: {
    backgroundColor: '#ffd100',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
})
