'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export const ACCENTS = [
  { g: '#16a34a', g2: '#15803d', dot: '#166534' },
  { g: '#3b82f6', g2: '#1d4ed8', dot: '#1e3a8a' },
  { g: '#a855f7', g2: '#7e22ce', dot: '#581c87' },
  { g: '#ea580c', g2: '#c2410c', dot: '#9a3412' },
]

export function useTheme() {
  const [dark, setDark] = useState(false)
  const [accentIdx, setAccentIdx] = useState(0)

  useEffect(() => {
    const d = localStorage.getItem('dg-dark'); if (d === '1') setDark(true)
    const a = localStorage.getItem('dg-accent'); if (a) setAccentIdx(parseInt(a))
  }, [])

  const toggleDark = () => {
    setDark(d => {
      localStorage.setItem('dg-dark', !d ? '1' : '0')
      return !d
    })
  }
  const setAccent = (i: number) => {
    setAccentIdx(i)
    localStorage.setItem('dg-accent', String(i))
  }

  return { dark, toggleDark, accentIdx, setAccent, accent: ACCENTS[accentIdx] }
}

interface NavbarProps {
  dark: boolean
  toggleDark: () => void
  accentIdx: number
  setAccent: (i: number) => void
  accent: typeof ACCENTS[0]
}

export default function Navbar({ dark, toggleDark, accentIdx, setAccent, accent }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const bg = dark ? '#060a06' : '#fff'
  const b = dark ? '#1a2e1a' : '#e2e8e2'
  const t = dark ? '#e8f5e8' : '#0a140a'
  const t2 = dark ? '#7ab87a' : '#3d5c3d'
  const t3 = dark ? '#4a7a4a' : '#8aaa8a'
  const g = accent.g

  const links = [
    { label: 'Home', href: '/community' },
    { label: 'Products', href: '/products' },
    { label: 'About', href: '/about' },
  ]

  return (
    <>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(12px,4vw,28px)', height: 48, borderBottom: `1px solid ${b}`, background: bg, position: 'sticky', top: 0, zIndex: 200, gap: 8 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0, color: t }} onClick={() => router.push('/community')}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5, width: 15, height: 15 }}>
            {[0,1,2,3].map(i => <div key={i} style={{ borderRadius: 2, background: g, opacity: i===1||i===2?.35:1 }} />)}
          </div>
          decengpu
        </div>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {links.map(l => (
            <button key={l.href} onClick={() => router.push(l.href)}
              style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, color: pathname === l.href ? g : t2, border: 'none', background: 'none', cursor: 'pointer', borderBottom: pathname === l.href ? `2px solid ${g}` : '2px solid transparent', transition: '.15s' }}>
              {l.label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {/* Dev accent swatches */}
          <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            {ACCENTS.map((a, i) => (
              <div key={i} onClick={() => setAccent(i)}
                style={{ width: 11, height: 11, borderRadius: 2, background: a.dot, cursor: 'pointer', border: i === accentIdx ? `1.5px solid ${t}` : '1.5px solid transparent' }} />
            ))}
          </div>
          <button onClick={toggleDark}
            style={{ padding: '3px 7px', fontSize: 10, border: `1px solid ${b}`, borderRadius: 5, background: 'none', color: t2, cursor: 'pointer' }}>
            {dark ? 'Light' : 'Dark'}
          </button>
          <button onClick={() => router.push('/login')}
            style={{ padding: '5px 12px', fontSize: 11, fontWeight: 500, background: 'none', color: t, border: `1px solid ${b}`, borderRadius: 6, cursor: 'pointer' }}>
            Login
          </button>
          <button onClick={() => router.push('/login')}
            style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, background: g, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Sign Up
          </button>
        </div>
      </nav>
    </>
  )
}