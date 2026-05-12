import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get fresh session token to pass to FastAPI
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ message: 'No session' }, { status: 401 })
    }

    const body = await req.json()
    const {
      name, description, model_type, framework, gpu_min,
      batch_urls, encrypted_file_key,
      entry_point, requirements_file,
      total_batches, price_per_batch, max_workers,
      provider_wallet,
    } = body

    // Validation
    if (!name || !model_type || !framework || !batch_urls?.length || !provider_wallet) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    if (batch_urls.length > 50) {
      return NextResponse.json({ message: 'Maximum 50 batches allowed' }, { status: 400 })
    }

    // Forward to FastAPI with Supabase JWT
    const fastapiRes = await fetch(
      `${process.env.FASTAPI_URL}/api/tasks/provider`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name,
          description,
          model_type,
          framework,
          gpu_min,
          batch_urls,
          encrypted_file_key,
          entry_point,
          requirements_file,
          total_batches,
          price_per_batch,
          max_workers,
          provider_wallet,
        }),
      }
    )

    if (!fastapiRes.ok) {
      const err = await fastapiRes.json()
      return NextResponse.json(
        { message: err.detail || 'FastAPI error' },
        { status: fastapiRes.status }
      )
    }

    const result = await fastapiRes.json()
    return NextResponse.json({
      taskId: result.task_id,
      escrowTx: 'pending',
    })

  } catch (err) {
    console.error('POST /api/tasks error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const res = await fetch(`${process.env.FASTAPI_URL}/api/tasks/`, {
    headers: { Authorization: `Bearer ${session.access_token}` }
  })
  const data = await res.json()
  return NextResponse.json(data)
}