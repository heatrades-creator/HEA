import * as SecureStore from 'expo-secure-store'
import type { InstallerProfile } from './types'

const TOKEN_KEY = 'hea_installer_token'
const PROFILE_KEY = 'hea_installer_profile'

// Use React Native's global object — guaranteed shared across all module
// instances in the same JS runtime, unlike module-level let variables which
// can be isolated per bundle chunk in Expo Router's code-split model.
declare global {
  var __heaToken: string | null | undefined
  var __heaProfile: InstallerProfile | null | undefined
}

export async function saveAuth(token: string, installer: InstallerProfile, remember = true): Promise<void> {
  global.__heaToken = token
  global.__heaProfile = installer
  if (remember) {
    // Best-effort persistence — SecureStore keystore can fail on some devices
    await SecureStore.setItemAsync(TOKEN_KEY, token).catch(() => {})
    await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(installer)).catch(() => {})
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {})
    await SecureStore.deleteItemAsync(PROFILE_KEY).catch(() => {})
  }
}

export async function getToken(): Promise<string | null> {
  if (global.__heaToken) return global.__heaToken
  const stored = await SecureStore.getItemAsync(TOKEN_KEY).catch(() => null)
  if (stored) global.__heaToken = stored
  return stored
}

export async function getInstallerProfile(): Promise<InstallerProfile | null> {
  if (global.__heaProfile) return global.__heaProfile
  const raw = await SecureStore.getItemAsync(PROFILE_KEY).catch(() => null)
  if (!raw) return null
  try {
    const profile = JSON.parse(raw) as InstallerProfile
    global.__heaProfile = profile
    return profile
  } catch {
    return null
  }
}

export function getTokenSync(): string | null {
  return global.__heaToken ?? null
}

export async function clearAuth(): Promise<void> {
  global.__heaToken = null
  global.__heaProfile = null
  await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {})
  await SecureStore.deleteItemAsync(PROFILE_KEY).catch(() => {})
}
