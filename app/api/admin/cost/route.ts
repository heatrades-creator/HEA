// app/api/admin/cost/route.ts
// GET — returns cost info for create_project. Used by client-side lead queue.
// Auth-protected. Returns cost amount or blocked reason.

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, isAdminEmail } from "@/lib/auth"
import { getCost } from "@/lib/cost"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cost = getCost("create_project")
  return NextResponse.json(cost)
}
