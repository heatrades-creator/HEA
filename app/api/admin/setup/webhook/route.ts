// app/api/admin/setup/webhook/route.ts
// POST — register the OpenSolar webhook endpoint. Run once during setup.
// FREE — webhook registration does not cost anything.

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, isAdminEmail } from "@/lib/auth"
import { registerWebhook } from "@/lib/opensolar-free"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let endpoint: string
  try {
    const body = await req.json()
    endpoint = body.endpoint
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!endpoint || !endpoint.startsWith("https://")) {
    return NextResponse.json(
      { error: "endpoint must be a full https:// URL" },
      { status: 400 }
    )
  }

  try {
    const result = await registerWebhook(endpoint)
    return NextResponse.json({ success: true, result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
