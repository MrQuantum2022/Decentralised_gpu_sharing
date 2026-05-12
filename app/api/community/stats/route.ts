import { NextResponse } from 'next/server'

const FASTAPI = process.env.FASTAPI_URL || 'http://localhost:8000'

export async function GET() {
  try {
    const res = await fetch(`${FASTAPI}/api/community/stats`, {
      next: { revalidate: 30 } // cache 30s
    })
    if (!res.ok) throw new Error('FastAPI error')
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({
      total_members: 0,
      total_tasks: 0,
      total_contributions: 0,
      total_usdc: 0,
    })
  }
}