import AsyncStorage from '@react-native-async-storage/async-storage'

const SETTINGS_KEY = 'hea_card_settings'

export interface CardSettings {
  tagline: string
  title: string
  phone: string
  email: string
  abn: string
  rec: string
}

export const CARD_DEFAULTS: CardSettings = {
  tagline: 'Electrical • Automation • Solar & Battery',
  title: '',
  phone: '',
  email: '',
  abn: '33 927 343 793',
  rec: '37307',
}

export async function getCardSettings(): Promise<CardSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...CARD_DEFAULTS }
    return { ...CARD_DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...CARD_DEFAULTS }
  }
}

export async function saveCardSettings(settings: CardSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {}
}

