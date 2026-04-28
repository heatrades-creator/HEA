import * as SecureStore from 'expo-secure-store'
import type { InstallerProfile } from './types'

const TOKEN_KEY = 'hea_installer_token'
const PROFILE_KEY = 'hea_installer_profile'

export async function saveAuth(token: string, installer: InstallerProfile): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token)
  await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(installer))
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function getInstallerProfile(): Promise<InstallerProfile | null> {
  const raw = await SecureStore.getItemAsync(PROFILE_KEY)
  return raw ? JSON.parse(raw) : null
}

export async function clearAuth(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
  await SecureStore.deleteItemAsync(PROFILE_KEY)
}
