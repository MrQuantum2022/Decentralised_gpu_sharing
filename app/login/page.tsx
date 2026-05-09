'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/provider/new-task')
    }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#080C0A'}}>
      <div style={{border:'1px solid rgba(0,255,128,0.18)',padding:'32px',width:'360px',background:'#0D1410'}}>
        <div style={{fontFamily:'monospace',fontSize:'11px',letterSpacing:'3px',color:'#00FF80',marginBottom:'24px'}}>
          GPULEND.IO // SIGN IN
        </div>
        <input
          type="email"
          placeholder="EMAIL"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{width:'100%',background:'#080C0A',border:'1px solid rgba(0,255,128,0.18)',color:'#fff',padding:'10px 14px',marginBottom:'12px',fontFamily:'monospace',fontSize:'13px',outline:'none'}}
        />
        <input
          type="password"
          placeholder="PASSWORD"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{width:'100%',background:'#080C0A',border:'1px solid rgba(0,255,128,0.18)',color:'#fff',padding:'10px 14px',marginBottom:'16px',fontFamily:'monospace',fontSize:'13px',outline:'none'}}
        />
        {error && <p style={{color:'#FF4444',fontSize:'11px',fontFamily:'monospace',marginBottom:'12px',letterSpacing:'1px'}}>{error}</p>}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{width:'100%',background:'#00FF80',color:'#080C0A',border:'none',padding:'10px',fontFamily:'monospace',fontSize:'11px',letterSpacing:'2px',fontWeight:'700',cursor:'pointer',opacity:loading?0.5:1}}
        >
          {loading ? 'SIGNING IN...' : 'SIGN IN →'}
        </button>
      </div>
    </div>
  )
}