import { StyleSheet, View, Text, Image } from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  interpolate, Easing, cancelAnimation,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import QRCode from 'react-native-qrcode-svg'
import { useEffect } from 'react'
import type { InstallerProfile } from '@/lib/types'
import type { CardSettings } from '@/lib/card-settings'

const CARD_W = 340
const CARD_H = 215

const logo = require('@/assets/logo.png')

export interface BusinessCardProps {
  installer: InstallerProfile
  settings: CardSettings
  resolvedTitle: string
  intakeUrl?: string
}

// Diagonal gold sweep that plays every 6 seconds
function GoldSweep() {
  const x = useSharedValue(-80)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    function schedule() {
      cancelAnimation(x)
      x.value = -80
      x.value = withTiming(CARD_W + 100, {
        duration: 1800,
        easing: Easing.inOut(Easing.ease),
      })
      timer = setTimeout(schedule, 6000)
    }
    timer = setTimeout(schedule, 1500)
    return () => clearTimeout(timer)
  }, [])

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: '20deg' }, { translateX: x.value }],
    opacity: interpolate(x.value, [-80, 20, CARD_W - 20, CARD_W + 100], [0, 0.8, 0.8, 0]),
  }))

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.sweepBar, style]} />
    </View>
  )
}

function CardFront({ installer, settings, resolvedTitle }: Omit<BusinessCardProps, 'intakeUrl'>) {
  const displayName = settings.name || installer.name
  return (
    <View style={styles.front}>
      {/* HEA logo */}
      <Image source={logo} style={styles.logo} resizeMode="contain" />

      {/* Tagline */}
      <Text style={styles.tagline} numberOfLines={1}>{settings.tagline}</Text>

      {/* Name / Title / Contact */}
      <View style={styles.nameBlock}>
        <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
        <Text style={styles.roleLine} numberOfLines={1}>{resolvedTitle}</Text>
        {(!!settings.phone || !!settings.email) && (
          <View style={styles.contactRow}>
            {!!settings.phone && <Text style={styles.contact}>{settings.phone}</Text>}
            {!!settings.email && (
              <Text style={styles.contact} numberOfLines={1}>{settings.email}</Text>
            )}
          </View>
        )}
      </View>

      <GoldSweep />
    </View>
  )
}

function CardBack({ installer, settings, resolvedTitle, intakeUrl }: BusinessCardProps) {
  const displayName = settings.name || installer.name
  return (
    <View style={styles.back}>
      {/* QR code + name centered */}
      <View style={styles.backCenter}>
        <QRCode
          value={intakeUrl!}
          size={88}
          backgroundColor="#111111"
          color="#ffd100"
        />
        <View style={styles.backNameBlock}>
          <Text style={styles.backRole} numberOfLines={1}>{resolvedTitle}</Text>
          <Text style={styles.backName} numberOfLines={1}>{displayName}</Text>
        </View>
      </View>

      {/* Bottom: contact left, ABN/REC right */}
      <View style={styles.backBottom}>
        <View>
          {!!settings.phone && <Text style={styles.backDetail}>{settings.phone}</Text>}
          {!!settings.email && (
            <Text style={styles.backDetail} numberOfLines={1}>{settings.email}</Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          {!!settings.abn && <Text style={styles.backDetail}>ABN: {settings.abn}</Text>}
          {!!settings.rec && <Text style={styles.backDetail}>REC: {settings.rec}</Text>}
        </View>
      </View>

      <GoldSweep />
    </View>
  )
}

export function BusinessCard3D({
  installer,
  settings,
  resolvedTitle,
  intakeUrl = 'https://www.hea-group.com.au',
}: BusinessCardProps) {
  const rotateY = useSharedValue(0)

  function clamp(val: number, min: number, max: number) {
    'worklet'
    return Math.min(Math.max(val, min), max)
  }

  function snapToNearest() {
    'worklet'
    rotateY.value = withSpring(rotateY.value > 90 ? 180 : 0, {
      stiffness: 200, damping: 20,
    })
  }

  // activeOffsetX: only activate after 8px horizontal drag (prevents accidental triggers)
  // failOffsetY: fail if user moves >20px vertically before activating (lets vertical scrolls through)
  // onFinalize: fires whether gesture ends OR is cancelled — card always snaps to a valid face
  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .failOffsetY([-20, 20])
    .onUpdate((e) => {
      rotateY.value = clamp(rotateY.value + e.changeX * 0.6, 0, 180)
    })
    .onFinalize(() => {
      snapToNearest()
    })

  const tap = Gesture.Tap().onEnd(() => {
    rotateY.value = withSpring(rotateY.value > 90 ? 0 : 180, {
      stiffness: 200, damping: 20,
    })
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
          <CardFront installer={installer} settings={settings} resolvedTitle={resolvedTitle} />
        </Animated.View>
        <Animated.View style={[styles.card, backStyle]}>
          <CardBack
            installer={installer}
            settings={settings}
            resolvedTitle={resolvedTitle}
            intakeUrl={intakeUrl}
          />
        </Animated.View>
      </View>
    </GestureDetector>
  )
}

const GOLD_ON_WHITE = '#b8920a'
const GOLD = '#ffd100'

const styles = StyleSheet.create({
  container: { width: CARD_W, height: CARD_H },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 14,
  },

  // ── Sweep ───────────────────────────────────────────────────────────────────
  sweepBar: {
    position: 'absolute',
    top: -200,
    left: -40,
    width: 48,
    height: 600,
    backgroundColor: 'rgba(255, 209, 0, 0.14)',
  },

  // ── Front ───────────────────────────────────────────────────────────────────
  front: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    justifyContent: 'space-between',
  },
  logo: {
    height: 48,
    width: 160,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '700',
    fontStyle: 'italic',
    color: GOLD_ON_WHITE,
    letterSpacing: 0.4,
  },
  nameBlock: { gap: 2 },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: GOLD_ON_WHITE,
    letterSpacing: 0.1,
  },
  roleLine: {
    fontSize: 11,
    fontWeight: '500',
    color: GOLD_ON_WHITE,
    opacity: 0.8,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 3,
  },
  contact: {
    fontSize: 10,
    color: GOLD_ON_WHITE,
    opacity: 0.75,
    fontWeight: '500',
  },

  // ── Back ────────────────────────────────────────────────────────────────────
  back: {
    flex: 1,
    backgroundColor: '#111111',
    padding: 18,
    justifyContent: 'space-between',
  },
  backCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backNameBlock: {
    alignItems: 'center',
    gap: 1,
  },
  backRole: {
    fontSize: 10,
    fontWeight: '600',
    fontStyle: 'italic',
    color: GOLD,
    opacity: 0.8,
  },
  backName: {
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    color: GOLD,
  },
  backBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  backDetail: {
    fontSize: 9,
    color: GOLD,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 14,
    opacity: 0.8,
  },
})
