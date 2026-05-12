'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter } from 'next/navigation'
// framer-motion removed - using CSS transitions
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere } from '@react-three/drei'
import * as THREE from 'three'
import Navbar, { useTheme } from '@/components/Navbar'

const FASTAPI_INTERNAL = '/api/community'

interface Stats { total_members: number; total_tasks: number; total_contributions: number; total_usdc: number }
interface LBEntry { user_id: string; username: string; wallet: string; contributions: number; score: number }
interface Task { id: string; name: string; model_type: string; framework: string; price_per_batch: number; total_batches: number; queued_batches: number }

// ─── GLOBE ────────────────────────────────────────────────────────────────────
function rndSphere(r: number) {
  const u = Math.random(), v = Math.random()
  const t = 2 * Math.PI * u, p = Math.acos(2 * v - 1)
  return new THREE.Vector3(r * Math.sin(p) * Math.cos(t), r * Math.sin(p) * Math.sin(t), r * Math.cos(p))
}

interface Ev { id: number; target: THREE.Vector3; sources: THREE.Vector3[]; progress: number; hold: number; fade: number; phase: 'in'|'hold'|'out' }

function GlobeEvents({ color }: { color: string }) {
  const evs = useRef<Ev[]>([])
  const uid = useRef(0)
  const grp = useRef<THREE.Group>(null)

  useFrame((_, dt) => {
    if (evs.current.length < 6 && Math.random() > 0.985) {
      const target = rndSphere(2.02)
      evs.current.push({ id: uid.current++, target, sources: Array.from({ length: 2 + Math.floor(Math.random() * 4) }, () => rndSphere(2.02)), progress: 0, hold: 0, fade: 1, phase: 'in' })
    }
    evs.current = evs.current.filter(ev => {
      if (ev.phase === 'in') { ev.progress = Math.min(1, ev.progress + dt * 0.55); if (ev.progress >= 1) ev.phase = 'hold' }
      else if (ev.phase === 'hold') { ev.hold += dt; if (ev.hold > 1.4) ev.phase = 'out' }
      else { ev.fade = Math.max(0, ev.fade - dt * 1.4); if (ev.fade <= 0) return false }
      return true
    })
    if (!grp.current) return
    while (grp.current.children.length) grp.current.remove(grp.current.children[0])
    const c = new THREE.Color(color)
    evs.current.forEach(ev => {
      const a = ev.phase === 'out' ? ev.fade : 1
      const blink = a * (0.5 + 0.5 * Math.sin(Date.now() / 110))
      const tMesh = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: blink }))
      tMesh.position.copy(ev.target); grp.current!.add(tMesh)
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.085, 0.105, 24), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: blink * 0.35, side: THREE.DoubleSide }))
      ring.position.copy(ev.target); ring.lookAt(0, 0, 0); grp.current!.add(ring)
      ev.sources.forEach(src => {
        const cur = new THREE.Vector3().lerpVectors(src, ev.target, ev.progress)
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: a * 0.9 }))
        dot.position.copy(cur); grp.current!.add(dot)
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([src.clone(), cur.clone()]), new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: a * 0.22 }))
        grp.current!.add(line)
        const srcDot = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: a * 0.45 }))
        srcDot.position.copy(src); grp.current!.add(srcDot)
      })
    })
  })
  return <group ref={grp} />
}

function Globe({ color }: { color: string }) {
  return (
    <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }} style={{ width: '100%', height: '100%' }}>
      <Suspense fallback={null}>
        <group rotation={[0, 0, 23 * Math.PI / 180]}>
          <Sphere args={[2.14, 32, 32]}><meshBasicMaterial color={color} transparent opacity={0.03} side={THREE.BackSide} /></Sphere>
          <Sphere args={[2, 36, 36]}><meshBasicMaterial color={color} wireframe transparent opacity={0.17} /></Sphere>
          <Sphere args={[1.98, 24, 24]}><meshBasicMaterial color={color} transparent opacity={0.035} /></Sphere>
          <GlobeEvents color={color} />
        </group>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} minPolarAngle={Math.PI * 0.2} maxPolarAngle={Math.PI * 0.8} />
      </Suspense>
    </Canvas>
  )
}

// ─── CABLE SECTION ────────────────────────────────────────────────────────────
interface SecProps {
  id: string; title: string; side: 'left'|'right'
  gpuImage: string; gpuName: string; topCable: string
  dark: boolean; accent: string; children: React.ReactNode; isLast?: boolean
}

function CableSection({ id, title, side, gpuImage, gpuName, topCable, dark, accent, children, isLast }: SecProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)
  const [cp, setCp] = useState(0)

  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true) }, { threshold: 0.12 })
    if (ref.current) ob.observe(ref.current)
    return () => ob.disconnect()
  }, [])

  useEffect(() => {
    if (!vis) return
    let raf: number; const t0 = performance.now(), dur = 900
    const run = (now: number) => { const p = Math.min(1, (now - t0) / dur); setCp(1 - Math.pow(1 - p, 3)); if (p < 1) raf = requestAnimationFrame(run) }
    raf = requestAnimationFrame(run)
    return () => cancelAnimationFrame(raf)
  }, [vis])

  const isRight = side === 'right'

  // ── GPU SIZE CONFIG — adjust these to change GPU appearance ──────────────
  const GPU_WIDTH = 'clamp(120px, 50vw, 400px)'   // width of visible GPU portion
  const GPU_HEIGHT = 'clamp(200px, 70vw, 540px)'  // height — aim to match section height
  const GPU_OPACITY = 0.88
  // ─────────────────────────────────────────────────────────────────────────

  const bg = dark ? '#0d140d' : '#f4f4f5'
  const bd = dark ? '#1a2e1a' : '#d4d4d8'
  const t = dark ? '#e8f5e8' : '#111'
  const t2 = dark ? '#7ab87a' : '#555'
  const t3 = dark ? '#4a7a4a' : '#999'

  return (
    <div ref={ref} id={id} style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* Vertical cable coming down */}
      <div style={{ width: 64, height: 80, position: 'relative', flexShrink: 0 }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', gap: 3, padding: '0 10px', borderLeftWidth: 1, borderLeftStyle: 'solid', borderLeftColor: bd, borderRightWidth: 1, borderRightStyle: 'solid', borderRightColor: bd }}>
          {[...Array(7)].map((_, i) => <div key={i} style={{ flex: 1, background: bd, opacity: 0.45, borderRadius: 1 }} />)}
        </div>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', transformOrigin: 'top' }}>
          <img src={`/cables/${topCable}`} alt="" style={{ width: '100%', height: `${cp * 100}%`, objectFit: 'cover', objectPosition: 'top', opacity: cp, display: 'block' }} />
        </div>
      </div>

      {/* Row: GPU half-visible | content card */}
      <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {/* LEFT GPU (shows when side=left) */}
        {!isRight && (
          <div style={{ position: 'absolute', left: 0, top: '50%', transform: `translateY(-50%) translateX(${vis ? 0 : -80}px)`, opacity: vis ? 1 : 0, transition: 'transform 0.65s ease 0.2s, opacity 0.65s ease 0.2s', display: 'flex', alignItems: 'center', zIndex: 10, pointerEvents: 'none' }}>
            {/* GPU image — free, no clip, bleeds off left edge */}
            <div style={{ width: GPU_WIDTH, height: GPU_HEIGHT, position: 'relative', flexShrink: 0 }}>
              <img src={`/gpus/${gpuImage}`} alt={gpuName} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'right center', mixBlendMode: 'luminosity', opacity: GPU_OPACITY, display: 'block' }} />
              <div style={{ position: 'absolute', bottom: 4, right: 4, fontSize: 7, fontFamily: 'monospace', color: dark ? '#4a7a4a' : '#aaa', letterSpacing: 0.5 }}>{gpuName}</div>
            </div>
            {/* 8-pin connector — from GPU into card */}
            <div style={{ position: 'relative', width: 'clamp(34px,20vw,55px)', height: 28, flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: 2.5, padding: '3px 5px', borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: bd, borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: bd, borderRightWidth: 1, borderRightStyle: 'solid', borderRightColor: bd, background: dark ? 'rgba(0,0,0,.15)' : 'rgba(0,0,0,.04)' }}>
                {[...Array(4)].map((_, i) => <div key={i} style={{ flex: 1, background: bd, borderRadius: 1, opacity: 0.6 }} />)}
              </div>
              <img src="/cables/8_pin_cable.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 2 }} />
            </div>
          </div>
        )}

        {/* Content card */}
        <div style={{ opacity: vis ? 1 : 0, transform: `translateY(${vis ? 0 : 20}px)`, transition: 'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s', width: '70%', maxWidth: 660, background: bg, border: `1px solid ${bd}`, borderRadius: 14, padding: 'clamp(18px,3vw,32px)', position: 'relative', zIndex: 2 }}>
          <h2 style={{ fontSize: 'clamp(15px,2.2vw,21px)', fontWeight: 700, letterSpacing: -0.5, color: t, marginBottom: 14 }}>{title}</h2>
          <div style={{ color: t2 }}>{children}</div>
        </div>

        {/* RIGHT GPU (shows when side=right) */}
        {isRight && (
          <div style={{ position: 'absolute', right: 0, top: '50%', transform: `translateY(-50%) translateX(${vis ? 0 : 80}px)`, opacity: vis ? 1 : 0, transition: 'transform 0.65s ease 0.2s, opacity 0.65s ease 0.2s', display: 'flex', alignItems: 'center', zIndex: 10, pointerEvents: 'none' }}>
            {/* 8-pin connector from card into GPU */}
            <div style={{ position: 'relative', width: 'clamp(34px,5vw,55px)', height: 28, flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: 2.5, padding: '3px 5px', borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: bd, borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: bd, borderLeftWidth: 1, borderLeftStyle: 'solid', borderLeftColor: bd, background: dark ? 'rgba(0,0,0,.15)' : 'rgba(0,0,0,.04)' }}>
                {[...Array(4)].map((_, i) => <div key={i} style={{ flex: 1, background: bd, borderRadius: 1, opacity: 0.6 }} />)}
              </div>
              <img src="/cables/8_pin_cable.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 2, transform: 'scaleX(-1)' }} />
            </div>
            {/* GPU image — free, no clip, bleeds off right edge */}
            <div style={{ width: GPU_WIDTH, height: GPU_HEIGHT, position: 'relative', flexShrink: 0 }}>
              <img src={`/gpus/${gpuImage}`} alt={gpuName} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'left center', mixBlendMode: 'luminosity', opacity: GPU_OPACITY, display: 'block' }} />
              <div style={{ position: 'absolute', bottom: 4, left: 4, fontSize: 7, fontFamily: 'monospace', color: dark ? '#4a7a4a' : '#aaa', letterSpacing: 0.5 }}>{gpuName}</div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom cable stub */}
      {!isLast && (
        <div style={{ width: 64, height: 30, position: 'relative', flexShrink: 0 }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', gap: 3, padding: '0 10px', borderLeftWidth: 1, borderLeftStyle: 'solid', borderLeftColor: bd, borderRightWidth: 1, borderRightStyle: 'solid', borderRightColor: bd }}>
            {[...Array(7)].map((_, i) => <div key={i} style={{ flex: 1, background: bd, opacity: 0.45, borderRadius: 1 }} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const router = useRouter()
  const { dark, toggleDark, accentIdx, setAccent, accent } = useTheme()
  const g = accent.g
  const bg = dark ? '#060a06' : '#ffffff'
  const bg2 = dark ? '#0d140d' : '#f4f4f5'
  const bd = dark ? '#1a2e1a' : '#d4d4d8'
  const t = dark ? '#e8f5e8' : '#111111'
  const t2 = dark ? '#7ab87a' : '#555555'
  const t3 = dark ? '#4a7a4a' : '#999999'

  const [stats, setStats] = useState<Stats>({ total_members: 0, total_tasks: 0, total_contributions: 0, total_usdc: 0 })
  const [lb, setLb] = useState<LBEntry[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [lbQ, setLbQ] = useState('')
  const [tw, setTw] = useState(2847)
  const [tb2, setTb2] = useState(184293)
  const [tu, setTu] = useState(92146)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${FASTAPI_INTERNAL}/stats`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${FASTAPI_INTERNAL}/leaderboard`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${FASTAPI_INTERNAL}/tasks`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([s, l, tk]) => {
      if (s) setStats(s)
      if (l) setLb(l)
      if (tk) setTasks(tk.slice(0, 3))
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    const i = setInterval(() => {
      setTw(w => w + Math.floor(Math.random() * 2))
      setTb2(b => b + Math.floor(Math.random() * 4))
      setTu(u => u + Math.random() * 1.5)
    }, 2000)
    return () => clearInterval(i)
  }, [])

  const displayTasks = tasks.length > 0 ? tasks : [
    { id: '1', name: 'ResNet-50 Training', model_type: 'Image classification', framework: 'PyTorch', price_per_batch: 1.5, total_batches: 50, queued_batches: 27 },
    { id: '2', name: 'GPT-2 Fine-tune', model_type: 'NLP / LLM', framework: 'PyTorch', price_per_batch: 2.0, total_batches: 30, queued_batches: 22 },
    { id: '3', name: 'YOLO Detection', model_type: 'Object detection', framework: 'PyTorch', price_per_batch: 1.0, total_batches: 20, queued_batches: 5 },
  ]

  const filteredLB = (lb.length > 0 ? lb : [
    { user_id: '1', username: 'PrettyMonster', wallet: 'GxZo53km...', contributions: 47, score: 70.5 },
    { user_id: '2', username: 'bubbles', wallet: '7kM9px...', contributions: 38, score: 57.0 },
    { user_id: '3', username: 'gpu_wizard', wallet: '4xBn12...', contributions: 31, score: 46.5 },
    { user_id: '4', username: 'trainmaster', wallet: '9vCk45...', contributions: 24, score: 36.0 },
    { user_id: '5', username: 'solana_miner', wallet: '2wDp78...', contributions: 19, score: 28.5 },
  ]).filter(e => !lbQ || (e.username || e.user_id).toLowerCase().includes(lbQ.toLowerCase()))

  const sp = { dark, accent: g }

  return (
    <div style={{ background: bg, color: t, fontFamily: 'system-ui, sans-serif', minHeight: '100vh', overflowX: 'hidden' }}>
      <Navbar dark={dark} toggleDark={toggleDark} accentIdx={accentIdx} setAccent={setAccent} accent={accent} />

      {/* ── HERO ── */}
      <div style={{ borderBottom: `1px solid ${bd}` }}>
        {/* Desktop: side by side | Mobile: stacked */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', minHeight: 'clamp(300px,45vw,460px)' }}>
          {/* Copy */}
          <div style={{ padding: 'clamp(28px,5vw,64px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 2 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', border: `1px solid ${bd}`, borderRadius: 20, fontSize: 11, color: g, marginBottom: 18, background: bg2, width: 'fit-content' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: g, animation: 'blink 2s infinite' }} />
              Live · {tw.toLocaleString()} nodes active
            </div>
            <h1 style={{ fontSize: 'clamp(24px,4vw,52px)', fontWeight: 800, letterSpacing: -2, lineHeight: 1.0, textTransform: 'uppercase', marginBottom: 14, color: t }}>
              Pay to compute,<br /><span style={{ color: g }}>paid to compute</span>
            </h1>
            <p style={{ fontSize: 14, color: t2, lineHeight: 1.7, maxWidth: 380, marginBottom: 28 }}>
              Unlock powerful GPU compute for AI and science. Or monetise your idle GPU hardware.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
              <button onClick={() => router.push('/products')} style={{ padding: '10px 22px', background: g, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Start Earning →</button>
              <button onClick={() => router.push('/login')} style={{ padding: '10px 22px', background: 'none', color: t, border: `1px solid ${bd}`, borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Train a Model</button>
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[{ val: tw.toLocaleString(), label: 'workers', dot: true }, { val: tb2.toLocaleString(), label: 'batches done' }, { val: `$${Math.round(tu).toLocaleString()}`, label: 'USDC paid' }].map((tk, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {tk.dot && <div style={{ width: 5, height: 5, borderRadius: '50%', background: g, animation: 'blink 2s infinite' }} />}
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: t }}>{tk.val}</span>
                  <span style={{ fontSize: 11, color: t3 }}>{tk.label}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Globe — responsive height */}
          <div style={{ minHeight: 'clamp(240px,35vw,380px)', cursor: 'grab', position: 'relative' }}>
            <Globe color={g} />
          </div>
        </div>
      </div>

      {/* ── SECTIONS ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'clamp(24px,4vw,48px) 0 0', gap: 0 }}>

        <CableSection id="s-how" title="Three roles. One network." side="right" gpuImage="rtx_4090_top.png" gpuName="RTX 4090" topCable="12_pin_cable.png" {...sp}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10 }}>
            {[
              { icon: '🔐', t: 'Provider', d: 'Upload encrypted dataset, set price per batch. Pay only for completed results.' },
              { icon: '⚡', t: 'Network', d: 'FIFO batch queue. Heartbeat monitoring ensures no batch is ever lost.' },
              { icon: '💰', t: 'Worker', d: 'Train locally, earn USDC per batch. Auto-allocate runs 24/7.' },
            ].map(c => (
              <div key={c.t} style={{ padding: 13, border: `1px solid ${bd}`, borderRadius: 8, background: dark ? '#060a06' : '#fff' }}>
                <div style={{ fontSize: 18, marginBottom: 7 }}>{c.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: t, marginBottom: 4 }}>{c.t}</div>
                <p style={{ fontSize: 11, color: t2, lineHeight: 1.6 }}>{c.d}</p>
              </div>
            ))}
          </div>
        </CableSection>

        <CableSection id="s-stats" title="Network at a glance" side="left" gpuImage="rtx_3080_top.png" gpuName="RTX 3080" topCable="12_pin_cable.png" {...sp}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
            {[
              { label: 'Total Members', val: loading ? '...' : (stats.total_members || 34587).toLocaleString() },
              { label: 'Batches Completed', val: tb2.toLocaleString() },
              { label: 'Contributions', val: loading ? '...' : (stats.total_contributions || 7300).toLocaleString() },
              { label: 'USDC Distributed', val: `$${Math.round(stats.total_usdc || tu).toLocaleString()}` },
            ].map(s => (
              <div key={s.label} style={{ padding: '11px 13px', border: `1px solid ${bd}`, borderRadius: 8, background: dark ? '#060a06' : '#fff' }}>
                <div style={{ fontSize: 9, color: t3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: g, letterSpacing: -0.5 }}>{s.val}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 9, color: t3, marginTop: 8, fontFamily: 'monospace' }}>FASTAPI /api/community/stats</div>
        </CableSection>

        <CableSection id="s-lb" title="Leaderboard" side="right" gpuImage="rtx_3090_top.png" gpuName="RTX 3090" topCable="7_pin_cable.png" {...sp}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <input value={lbQ} onChange={e => setLbQ(e.target.value)} placeholder="Search..."
              style={{ padding: '5px 9px', border: `1px solid ${bd}`, borderRadius: 6, fontSize: 12, background: dark ? '#060a06' : '#fff', color: t, outline: 'none', width: 120 }} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 280 }}>
              <thead><tr>{['#', 'User', 'Batches', 'Earned'].map((h, i) => (
                <th key={h} style={{ fontSize: 9, color: t3, textAlign: i >= 2 ? 'right' : 'left', padding: '5px 8px', borderBottom: `1px solid ${bd}`, fontWeight: 400, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
              ))}</tr></thead>
              <tbody>
                {filteredLB.map((e, i) => (
                  <tr key={e.user_id} style={{ background: i % 2 === 0 ? 'transparent' : (dark ? 'rgba(255,255,255,.015)' : 'rgba(0,0,0,.015)') }}>
                    <td style={{ padding: '7px 8px', borderBottom: `1px solid ${bd}`, fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: i === 0 ? '#a07000' : i === 1 ? '#888' : i === 2 ? '#8c5020' : t3, width: 20 }}>{i + 1}</td>
                    <td style={{ padding: '7px 8px', borderBottom: `1px solid ${bd}`, fontSize: 12, color: t }}>{e.username || e.user_id.slice(0, 8)}</td>
                    <td style={{ padding: '7px 8px', borderBottom: `1px solid ${bd}`, fontSize: 11, textAlign: 'right', fontFamily: 'monospace', color: t2 }}>{e.contributions}</td>
                    <td style={{ padding: '7px 8px', borderBottom: `1px solid ${bd}`, fontSize: 11, textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: g }}>${e.score.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CableSection>

        <CableSection id="s-tasks" title="Active tasks" side="left" gpuImage="rtx_5090_top.png" gpuName="RTX 5090" topCable="10_pin_cable.png" {...sp}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {displayTasks.map(task => {
              const done = task.total_batches - task.queued_batches
              const pct = Math.round(done / task.total_batches * 100)
              return (
                <div key={task.id} style={{ padding: 13, border: `1px solid ${bd}`, borderRadius: 8, background: dark ? '#060a06' : '#fff', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 600, color: g, background: `${g}18`, padding: '2px 6px', borderRadius: 20, border: `1px solid ${g}30` }}>
                    <div style={{ width: 3, height: 3, borderRadius: '50%', background: g, animation: 'blink 1.5s infinite' }} />LIVE
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: t, marginBottom: 3, paddingRight: 44 }}>{task.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: t3, marginBottom: 7 }}>
                    <span>{task.model_type} · {task.framework}</span>
                    <span style={{ color: g, fontWeight: 600, fontFamily: 'monospace' }}>${task.price_per_batch}/batch</span>
                  </div>
                  <div style={{ height: 2, background: dark ? '#1a2e1a' : '#e4e4e7', borderRadius: 2, marginBottom: 5 }}>
                    <div style={{ height: 2, background: g, width: `${pct}%`, borderRadius: 2 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: t3 }}>
                    <span>{done}/{task.total_batches} done</span><span>{pct}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CableSection>

        <CableSection id="s-join" title="Join the network" side="right" gpuImage="gtx_1080_top.png" gpuName="GTX 1080" topCable="12_pin_cable.png" {...sp} isLast>
          <p style={{ fontSize: 13, color: t2, lineHeight: 1.6, marginBottom: 16 }}>
            Set your own price for tasks, or get paid to complete them. The network works for everyone.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={() => router.push('/products')} style={{ padding: '11px 0', background: g, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Become a Worker</button>
            <button onClick={() => router.push('/login')} style={{ padding: '11px 0', background: 'none', color: t, border: `1px solid ${bd}`, borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Provider Portal</button>
          </div>
        </CableSection>

      </div>

      {/* ── FOOTER ── */}
      <footer style={{ marginTop: 48, borderTop: `1px solid ${bd}`, background: bg, position: 'relative', overflow: 'hidden' }}>

        {/* GPU side view background strip */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <img src="/gpus/gtx_1080_side.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%', mixBlendMode: dark ? 'luminosity' : 'multiply', opacity: dark ? 0.18 : 0.12 }} />

          {/* Footer content */}
          <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(28px,4vw,48px) clamp(20px,5vw,56px) clamp(20px,3vw,32px)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'clamp(24px,3vw,48px)', marginBottom: 36 }}>

              {/* Brand */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 15, fontWeight: 700, color: t, marginBottom: 10, cursor: 'pointer' }} onClick={() => router.push('/community')}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5, width: 15, height: 15 }}>
                    {[0,1,2,3].map(i => <div key={i} style={{ borderRadius: 2, background: g, opacity: i===1||i===2?.35:1 }} />)}
                  </div>
                  decengpu
                </div>
                <p style={{ fontSize: 12, color: t3, lineHeight: 1.7, maxWidth: 180 }}>Decentralised GPU compute for AI training. Pay per batch, not per hour.</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  {['𝕏', 'in', '⌂'].map(s => (
                    <a key={s} href="#" style={{ width: 28, height: 28, border: `1px solid ${bd}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: t2, textDecoration: 'none', background: bg2 }}>{s}</a>
                  ))}
                </div>
              </div>

              {/* Links */}
              {[
                { h: 'Platform', links: [{ l: 'Community', href: '/community' }, { l: 'Products', href: '/products' }, { l: 'About', href: '/about' }, { l: 'Docs', href: '#' }, { l: 'Blog', href: '#' }] },
                { h: 'Company', links: [{ l: 'About us', href: '/about' }, { l: 'Careers', href: '#' }, { l: 'Press', href: '#' }] },
                { h: 'Legal', links: [{ l: 'Terms of service', href: '#' }, { l: 'Privacy policy', href: '#' }, { l: 'Cookie policy', href: '#' }] },
              ].map(col => (
                <div key={col.h}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: t3, marginBottom: 12 }}>{col.h}</div>
                  {col.links.map(lk => (
                    <a key={lk.l} href={lk.href} onClick={e => { if (lk.href !== '#') { e.preventDefault(); router.push(lk.href) } }}
                      style={{ display: 'block', fontSize: 13, color: t2, textDecoration: 'none', marginBottom: 8, cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.color = t)}
                      onMouseLeave={e => (e.currentTarget.style.color = t2)}>
                      {lk.l}
                    </a>
                  ))}
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: bd, marginBottom: 0 }} />
          </div>
        </div>

        {/* Cable bunch + copyright */}
        <div style={{ background: bg2, position: 'relative' }}>
          {/* SVG cables */}
          <svg width="100%" height="56" viewBox="0 0 1000 56" preserveAspectRatio="none" style={{ display: 'block' }}>
            {[80,150,230,310,380,440,510,580,650,720,800,870,940].map((x, i) => (
              <g key={i}>
                <path d={`M${x},0 C${x + (i%2===0?10:-10)},20 ${x + (i%2===0?-8:8)},38 ${x},56`} stroke={bd} strokeWidth={i % 3 === 0 ? 6 : 4} fill="none" strokeLinecap="round" />
                <path d={`M${x},0 C${x + (i%2===0?10:-10)},20 ${x + (i%2===0?-8:8)},38 ${x},56`} stroke={g} strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.4" />
              </g>
            ))}
          </svg>
          {/* Cable image overlay */}
          <div style={{ position: 'relative', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/cables/bunch_of_cables.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: dark ? 0.35 : 0.2 }} />
            <div style={{ position: 'relative', zIndex: 2, fontSize: 11, color: t3, fontFamily: 'monospace', textAlign: 'center', padding: '0 16px' }}>
              © 2026 GPUmesh · decengpu.in · Built on Solana · Pay per batch, not per hour
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
        * { box-sizing: border-box; margin: 0; padding: 0 }
        @media (max-width: 640px) {
          #s-how > div, #s-stats > div, #s-lb > div, #s-tasks > div, #s-join > div { width: 88% !important; }
        }
      `}</style>
    </div>
  )
}