'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'
import { WorkerNetwork, WorkerNode } from './_components/WorkerNetwork'

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

interface Batch {
  id: string
  batch_index: number
  status: 'available' | 'assigned' | 'completed' | 'failed'
  worker_id: string | null
}

interface Worker {
  id: string
  worker_id: string
  gpu_model: string
  batches_done: number
  status: 'active' | 'warn' | 'idle'
  wallet_address: string
  earnings: number
}

interface LogEntry {
  ts: string
  tag: string
  event: string
  msg: string
  type: 'ok' | 'warn' | 'info' | 'error'
}

const MOCK_WORKERS: WorkerNode[] = [
  { id: 'W-001', gpu: 'RTX 4090', batches: 12, status: 'active', position: [1.8, 0.3, 0.5] },
  { id: 'W-002', gpu: 'RTX 3080', batches: 8, status: 'active', position: [-1.6, 0.7, -0.4] },
  { id: 'W-003', gpu: 'A100', batches: 7, status: 'active', position: [0.4, -1.3, 1.4] },
  { id: 'W-004', gpu: 'RTX 4080', batches: 5, status: 'active', position: [-0.9, 1.5, 0.8] },
  { id: 'W-005', gpu: 'RTX 3090', batches: 2, status: 'warn', position: [1.3, -0.8, -1.2] },
  { id: 'W-006', gpu: 'RTX 3080Ti', batches: 0, status: 'idle', position: [-1.2, -0.5, 1.5] },
]

const MOCK_LOGS: LogEntry[] = [
  { ts: '18:24:01', tag: 'BATCH-034', event: 'completed', msg: 'W-001 · RTX 4090 · 1.50 USDC paid', type: 'ok' },
  { ts: '18:23:44', tag: 'BATCH-033', event: 'completed', msg: 'W-003 · A100 · 1.50 USDC paid', type: 'ok' },
  { ts: '18:23:12', tag: 'W-005', event: 'warning', msg: 'High temperature detected — throttling', type: 'warn' },
  { ts: '18:22:58', tag: 'BATCH-032', event: 'completed', msg: 'W-002 · RTX 3080 · 1.50 USDC paid', type: 'ok' },
  { ts: '18:22:10', tag: 'W-006', event: 'joined', msg: 'RTX 3080Ti registered to task pool', type: 'info' },
  { ts: '18:21:44', tag: 'BATCH-031', event: 'completed', msg: 'W-004 · RTX 4080 · 1.50 USDC paid', type: 'ok' },
]

export default function TaskDashboard() {
  const { id } = useParams<{ id: string }>()
  // ADD THESE TWO LINES RIGHT HERE
  console.log('Component mounted, id:', id)
  console.log('Params:', useParams())
  const router = useRouter()
  const supabase = createClient()

  const [task, setTask] = useState<Task | null>(null)
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [dark, setDark] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null)
  const [threeReady, setThreeReady] = useState(false)

  // Persist dark mode
  useEffect(() => {
    const saved = localStorage.getItem('gpulend-theme')
    if (saved === 'dark') setDark(true)
  }, [])

  useEffect(() => {
    localStorage.setItem('gpulend-theme', dark ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  // Load task
  useEffect(() => {
    if (!id) return
    async function load() {
  setLoading(true)
  
  console.log('Loading task ID:', id)
  
  // Check auth first
  const { data: { user } } = await supabase.auth.getUser()
  console.log('Current user:', user?.email ?? 'NOT LOGGED IN')

  const { data: taskData, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()

  console.log('Task data:', taskData)
  console.log('Task error:', error?.message)

  if (taskData) setTask(taskData)
  setLoading(false)
}
    load()
  }, [id])

  // Realtime batch updates
  useEffect(() => {
    if (!id) return
    const channel = supabase
      .channel(`task-${id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'batches',
        filter: `task_id=eq.${id}`,
      }, (payload) => {
        setBatches(prev => {
          if (payload.eventType === 'INSERT') return [...prev, payload.new as Batch]
          if (payload.eventType === 'UPDATE') return prev.map(b => b.id === (payload.new as Batch).id ? payload.new as Batch : b)
          return prev
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  const doneBatches = batches.filter(b => b.status === 'completed').length
  const activeBatches = batches.filter(b => b.status === 'assigned').length
  const totalBatches = task?.total_batches ?? 50
  const pct = Math.round((doneBatches / totalBatches) * 100)
  const paidOut = (doneBatches * (task?.price_per_batch ?? 0)).toFixed(2)
  const escrowLeft = ((totalBatches - doneBatches) * (task?.price_per_batch ?? 0)).toFixed(2)

  const selectedWorkerData = MOCK_WORKERS.find(w => w.id === selectedWorker)

  const S: React.CSSProperties = {
    fontFamily: 'var(--font)',
    background: 'var(--bg)',
    color: 'var(--text)',
    minHeight: '100vh',
  }

  const card: React.CSSProperties = {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    overflow: 'hidden',
  }

  const cardHeader: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
  }

  if (loading) return (
    <div style={{ ...S, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>Loading task...</div>
      </div>
    </div>
  )

  return (
    <>
      {/* Load Three.js */}
      <Script
  src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
  strategy="beforeInteractive"
  onLoad={() => setThreeReady(true)}
/>
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
            {['Marketplace', 'My Tasks', 'Earnings', 'Settings'].map(nav => (
              <button key={nav} onClick={() => router.push(nav === 'Marketplace' ? '/community' : nav === 'My Tasks' ? '/provider/tasks' : '#')}
                style={{ padding: '6px 12px', fontSize: 13, fontWeight: 500, color: nav === 'My Tasks' ? 'var(--text)' : 'var(--text2)', background: nav === 'My Tasks' ? 'var(--bg3)' : 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font)' }}>
                {nav}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>247 nodes</span>
            <button onClick={() => setDark(d => !d)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12, fontWeight: 500, color: 'var(--text2)', cursor: 'pointer', background: 'var(--bg2)', fontFamily: 'var(--font)' }}>
              {dark ? '☀ Light' : '🌙 Dark'}
            </button>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'var(--acc-text)' }}>PR</div>
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
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>
                {id?.toString().toUpperCase()}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: -0.5, marginBottom: 8 }}>
                {task?.name ?? 'Loading...'}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[task?.framework, task?.model_type, task?.gpu_min, `${task?.price_per_batch?.toFixed(2)} USDC / batch`].filter(Boolean).map(t => (
                  <span key={t} style={{ padding: '3px 8px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, color: 'var(--text2)', fontWeight: 500 }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-border)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', animation: 'pulse 2s infinite' }} />
                Training active
              </span>
              <button style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font)', border: '1px solid var(--border2)', background: 'var(--bg2)', color: 'var(--text)' }}>
                Download model
              </button>
              <button style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font)', border: '1px solid var(--danger-border)', background: 'var(--bg2)', color: 'var(--danger)' }}>
                Stop task
              </button>
            </div>
          </div>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Batches done', val: doneBatches, suffix: `/ ${totalBatches}`, sub: `↑ ${pct}% complete`, subColor: 'var(--green)' },
              { label: 'Active workers', val: MOCK_WORKERS.filter(w => w.status === 'active').length, suffix: `/ ${task?.max_workers ?? 20}`, sub: `${activeBatches} training now`, subColor: 'var(--blue)' },
              { label: 'Escrow remaining', val: escrowLeft, suffix: 'USDC', sub: `${paidOut} paid out`, subColor: 'var(--text3)' },
              { label: 'Est. completion', val: '2.4', suffix: 'hrs', sub: 'at current rate', subColor: 'var(--text3)' },
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
            {/* Three.js visualization */}
            <div style={card}>
              <div style={cardHeader}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Worker network</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Live node visualization — click a node to inspect</div>
                </div>
              </div>
              {threeReady && (
                    <WorkerNetwork
                        key={dark ? 'dark' : 'light'}
                        workers={MOCK_WORKERS}
                        selectedId={selectedWorker}
                        onSelectWorker={setSelectedWorker}
                        dark={dark}
                    />
                    )}
            </div>

            {/* Worker list */}
            <div style={{ ...card, display: 'flex', flexDirection: 'column' }}>
              <div style={cardHeader}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Workers</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{MOCK_WORKERS.length} registered</div>
                </div>
              </div>

              {/* Worker rows */}
              <div style={{ flex: 1 }}>
                {MOCK_WORKERS.map((w) => (
                  <div key={w.id} onClick={() => setSelectedWorker(w.id === selectedWorker ? null : w.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: selectedWorker === w.id ? 'var(--green-bg)' : 'transparent', transition: 'background 0.1s' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: w.status === 'active' ? 'var(--green)' : w.status === 'warn' ? 'var(--warn)' : 'var(--border2)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{w.id}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{w.gpu}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{w.batches}</div>
                      <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 500 }}>{(w.batches * 1.5).toFixed(2)} USDC</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected worker detail */}
              {selectedWorkerData && (
                <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>
                    {selectedWorkerData.id} — {selectedWorkerData.gpu}
                  </div>
                  {[
                    ['Status', selectedWorkerData.status, selectedWorkerData.status === 'active' ? 'var(--green)' : 'var(--text)'],
                    ['Batches', String(selectedWorkerData.batches), 'var(--text)'],
                    ['Earned', `${(selectedWorkerData.batches * 1.5).toFixed(2)} USDC`, 'var(--green)'],
                    ['Wallet', `7xKp...m3Q${MOCK_WORKERS.indexOf(selectedWorkerData)}`, 'var(--text)'],
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text3)' }}>{label}</span>
                      <span style={{ color, fontWeight: 500, fontFamily: 'var(--mono)' }}>{val}</span>
                    </div>
                  ))}
                  <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 8, marginTop: 10, overflow: 'hidden' }}>
                    <div style={{ height: 4, background: 'var(--green)', borderRadius: 8, width: `${Math.min(100, Math.round(selectedWorkerData.batches / 12 * 100))}%`, transition: 'width 0.4s' }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Batch map */}
          <div style={{ ...card, marginBottom: 12 }}>
            <div style={cardHeader}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Batch map</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                  {totalBatches} total — {doneBatches} done · {activeBatches} active · {totalBatches - doneBatches - activeBatches} queued
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
                const b = batches[i]
                const status = b?.status ?? (i < doneBatches ? 'completed' : i < doneBatches + activeBatches ? 'assigned' : 'available')
                return (
                  <div key={i} title={`Batch ${i + 1}`}
                    style={{ width: 14, height: 14, borderRadius: 2, cursor: 'pointer', background: status === 'completed' ? 'var(--green)' : status === 'assigned' ? 'var(--green)' : 'var(--bg3)', opacity: status === 'assigned' ? 0.45 : 1, border: status === 'available' ? '1px solid var(--border)' : 'none', animation: status === 'assigned' ? 'blink 0.9s infinite' : 'none' }} />
                )
              })}
            </div>
          </div>

          {/* Log */}
          <div style={card}>
            <div style={cardHeader}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>System log</div>
            </div>
            <div style={{ padding: '10px 16px', fontFamily: 'var(--mono)', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {MOCK_LOGS.map((l, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text3)', flexShrink: 0 }}>{l.ts}</span>
                  <span style={{ color: 'var(--text2)', flexShrink: 0, minWidth: 80 }}>{l.tag}</span>
                  <span style={{ color: l.type === 'ok' ? 'var(--green)' : l.type === 'warn' ? 'var(--warn)' : l.type === 'info' ? 'var(--blue)' : 'var(--danger)', flexShrink: 0 }}>{l.event}</span>
                  <span style={{ color: 'var(--text3)' }}>{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        :root {
    --bg: #FAFAFA;
    --bg2: #FFFFFF;
    --bg3: #F4F4F5;
    --border: #E4E4E7;
    --border2: #D1D1D6;
    --text: #09090B;
    --text2: #52525B;
    --text3: #A1A1AA;
    --accent: #18181B;
    --acc-text: #FFFFFF;
    --green: #16A34A;
    --green-bg: #F0FDF4;
    --green-border: #BBF7D0;
    --blue: #2563EB;
    --blue-bg: #EFF6FF;
    --blue-border: #BFDBFE;
    --warn: #D97706;
    --warn-bg: #FFFBEB;
    --warn-border: #FDE68A;
    --danger: #DC2626;
    --danger-bg: #FEF2F2;
    --danger-border: #FECACA;
    --font: 'Roboto', sans-serif;
    --mono: 'Roboto Mono', monospace;
  }
  .dark {
    --bg: #0A0A0A;
    --bg2: #111111;
    --bg3: #1A1A1A;
    --border: #262626;
    --border2: #333333;
    --text: #FAFAFA;
    --text2: #A1A1AA;
    --text3: #525252;
    --accent: #FAFAFA;
    --acc-text: #0A0A0A;
    --green: #22C55E;
    --green-bg: #052E16;
    --green-border: #166534;
    --blue: #3B82F6;
    --blue-bg: #172554;
    --blue-border: #1D4ED8;
    --warn: #F59E0B;
    --warn-bg: #1C1400;
    --warn-border: #92400E;
    --danger: #EF4444;
    --danger-bg: #1A0000;
    --danger-border: #991B1B;
  }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes blink { 0%,100%{opacity:.45} 50%{opacity:.15} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes blink { 0%,100%{opacity:.45} 50%{opacity:.15} }
      `}</style>
    </>
  )
}