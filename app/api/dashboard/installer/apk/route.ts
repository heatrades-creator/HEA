import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const blobConfigured = !!process.env.BLOB_READ_WRITE_TOKEN

  const [urlCfg, versionCfg, uploadedAtCfg, historyCfg] = await Promise.all([
    prisma.systemConfig.findUnique({ where: { key: 'installer_apk_url' } }),
    prisma.systemConfig.findUnique({ where: { key: 'installer_apk_version' } }),
    prisma.systemConfig.findUnique({ where: { key: 'installer_apk_uploaded_at' } }),
    prisma.systemConfig.findUnique({ where: { key: 'installer_apk_history' } }),
  ])

  return NextResponse.json({
    blobConfigured,
    url: urlCfg?.value ?? null,
    version: versionCfg?.value ?? null,
    uploadedAt: uploadedAtCfg?.value ?? null,
    history: historyCfg ? JSON.parse(historyCfg.value) : [],
  })
}

// POST — Vercel Blob client-side upload token handshake
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const body = (await req.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        if (!session) throw new Error('Not authenticated')
        // No content type restriction — Windows reports .apk as various MIME types
        return { maximumSizeInBytes: 150 * 1024 * 1024 }
      },
      // No-op: DB save is handled by the client calling PUT after upload completes
      onUploadCompleted: async () => {},
    })
    return NextResponse.json(jsonResponse)
  } catch (error) {
    const msg = (error as Error).message
    console.error('APK upload token error:', msg)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

// PUT — called by the client after upload succeeds to save URL + version to DB
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url, version } = await req.json() as { url: string; version: string }
  if (!url || !version) return NextResponse.json({ error: 'url and version required' }, { status: 400 })

  const newEntry = { version, url, uploadedAt: new Date().toISOString() }
  const historyCfg = await prisma.systemConfig.findUnique({ where: { key: 'installer_apk_history' } })
  const history: typeof newEntry[] = historyCfg ? JSON.parse(historyCfg.value) : []
  history.unshift(newEntry)

  await Promise.all([
    prisma.systemConfig.upsert({
      where: { key: 'installer_apk_url' },
      update: { value: url },
      create: { key: 'installer_apk_url', value: url },
    }),
    prisma.systemConfig.upsert({
      where: { key: 'installer_apk_version' },
      update: { value: version },
      create: { key: 'installer_apk_version', value: version },
    }),
    prisma.systemConfig.upsert({
      where: { key: 'installer_apk_uploaded_at' },
      update: { value: new Date().toISOString() },
      create: { key: 'installer_apk_uploaded_at', value: new Date().toISOString() },
    }),
    prisma.systemConfig.upsert({
      where: { key: 'installer_apk_history' },
      update: { value: JSON.stringify(history.slice(0, 10)) },
      create: { key: 'installer_apk_history', value: JSON.stringify(history.slice(0, 10)) },
    }),
  ])

  return NextResponse.json({ ok: true })
}
