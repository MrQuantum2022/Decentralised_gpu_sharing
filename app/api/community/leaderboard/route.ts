import { NextResponse } from 'next/server'

const FASTAPI = process.env.FASTAPI_URL || 'http://localhost:8000'

export async function GET() {
  try {
    const res = await fetch(`${FASTAPI}/api/community/leaderboard`, {
      next: { revalidate: 60 }
    })
    if (!res.ok) throw new Error('FastAPI error')
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json([])
  }
}