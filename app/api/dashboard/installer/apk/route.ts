import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [urlCfg, versionCfg, uploadedAtCfg] = await Promise.all([
    prisma.systemConfig.findUnique({ where: { key: 'installer_apk_url' } }),
    prisma.systemConfig.findUnique({ where: { key: 'installer_apk_version' } }),
    prisma.systemConfig.findUnique({ where: { key: 'installer_apk_uploaded_at' } }),
  ])

  return NextResponse.json({
    url: urlCfg?.value ?? null,
    version: versionCfg?.value ?? null,
    uploadedAt: uploadedAtCfg?.value ?? null,
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const body = (await req.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        if (!session) throw new Error('Not authenticated')
        return {
          allowedContentTypes: [
            'application/vnd.android.package-archive',
            'application/octet-stream',
          ],
          maximumSizeInBytes: 100 * 1024 * 1024, // 100 MB
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const version = tokenPayload ?? '1.0.0'
        await Promise.all([
          prisma.systemConfig.upsert({
            where: { key: 'installer_apk_url' },
            update: { value: blob.url },
            create: { key: 'installer_apk_url', value: blob.url },
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
        ])
      },
    })
    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
