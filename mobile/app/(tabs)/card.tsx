import { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { getInstallerProfile } from '@/lib/auth'
import { BusinessCard3D } from '@/components/BusinessCard3D'
import type { InstallerProfile } from '@/lib/types'

export default function CardScreen() {
  const [installer, setInstaller] = useState<InstallerProfile | null>(null)

  useEffect(() => {
    getInstallerProfile().then(setInstaller)
  }, [])

  if (!installer) {
    return <View style={styles.root} />
  }

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>Business Card</Text>
      <Text style={styles.hint}>Drag or tap to flip</Text>
      <View style={styles.cardArea}>
        <BusinessCard3D installer={installer} />
      </View>
      <Text style={styles.sub}>Show the front to introduce yourself.{'\n'}Flip to the QR code for a free quote.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
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
    marginBottom: 40,
  },
  cardArea: {
    marginBottom: 40,
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
  },
})
