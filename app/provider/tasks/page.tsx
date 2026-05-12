'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ProviderTask {
  id: string
  name: string
  model_type: string
  framework: string
  total_batches: number
  price_per_batch: number
  status: string
  created_at: string
  queued_batches: number  // add this
}

export default function MyTasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<ProviderTask[]>([])
  const [loading, setLoading] = useState(true)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('gpulend-theme')
    if (saved === 'dark') setDark(true)
  }, [])

  useEffect(() => {
    localStorage.setItem('gpulend-theme', dark ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const res = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000'}/api/tasks/provider/available`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setTasks(data)
      }
      setLoading(false)
    }
    load()
  }, [])

  const S: React.CSSProperties = {
    fontFamily: 'var(--font)',
    background: 'var(--bg)',
    color: 'var(--text)',
    minHeight: '100vh',
  }

  return (
    <>
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
              <button key={nav}
                onClick={() => router.push(nav === 'New Task' ? '/provider/new-task' : '/provider/tasks')}
                style={{ padding: '6px 12px', fontSize: 13, fontWeight: 500, color: nav === 'My Tasks' ? 'var(--text)' : 'var(--text2)', background: nav === 'My Tasks' ? 'var(--bg3)' : 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font)' }}>
                {nav}
              </button>
            ))}
          </div>
          <button onClick={() => setDark(d => !d)}
            style={{ padding: '5px 12px', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12, color: 'var(--text2)', cursor: 'pointer', background: 'var(--bg2)', fontFamily: 'var(--font)' }}>
            {dark ? '☀ Light' : '🌙 Dark'}
          </button>
        </div>

        <div style={{ padding: '32px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: -0.5, margin: 0 }}>My Tasks</h1>
              <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>{tasks.length} tasks published</p>
            </div>
            <button onClick={() => router.push('/provider/new-task')}
              style={{ padding: '9px 18px', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)' }}>
              + New Task
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 64, color: 'var(--text3)' }}>Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 64, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <p style={{ color: 'var(--text3)', fontSize: 14 }}>No tasks yet</p>
              <button onClick={() => router.push('/provider/new-task')}
                style={{ marginTop: 16, padding: '8px 20px', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Create your first task
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tasks.map(task => {
                const completed = task.total_batches - (task.queued_batches ?? task.total_batches)
                const pct = Math.round((completed / task.total_batches) * 100)
                const earned = (completed * task.price_per_batch).toFixed(2)
                return (
                  <div key={task.id}
                    onClick={() => router.push(`/provider/tasks/${task.id}`)}
                    style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 20px', cursor: 'pointer', transition: 'border-color 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--green)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{task.name}</span>
                          <span style={{ padding: '2px 7px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, color: 'var(--text2)' }}>{task.model_type}</span>
                          <span style={{ padding: '2px 7px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, color: 'var(--text2)' }}>{task.framework}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--text3)' }}>
                          <span>{task.total_batches} batches</span>
                          <span style={{ color: 'var(--green)', fontWeight: 500 }}>{task.price_per_batch} USDC/batch</span>
                          <span>{earned} USDC earned</span>
                        </div>
                        <div style={{ marginTop: 10, height: 4, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: 4, background: 'var(--green)', borderRadius: 4, width: `${pct}%`, transition: 'width 0.4s' }} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{pct}% complete</div>
                      </div>
                      <div style={{ marginLeft: 20, textAlign: 'right' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: task.status === 'active' ? 'var(--green-bg)' : 'var(--bg3)', color: task.status === 'active' ? 'var(--green)' : 'var(--text3)', border: `1px solid ${task.status === 'active' ? 'var(--green-border)' : 'var(--border)'}` }}>
                          {task.status === 'active' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />}
                          {task.status}
                        </span>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8, fontFamily: 'var(--mono)' }}>{task.id.slice(0, 8).toUpperCase()}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <style>{`
        :root { --bg:#FAFAFA;--bg2:#FFFFFF;--bg3:#F4F4F5;--border:#E4E4E7;--border2:#D1D1D6;--text:#09090B;--text2:#52525B;--text3:#A1A1AA;--accent:#18181B;--acc-text:#FFFFFF;--green:#16A34A;--green-bg:#F0FDF4;--green-border:#BBF7D0;--blue:#2563EB;--warn:#D97706;--danger:#DC2626;--font:'Roboto',sans-serif;--mono:'Roboto Mono',monospace; }
        .dark { --bg:#0A0A0A;--bg2:#111111;--bg3:#1A1A1A;--border:#262626;--border2:#333333;--text:#FAFAFA;--text2:#A1A1AA;--text3:#525252;--accent:#FAFAFA;--acc-text:#0A0A0A;--green:#22C55E;--green-bg:#052E16;--green-border:#166534;--blue:#3B82F6;--warn:#F59E0B;--danger:#EF4444; }
      `}</style>
    </>
  )
}