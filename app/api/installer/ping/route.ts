import { NextRequest, NextResponse } from 'next/server'
import { getInstallerFromRequest } from '@/lib/installer-auth'

// Unauthenticated ping — returns whether the token is valid and why if not.
// Used to diagnose 401 issues without requiring a working token.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization') ?? ''
  const hasHeader = authHeader.startsWith('Bearer ')
  const token = hasHeader ? authHeader.slice(7) : null

  const installer = getInstallerFromRequest(req)

  return NextResponse.json({
    ok: !!installer,
    hasAuthHeader: hasHeader,
    tokenLength: token ? token.length : 0,
    tokenPrefix: token ? token.slice(0, 20) + '…' : null,
    installerName: installer?.name ?? null,
    error: !installer
      ? !hasHeader
        ? 'No Authorization header'
        : 'Token present but JWT verification failed (wrong secret or malformed)'
      : null,
  })
}
