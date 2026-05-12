'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'
import { WorkerNetwork, WorkerNode } from './_components/WorkerNetwork'

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000'

interface Task {
  id: string
  name: string
  model_type: string
  framework: string
  gpu_min: string
  price_per_batch: number
  total_batches: number
  max_workers: number
  status: string
  created_at: string
}

interface BatchSummary {
  queued: number
  assigned: number
  active: number
  completed: number
  failed: number
  stale: number
}

interface WorkerPayment {
  worker_id: string
  worker_wallet: string
  batch_number: number
  price_per_batch: number
  status: string
  completed_at: string
}

interface LogEntry {
  ts: string
  tag: string
  event: string
  msg: string
  type: 'ok' | 'warn' | 'info' | 'error'
}

// Convert batch payment records into WorkerNode format for 3D viz
function paymentsToWorkerNodes(payments: WorkerPayment[]): WorkerNode[] {
  const workerMap = new Map<string, { batches: number; wallet: string }>()
  payments.forEach(p => {
    const existing = workerMap.get(p.worker_id) || { batches: 0, wallet: p.worker_wallet }
    workerMap.set(p.worker_id, { batches: existing.batches + 1, wallet: p.worker_wallet })
  })

  const nodes: WorkerNode[] = []
  let i = 0
  workerMap.forEach((data, workerId) => {
    const angle = (i / workerMap.size) * Math.PI * 2
    const r = 1.5 + Math.random() * 0.8
    nodes.push({
      id: workerId.slice(0, 8),
      gpu: data.wallet.slice(0, 6) + '...',
      batches: data.batches,
      status: 'active',
      position: [
        Math.cos(angle) * r,
        (Math.random() - 0.5) * 1.5,
        Math.sin(angle) * r,
      ]
    })
    i++
  })
  return nodes
}

function paymentsToLogs(payments: WorkerPayment[]): LogEntry[] {
  return payments.slice(-10).reverse().map(p => ({
    ts: new Date(p.completed_at).toLocaleTimeString(),
    tag: `BATCH-${String(p.batch_number).padStart(3, '0')}`,
    event: 'completed',
    msg: `${p.worker_id.slice(0, 8)} · ${p.worker_wallet.slice(0, 8)}... · ${p.price_per_batch.toFixed(2)} USDC`,
    type: 'ok' as const,
  }))
}

export default function TaskDashboard() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [task, setTask] = useState<Task | null>(null)
  const [batchSummary, setBatchSummary] = useState<BatchSummary>({ queued: 0, assigned: 0, active: 0, completed: 0, failed: 0, stale: 0 })
  const [payments, setPayments] = useState<WorkerPayment[]>([])
  const [workerNodes, setWorkerNodes] = useState<WorkerNode[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [dark, setDark] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null)
  const [threeReady, setThreeReady] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('gpulend-theme')
    if (saved === 'dark') setDark(true)
  }, [])

  useEffect(() => {
    localStorage.setItem('gpulend-theme', dark ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const loadTask = useCallback(async (tok: string) => {
    if (!id) return
    try {
      // Fetch task overview from FastAPI
      const [overviewRes, csvRes] = await Promise.all([
        fetch(`${FASTAPI_URL}/api/tasks/provider/${id}/overview`, {
          headers: { Authorization: `Bearer ${tok}` }
        }),
        fetch(`${FASTAPI_URL}/api/tasks/provider/${id}/payment-csv`, {
          headers: { Authorization: `Bearer ${tok}` }
        }),
      ])

      if (overviewRes.ok) {
        const overview = await overviewRes.json()
        setTask({
          id: overview.task_id,
          name: overview.name,
          model_type: '',
          framework: '',
          gpu_min: '',
          price_per_batch: overview.price_per_batch,
          total_batches: overview.total_batches,
          max_workers: 20,
          status: overview.status,
          created_at: '',
        })
        setBatchSummary({
          queued: overview.batch_counts?.queued || 0,
          assigned: overview.batch_counts?.assigned || 0,
          active: overview.batch_counts?.active || 0,
          completed: overview.batch_counts?.completed || 0,
          failed: overview.batch_counts?.failed || 0,
          stale: overview.batch_counts?.stale || 0,
        })
      }

      // Parse CSV for payment records
      if (csvRes.ok) {
        const csvText = await csvRes.text()
        const lines = csvText.trim().split('\n').slice(1) // skip header
        const parsed: WorkerPayment[] = lines.map(line => {
          const [worker_id, worker_wallet, batch_number, price_per_batch, , status, completed_at] = line.split(',')
          return { worker_id, worker_wallet, batch_number: parseInt(batch_number), price_per_batch: parseFloat(price_per_batch), status, completed_at }
        }).filter(p => p.worker_id)
        setPayments(parsed)
        setWorkerNodes(paymentsToWorkerNodes(parsed))
        setLogs(paymentsToLogs(parsed))
      }
    } catch (e) {
      console.error('Failed to load task:', e)
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setToken(session.access_token)
      await loadTask(session.access_token)
    }
    init()
  }, [id])

  // Poll for updates every 30 seconds
  useEffect(() => {
    if (!token) return
    const interval = setInterval(() => loadTask(token), 30000)
    return () => clearInterval(interval)
  }, [token, loadTask])
  //3d visualization of worker network and batch progress
    useEffect(() => {
  // Poll until Three.js is available — no timeout, just keep checking
  const interval = setInterval(() => {
    if ((window as any).THREE) {
      setThreeReady(true)
      clearInterval(interval)
    }
  }, 500)
  return () => clearInterval(interval)
}, [])
  const doneBatches = batchSummary.completed
  const activeBatches = batchSummary.active + batchSummary.assigned
  const totalBatches = task?.total_batches ?? 0
  const pct = totalBatches > 0 ? Math.round((doneBatches / totalBatches) * 100) : 0
  const paidOut = (doneBatches * (task?.price_per_batch ?? 0)).toFixed(2)
  const escrowLeft = ((totalBatches - doneBatches) * (task?.price_per_batch ?? 0)).toFixed(2)

  // Group payments by worker for sidebar
  const workerSummary = payments.reduce((acc, p) => {
    if (!acc[p.worker_id]) acc[p.worker_id] = { wallet: p.worker_wallet, batches: 0 }
    acc[p.worker_id].batches++
    return acc
  }, {} as Record<string, { wallet: string; batches: number }>)

  const S: React.CSSProperties = { fontFamily: 'var(--font)', background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh' }
  const card: React.CSSProperties = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }
  const cardHeader: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }

  if (loading) return (
    <div style={{ ...S, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>Loading task...</div>
      </div>
    </div>
  )

  if (!task) return (
    <div style={{ ...S, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text3)', fontSize: 14 }}>Task not found or you don't have access.</p>
        <button onClick={() => router.push('/provider/tasks')}
          style={{ marginTop: 16, padding: '8px 20px', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
          Back to tasks
        </button>
      </div>
    </div>
  )

  return (
    <>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" strategy="afterInteractive" onLoad={() => setThreeReady(true)} />
      <div style={S}>
        {/* Topbar */}
        <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => router.push('/')}>
            <div style={{ width: 26, height: 26, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 9, height: 9, background: 'var(--green)', borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: -0.3 }}>GPULEND</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['My Tasks', 'New Task'].map(nav => (
              <button key={nav} onClick={() => router.push(nav === 'New Task' ? '/provider/new-task' : '/provider/tasks')}
                style={{ padding: '6px 12px', fontSize: 13, fontWeight: 500, color: nav === 'My Tasks' ? 'var(--text)' : 'var(--text2)', background: nav === 'My Tasks' ? 'var(--bg3)' : 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font)' }}>
                {nav}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setDark(d => !d)}
              style={{ padding: '5px 12px', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12, color: 'var(--text2)', cursor: 'pointer', background: 'var(--bg2)', fontFamily: 'var(--font)' }}>
              {dark ? '☀ Light' : '🌙 Dark'}
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text3)' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => router.push('/provider/tasks')}>My Tasks</span>
          <span style={{ color: 'var(--border2)' }}>/</span>
          <span style={{ color: 'var(--text)', fontWeight: 500, fontFamily: 'var(--mono)' }}>{id?.toString().slice(0, 8).toUpperCase()}</span>
        </div>

        <div style={{ padding: '0 24px 48px' }}>
          {/* Task header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>{id?.toString().toUpperCase()}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: -0.5, marginBottom: 8 }}>{task.name}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[task.framework, task.model_type, task.gpu_min, `${task.price_per_batch?.toFixed(2)} USDC / batch`].filter(Boolean).map(t => (
                  <span key={t} style={{ padding: '3px 8px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, color: 'var(--text2)', fontWeight: 500 }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-border)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', animation: 'pulse 2s infinite' }} />
                {task.status}
              </span>
              <button
                onClick={async () => {
                  if (!token) return
                  await fetch(`${FASTAPI_URL}/api/tasks/${id}/payment-csv`, { headers: { Authorization: `Bearer ${token}` } })
                    .then(r => r.blob()).then(blob => {
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a'); a.href = url; a.download = `payments_${id}.csv`; a.click()
                    })
                }}
                style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font)', border: '1px solid var(--border2)', background: 'var(--bg2)', color: 'var(--text)' }}>
                Download CSV
              </button>
            </div>
          </div>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Batches done', val: doneBatches, suffix: `/ ${totalBatches}`, sub: `↑ ${pct}% complete`, subColor: 'var(--green)' },
              { label: 'Active workers', val: Object.keys(workerSummary).length, suffix: `total`, sub: `${activeBatches} training now`, subColor: 'var(--blue)' },
              { label: 'Escrow remaining', val: escrowLeft, suffix: 'USDC', sub: `${paidOut} paid out`, subColor: 'var(--text3)' },
              { label: 'Queued batches', val: batchSummary.queued, suffix: 'remaining', sub: `${batchSummary.stale} stale`, subColor: 'var(--warn)' },
            ].map(({ label, val, suffix, sub, subColor }) => (
              <div key={label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500, marginBottom: 8 }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', letterSpacing: -0.5 }}>
                  {val}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text3)', marginLeft: 3 }}>{suffix}</span>
                </div>
                <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: subColor }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Network + Workers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 12, marginBottom: 12 }}>
            <div style={card}>
              <div style={cardHeader}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Worker network</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Live node visualization — click a node to inspect</div>
                </div>
              </div>
              {threeReady && workerNodes.length > 0 ? (
                <WorkerNetwork key={dark ? 'dark' : 'light'} workers={workerNodes} selectedId={selectedWorker} onSelectWorker={setSelectedWorker} dark={dark} />
              ) : (
                <div style={{ padding: 32, display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                  {workerNodes.map(w => (
                    <div key={w.id} style={{ textAlign: 'center', padding: '12px 16px', background: 'var(--bg3)', border: '1px solid var(--green-border)', borderRadius: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green)', margin: '0 auto 6px' }} />
                      <div style={{ fontSize: 11, color: 'var(--text)', fontFamily: 'var(--mono)' }}>{w.id}</div>
                      <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>{w.batches} batches</div>
                    </div>
                  ))}
                  {workerNodes.length === 0 && (
                    <p style={{ color: 'var(--text3)', fontSize: 13 }}>No workers yet</p>
                  )}
                </div>
              )}
            </div>

            {/* Worker list */}
            <div style={{ ...card, display: 'flex', flexDirection: 'column' }}>
              <div style={cardHeader}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Workers</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{Object.keys(workerSummary).length} contributors</div>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {Object.entries(workerSummary).length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>No workers yet</div>
                ) : Object.entries(workerSummary).map(([workerId, data], i) => (
                  <div key={workerId}
                    onClick={() => setSelectedWorker(workerId.slice(0, 8) === selectedWorker ? null : workerId.slice(0, 8))}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: selectedWorker === workerId.slice(0, 8) ? 'var(--green-bg)' : 'transparent' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: 'var(--green)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--mono)' }}>{workerId.slice(0, 12)}...</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{data.wallet.slice(0, 8)}...</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{data.batches}</div>
                      <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 500 }}>{(data.batches * (task?.price_per_batch || 0)).toFixed(2)} USDC</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Batch map */}
          <div style={{ ...card, marginBottom: 12 }}>
            <div style={cardHeader}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Batch map</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                  {totalBatches} total — {doneBatches} done · {activeBatches} active · {batchSummary.queued} queued
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text3)', alignItems: 'center' }}>
                {[['Done', 'var(--green)', 1], ['Active', 'var(--green)', 0.45], ['Queued', 'var(--bg3)', 1]].map(([label, bg, op]) => (
                  <span key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 10, height: 10, background: bg as string, opacity: op as number, border: label === 'Queued' ? '1px solid var(--border)' : 'none', borderRadius: 2, display: 'inline-block' }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, padding: '14px 16px' }}>
              {Array.from({ length: totalBatches }, (_, i) => {
                const batchNum = i + 1
                const isCompleted = batchNum <= doneBatches
                const isActive = !isCompleted && batchNum <= doneBatches + activeBatches
                return (
                  <div key={i} title={`Batch ${batchNum}`}
                    style={{ width: 14, height: 14, borderRadius: 2, cursor: 'default', background: isCompleted ? 'var(--green)' : isActive ? 'var(--green)' : 'var(--bg3)', opacity: isActive ? 0.45 : 1, border: (!isCompleted && !isActive) ? '1px solid var(--border)' : 'none', animation: isActive ? 'blink 0.9s infinite' : 'none' }} />
                )
              })}
            </div>
          </div>

          {/* Log */}
          <div style={card}>
            <div style={cardHeader}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Payment log</div>
            </div>
            <div style={{ padding: '10px 16px', fontFamily: 'var(--mono)', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {logs.length === 0 ? (
                <div style={{ padding: '16px 0', color: 'var(--text3)', textAlign: 'center' }}>No completed batches yet</div>
              ) : logs.map((l, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text3)', flexShrink: 0 }}>{l.ts}</span>
                  <span style={{ color: 'var(--text2)', flexShrink: 0, minWidth: 80 }}>{l.tag}</span>
                  <span style={{ color: 'var(--green)', flexShrink: 0 }}>{l.event}</span>
                  <span style={{ color: 'var(--text3)' }}>{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        :root { --bg:#FAFAFA;--bg2:#FFFFFF;--bg3:#F4F4F5;--border:#E4E4E7;--border2:#D1D1D6;--text:#09090B;--text2:#52525B;--text3:#A1A1AA;--accent:#18181B;--acc-text:#FFFFFF;--green:#16A34A;--green-bg:#F0FDF4;--green-border:#BBF7D0;--blue:#2563EB;--blue-bg:#EFF6FF;--blue-border:#BFDBFE;--warn:#D97706;--warn-bg:#FFFBEB;--warn-border:#FDE68A;--danger:#DC2626;--danger-bg:#FEF2F2;--danger-border:#FECACA;--font:'Roboto',sans-serif;--mono:'Roboto Mono',monospace; }
        .dark { --bg:#0A0A0A;--bg2:#111111;--bg3:#1A1A1A;--border:#262626;--border2:#333333;--text:#FAFAFA;--text2:#A1A1AA;--text3:#525252;--accent:#FAFAFA;--acc-text:#0A0A0A;--green:#22C55E;--green-bg:#052E16;--green-border:#166534;--blue:#3B82F6;--blue-bg:#172554;--blue-border:#1D4ED8;--warn:#F59E0B;--warn-bg:#1C1400;--warn-border:#92400E;--danger:#EF4444;--danger-bg:#1A0000;--danger-border:#991B1B; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes blink { 0%,100%{opacity:.45} 50%{opacity:.15} }
      `}</style>
    </>
  )
}