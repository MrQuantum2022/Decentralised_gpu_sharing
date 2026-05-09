import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check — must be a logged-in provider
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      name, description, model_type, framework, gpu_min,
      encrypted_file_url, encrypted_file_key,
      entry_point, requirements_file,
      total_batches, price_per_batch, max_workers,
      provider_wallet,
    } = body

    // Basic server-side validation
    if (!name || !model_type || !framework || !encrypted_file_url || !provider_wallet) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    // Insert task row
    const { data: task, error: taskErr } = await supabase
      .from('tasks')
      .insert({
        provider_id: user.id,
        provider_wallet,
        name,
        description,
        model_type,
        framework,
        gpu_min,
        encrypted_file_url,
        encrypted_file_key,  // RSA-wrapped AES key
        entry_point,
        requirements_file,
        total_batches,
        price_per_batch,
        max_workers,
        status: 'pending',   // → 'active' after escrow confirmed
      })
      .select()
      .single()

    if (taskErr || !task) {
      console.error('Task insert error:', taskErr)
      return NextResponse.json({ message: 'Failed to create task' }, { status: 500 })
    }

    // Trigger FastAPI batch splitter async — fire and forget
    // The splitter reads the encrypted file, divides it into N batch manifest rows
    fetch(`${process.env.FASTAPI_URL}/internal/split-batches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': process.env.INTERNAL_SECRET!,
      },
      body: JSON.stringify({
        task_id: task.id,
        total_batches,
        encrypted_file_url,
        encrypted_file_key,
      }),
    }).catch((e) => console.error('Batch splitter trigger failed:', e))

    return NextResponse.json({
      taskId: task.id,
      escrowTx: 'pending', // updated by Solana webhook once escrow tx confirms
    })
  } catch (err) {
    console.error('POST /api/tasks error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
export async function GET() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}