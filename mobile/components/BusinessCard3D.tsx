import { StyleSheet, View, Text } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate } from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import QRCode from 'react-native-qrcode-svg'
import type { InstallerProfile } from '@/lib/types'

const CARD_W = 340
const CARD_H = 210

interface Props {
  installer: InstallerProfile
  intakeUrl?: string
}

function CardFront({ name, role }: { name: string; role: string }) {
  return (
    <View style={styles.front}>
      {/* Gold top strip */}
      <View style={styles.goldStrip} />

      <View style={styles.frontContent}>
        {/* Logo mark */}
        <View style={styles.logoMark}>
          <Text style={styles.logoMarkText}>HEA</Text>
        </View>

        <View style={styles.frontRight}>
          <Text style={styles.cardName}>{name}</Text>
          <Text style={styles.cardRole}>{role === 'lead' ? 'Lead Installer' : 'Solar Installer'}</Text>
          <View style={styles.divider} />
          <Text style={styles.cardTagline}>Solar Specialists</Text>
          <Text style={styles.cardLocation}>Bendigo &amp; Surrounds</Text>
        </View>
      </View>

      {/* Bottom gold bar */}
      <View style={styles.goldBottom} />
    </View>
  )
}

function CardBack({ intakeUrl }: { intakeUrl: string }) {
  return (
    <View style={styles.back}>
      <QRCode
        value={intakeUrl}
        size={120}
        backgroundColor="#ffffff"
        color="#111827"
      />
      <Text style={styles.backLabel}>Get a free solar quote</Text>
      <Text style={styles.backUrl}>hea-group.com.au</Text>
    </View>
  )
}

export function BusinessCard3D({ installer, intakeUrl = 'https://hea-group.com.au/intake' }: Props) {
  const rotateY = useSharedValue(0)

  function clamp(val: number, min: number, max: number) {
    'worklet'
    return Math.min(Math.max(val, min), max)
  }

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      rotateY.value = clamp(rotateY.value + e.changeX * 0.6, 0, 180)
    })
    .onEnd(() => {
      rotateY.value = withSpring(rotateY.value > 90 ? 180 : 0, { stiffness: 200, damping: 20 })
    })

  const tap = Gesture.Tap().onEnd(() => {
    rotateY.value = withSpring(rotateY.value > 90 ? 0 : 180, { stiffness: 200, damping: 20 })
  })

  const composed = Gesture.Race(pan, tap)

  const frontStyle = useAnimatedStyle(() => {
    const opacity = interpolate(rotateY.value, [0, 89, 90, 180], [1, 1, 0, 0])
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY.value}deg` }],
      opacity,
      backfaceVisibility: 'hidden' as const,
    }
  })

  const backStyle = useAnimatedStyle(() => {
    const opacity = interpolate(rotateY.value, [0, 89, 90, 180], [0, 0, 1, 1])
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY.value - 180}deg` }],
      opacity,
      backfaceVisibility: 'hidden' as const,
      position: 'absolute' as const,
      top: 0,
      left: 0,
    }
  })

  return (
    <GestureDetector gesture={composed}>
      <View style={styles.container}>
        <Animated.View style={[styles.card, frontStyle]}>
          <CardFront name={installer.name} role={installer.role} />
        </Animated.View>
        <Animated.View style={[styles.card, backStyle]}>
          <CardBack intakeUrl={intakeUrl} />
        </Animated.View>
      </View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  container: { width: CARD_W, height: CARD_H },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 14,
  },
  // ── Front ──────────────────────────────────────────────────────────────
  front: { flex: 1, backgroundColor: '#111827' },
  goldStrip: { height: 6, backgroundColor: '#ffd100' },
  frontContent: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  logoMark: {
    width: 56, height: 56, borderRadius: 12,
    backgroundColor: '#ffd100',
    alignItems: 'center', justifyContent: 'center',
  },
  logoMarkText: { fontSize: 16, fontWeight: '900', color: '#111827' },
  frontRight: { flex: 1 },
  cardName: { fontSize: 18, fontWeight: '800', color: '#fff' },
  cardRole: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  divider: { width: 32, height: 2, backgroundColor: '#ffd100', marginVertical: 8 },
  cardTagline: { fontSize: 11, color: '#d1d5db', fontWeight: '600' },
  cardLocation: { fontSize: 11, color: '#6b7280', marginTop: 1 },
  goldBottom: { height: 4, backgroundColor: '#ffd10040' },
  // ── Back ───────────────────────────────────────────────────────────────
  back: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  backLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },
  backUrl: { fontSize: 11, color: '#6b7280' },
})
