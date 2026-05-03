import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { DocumentConfig } from '@/lib/document-config'

const CONFIG_KEY = 'document_annex_config'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const row = await prisma.systemConfig.findUnique({ where: { key: CONFIG_KEY } })
  const config: DocumentConfig = row ? (JSON.parse(row.value) as DocumentConfig) : {}
  return NextResponse.json(config)
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as DocumentConfig
  await prisma.systemConfig.upsert({
    where:  { key: CONFIG_KEY },
    update: { value: JSON.stringify(body) },
    create: { id: crypto.randomUUID(), key: CONFIG_KEY, value: JSON.stringify(body) },
  })
  return NextResponse.json({ ok: true })
}
