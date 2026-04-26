import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Temporary diagnostic endpoint — session-protected, safe to leave in place
// Hit GET /api/debug/gas while logged in to see what JOBS_GAS_URL returns
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = process.env.JOBS_GAS_URL

  if (!url) {
    return NextResponse.json({ status: "JOBS_GAS_URL not set in Vercel env vars" })
  }

  const masked = url.length > 40
    ? url.substring(0, 30) + "..." + url.slice(-15)
    : url

  try {
    const res = await fetch(url, { cache: "no-store" })
    const text = await res.text()

    let parsed: unknown = null
    let parseError: string | null = null
    try { parsed = JSON.parse(text) } catch (e) { parseError = String(e) }

    return NextResponse.json({
      url: masked,
      httpStatus: res.status,
      isJson: parseError === null,
      parseError,
      responsePreview: text.substring(0, 500),
      jobCount: Array.isArray(parsed) ? (parsed as unknown[]).length : null,
    })
  } catch (e) {
    return NextResponse.json({ url: masked, fetchError: String(e) })
  }
}
