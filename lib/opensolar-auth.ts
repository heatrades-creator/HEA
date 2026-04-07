// lib/opensolar-auth.ts
//
// Handles OpenSolar Bearer token authentication.
// OpenSolar has no static API key — tokens are obtained by logging in
// with email + password via their token-auth endpoint.
//
// Tokens are cached in SystemConfig for 6 days (they expire ~7 days).
// On expiry, the next request automatically re-authenticates.
//
// Required env vars:
//   OPENSOLAR_EMAIL    — OpenSolar account login email
//   OPENSOLAR_PASSWORD — OpenSolar account password
//
// Optional (if MFA is enabled on the account):
//   OPENSOLAR_MFA_TOKEN — current 2FA code (only works for manual calls)

import { prisma } from "./db"

const BASE = process.env.OPENSOLAR_BASE_URL ?? "https://api.opensolar.com"

// 6 days in milliseconds — tokens last ~7 days, refresh with 1 day buffer
const TOKEN_TTL_MS = 6 * 24 * 60 * 60 * 1000

export async function getOpenSolarToken(): Promise<string> {
  // 1. Check cached token in SystemConfig
  const [tokenRow, expiryRow] = await Promise.all([
    prisma.systemConfig.findUnique({ where: { key: "opensolar_token" } }),
    prisma.systemConfig.findUnique({ where: { key: "opensolar_token_expiry" } }),
  ])

  const now = Date.now()
  const expiresAt = expiryRow ? parseInt(expiryRow.value, 10) : 0

  if (tokenRow?.value && expiresAt > now) {
    return tokenRow.value
  }

  // 2. Re-authenticate
  const email    = process.env.OPENSOLAR_EMAIL
  const password = process.env.OPENSOLAR_PASSWORD

  if (!email || !password) {
    throw new Error(
      "OpenSolar auth blocked: OPENSOLAR_EMAIL and OPENSOLAR_PASSWORD must be set in environment variables."
    )
  }

  const body: Record<string, string> = { username: email, password }

  // Include MFA token if provided (only useful when rotating manually)
  if (process.env.OPENSOLAR_MFA_TOKEN) {
    body.token = process.env.OPENSOLAR_MFA_TOKEN
  }

  const res = await fetch(`${BASE}/api-token-auth/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new Error(`OpenSolar authentication failed (${res.status}): ${detail}`)
  }

  const data = await res.json()
  const token: string = data.token

  if (!token) {
    throw new Error("OpenSolar auth response did not include a token.")
  }

  // 3. Cache token + expiry in SystemConfig
  const expiry = String(now + TOKEN_TTL_MS)

  await Promise.all([
    prisma.systemConfig.upsert({
      where:  { key: "opensolar_token" },
      update: { value: token },
      create: { key: "opensolar_token", value: token },
    }),
    prisma.systemConfig.upsert({
      where:  { key: "opensolar_token_expiry" },
      update: { value: expiry },
      create: { key: "opensolar_token_expiry", value: expiry },
    }),
  ])

  return token
}

/** Build the Authorization header object for OpenSolar API requests */
export async function openSolarHeaders(): Promise<Record<string, string>> {
  const token = await getOpenSolarToken()
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}
