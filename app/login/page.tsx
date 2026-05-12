'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const d = localStorage.getItem('dg-dark')
    if (d === '1') setDark(true)
  }, [])

  const bg = dark ? '#060a06' : '#f8faf8'
  const bg2 = dark ? '#0d140d' : '#ffffff'
  const b = dark ? '#1a2e1a' : '#e2e8e2'
  const t = dark ? '#e8f5e8' : '#0a140a'
  const t2 = dark ? '#7ab87a' : '#3d5c3d'
  const t3 = dark ? '#4a7a4a' : '#8aaa8a'
  const g = '#16a34a'

  const inputStyle = {
    width: '100%', background: dark ? '#060a06' : '#f8faf8',
    border: `1px solid ${b}`, color: t, padding: '10px 14px',
    borderRadius: 7, fontFamily: 'system-ui,sans-serif',
    fontSize: 13, outline: 'none', transition: '.15s',
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (mode === 'signup') {
      if (!username.trim()) { setError('Username is required'); setLoading(false); return }
      if (username.length < 3) { setError('Username must be at least 3 characters'); setLoading(false); return }
      if (password !== confirmPassword) { setError('Passwords do not match'); setLoading(false); return }
      if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: username.trim(), is_admin: false }
        }
      })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Account created! Check your email to confirm, then log in.')
        setMode('login')
        setPassword('')
        setConfirmPassword('')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push('/provider/tasks')
      }
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: bg, fontFamily: 'system-ui,sans-serif' }}>

      {/* Minimal nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 48, borderBottom: `1px solid ${b}`, background: bg2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 700, cursor: 'pointer', color: t }} onClick={() => router.push('/community')}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5, width: 15, height: 15 }}>
            {[0,1,2,3].map(i => <div key={i} style={{ borderRadius: 2, background: g, opacity: i===1||i===2?.35:1 }} />)}
          </div>
          decengpu
        </div>
        <button onClick={() => setDark(d => !d)} style={{ padding: '3px 7px', fontSize: 10, border: `1px solid ${b}`, borderRadius: 5, background: 'none', color: t2, cursor: 'pointer' }}>
          {dark ? 'Light' : 'Dark'}
        </button>
      </nav>

      {/* Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 15, fontWeight: 700, color: t, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5, width: 16, height: 16 }}>
                {[0,1,2,3].map(i => <div key={i} style={{ borderRadius: 2, background: g, opacity: i===1||i===2?.35:1 }} />)}
              </div>
              decengpu
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -.5, color: t, marginBottom: 6 }}>
              {mode === 'login' ? 'Welcome back' : 'Join the network'}
            </h1>
            <p style={{ fontSize: 13, color: t2 }}>
              {mode === 'login' ? 'Sign in to your account' : 'Create your free account'}
            </p>
          </div>

          {/* Mode toggle */}
          <div style={{ display: 'flex', background: dark ? '#0a140a' : '#f0f4f0', border: `1px solid ${b}`, borderRadius: 8, padding: 3, marginBottom: 24 }}>
            {(['login', 'signup'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(null); setSuccess(null) }}
                style={{ flex: 1, padding: '7px 0', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: mode === m ? bg2 : 'transparent', color: mode === m ? t : t3, boxShadow: mode === m ? `0 1px 3px rgba(0,0,0,.1)` : 'none', transition: '.15s' }}>
                {m === 'login' ? 'Log in' : 'Sign up'}
              </button>
            ))}
          </div>

          {/* Success message */}
          {success && (
            <div style={{ padding: '10px 14px', background: `${g}15`, border: `1px solid ${g}40`, borderRadius: 7, fontSize: 12, color: g, marginBottom: 16 }}>
              {success}
            </div>
          )}

          {/* Form fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {mode === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: t2, marginBottom: 5, textTransform: 'uppercase', letterSpacing: .5 }}>Username</label>
                <input type="text" placeholder="your_handle" value={username} onChange={e => setUsername(e.target.value)}
                  style={inputStyle} onFocus={e => (e.target.style.borderColor = g)} onBlur={e => (e.target.style.borderColor = b)} />
                <p style={{ fontSize: 10, color: t3, marginTop: 4 }}>This will appear on the leaderboard</p>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: t2, marginBottom: 5, textTransform: 'uppercase', letterSpacing: .5 }}>Email</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={inputStyle} onFocus={e => (e.target.style.borderColor = g)} onBlur={e => (e.target.style.borderColor = b)} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: t2, marginBottom: 5, textTransform: 'uppercase', letterSpacing: .5 }}>Password</label>
              <input type="password" placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'} value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={inputStyle} onFocus={e => (e.target.style.borderColor = g)} onBlur={e => (e.target.style.borderColor = b)} />
            </div>

            {mode === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: t2, marginBottom: 5, textTransform: 'uppercase', letterSpacing: .5 }}>Confirm password</label>
                <input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  style={inputStyle} onFocus={e => (e.target.style.borderColor = g)} onBlur={e => (e.target.style.borderColor = b)} />
              </div>
            )}

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 7, fontSize: 12, color: '#ef4444' }}>
                {error}
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading}
              style={{ width: '100%', padding: '11px 0', background: loading ? t3 : g, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4, transition: '.15s', letterSpacing: .3 }}>
              {loading ? (mode === 'login' ? 'Signing in...' : 'Creating account...') : (mode === 'login' ? 'Sign in →' : 'Create account →')}
            </button>
          </div>

          {/* Footer link */}
          <p style={{ textAlign: 'center', fontSize: 12, color: t3, marginTop: 20 }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setSuccess(null) }}
              style={{ background: 'none', border: 'none', color: g, fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>

          {/* Back to community */}
          <p style={{ textAlign: 'center', fontSize: 12, color: t3, marginTop: 12 }}>
            <button onClick={() => router.push('/community')}
              style={{ background: 'none', border: 'none', color: t3, fontSize: 12, cursor: 'pointer' }}>
              ← Back to community
            </button>
          </p>
        </div>
      </div>

      <style>{`input::placeholder{color:${t3}}`}</style>
    </div>
  )
}