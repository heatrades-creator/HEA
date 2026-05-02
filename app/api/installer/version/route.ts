import { NextResponse } from 'next/server'

// The current JS bundle version — bump this whenever a meaningful update ships.
// The installer app compares against this and prompts a re-download if behind.
const CURRENT_VERSION = '2.2'

export async function GET() {
  return NextResponse.json({ version: CURRENT_VERSION })
}
