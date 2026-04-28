import * as SecureStore from 'expo-secure-store'
import type { InstallerProfile } from './types'

const TOKEN_KEY = 'hea_installer_token'
const PROFILE_KEY = 'hea_installer_profile'

// In-memory fallback for non-remembered sessions (cleared when app process dies)
let _memToken: string | null = null
let _memProfile: InstallerProfile | null = null

export async function saveAuth(token: string, installer: InstallerProfile, remember = true): Promise<void> {
  _memToken = token
  _memProfile = installer
  if (remember) {
    await SecureStore.setItemAsync(TOKEN_KEY, token)
    await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(installer))
  } else {
    // Clear any previously persisted credentials so next launch prompts login
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {})
    await SecureStore.deleteItemAsync(PROFILE_KEY).catch(() => {})
  }
}

export async function getToken(): Promise<string | null> {
  if (_memToken) return _memToken
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function getInstallerProfile(): Promise<InstallerProfile | null> {
  if (_memProfile) return _memProfile
  const raw = await SecureStore.getItemAsync(PROFILE_KEY)
  return raw ? JSON.parse(raw) : null
}

export async function clearAuth(): Promise<void> {
  _memToken = null
  _memProfile = null
  await SecureStore.deleteItemAsync(TOKEN_KEY)
  await SecureStore.deleteItemAsync(PROFILE_KEY)
}
