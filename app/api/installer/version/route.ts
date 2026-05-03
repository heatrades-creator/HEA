import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const urlCfg = await prisma.systemConfig.findUnique({ where: { key: 'installer_apk_url' } })
  const apkUrl = urlCfg?.value ?? null

  let buildId: string | null = null
  if (apkUrl) {
    const stem = (apkUrl.split('/').pop() ?? '').replace(/\.apk$/i, '')
    buildId = stem.length >= 5 ? stem.slice(-5) : stem || null
  }

  return NextResponse.json({ buildId })
}
