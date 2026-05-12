'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navbar, { useTheme } from '@/components/Navbar'

export default function AboutPage() {
  const router = useRouter()
  const { dark, toggleDark, accentIdx, setAccent, accent } = useTheme()
  const g = accent.g
  const bg = dark ? '#060a06' : '#fff'
  const bg2 = dark ? '#0d140d' : '#f8faf8'
  const bg3 = dark ? '#111a11' : '#f0f4f0'
  const b = dark ? '#1a2e1a' : '#e2e8e2'
  const t = dark ? '#e8f5e8' : '#0a140a'
  const t2 = dark ? '#7ab87a' : '#3d5c3d'
  const t3 = dark ? '#4a7a4a' : '#8aaa8a'

  return (
    <div style={{ background: bg, color: t, fontFamily: 'system-ui,sans-serif', minHeight: '100vh' }}>
      <Navbar dark={dark} toggleDark={toggleDark} accentIdx={accentIdx} setAccent={setAccent} accent={accent} />

      {/* HERO — full width statement */}
      <section style={{ padding: 'clamp(60px,8vw,120px) clamp(20px,6vw,80px)', borderBottom: `1px solid ${b}`, position: 'relative', overflow: 'hidden' }}>
        {/* Background grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${b} 1px, transparent 1px), linear-gradient(90deg, ${b} 1px, transparent 1px)`, backgroundSize: '40px 40px', opacity: .4, zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', border: `1px solid ${g}40`, borderRadius: 20, fontSize: 11, color: g, marginBottom: 24, background: `${g}10` }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: g }} />
            Rethinking GPU compute
          </div>
          <h1 style={{ fontSize: 'clamp(32px,6vw,72px)', fontWeight: 800, letterSpacing: -2, lineHeight: 1.0, color: t, marginBottom: 24 }}>
            The GPU on your desk is<br />
            <span style={{ color: g }}>more powerful</span> than you think
          </h1>
          <p style={{ fontSize: 'clamp(15px,2vw,19px)', color: t2, lineHeight: 1.7, maxWidth: 640, margin: '0 auto 40px' }}>
            Every night, millions of GPUs sit idle — consuming power, generating heat, earning nothing. We built a network that changes that.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/products')} style={{ padding: '12px 28px', background: g, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Explore Products →
            </button>
            <button onClick={() => router.push('/community')} style={{ padding: '12px 28px', background: 'none', color: t, border: `1px solid ${b}`, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              View Network
            </button>
          </div>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section style={{ padding: 'clamp(48px,6vw,80px) clamp(20px,6vw,80px)', borderBottom: `1px solid ${b}`, background: bg2 }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 3, color: g, marginBottom: 12, fontWeight: 600 }}>The problem</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40, alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,36px)', fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, color: t, marginBottom: 20 }}>
                Renting a GPU costs<br /><span style={{ color: '#ef4444' }}>you per hour.</span><br />Whether you use it or not.
              </h2>
              <p style={{ fontSize: 14, color: t2, lineHeight: 1.8, marginBottom: 16 }}>
                Traditional GPU cloud providers — AWS, GCP, Lambda Labs — charge by the hour. You pay for the time the GPU is allocated to you, even during setup, idle waits, or debugging sessions.
              </p>
              <p style={{ fontSize: 14, color: t2, lineHeight: 1.8 }}>
                A single A100 costs <strong style={{ color: '#ef4444' }}>$3–$8 per hour</strong>. A training run that takes 48 hours? That's $144–$384. And if your script crashes after 40 hours, you paid for the crash too.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'AWS p3.2xlarge (V100)', price: '$3.06/hr', note: 'Pay when idle' },
                { label: 'GCP A100 40GB', price: '$3.67/hr', note: 'Pay during setup' },
                { label: 'Lambda Labs A100', price: '$1.99/hr', note: 'Pay if it crashes' },
                { label: 'RunPod H100', price: '$2.49/hr', note: 'Pay for dead time' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: `1px solid ${b}`, borderRadius: 8, background: bg }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: t }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>{r.note}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#ef4444', fontFamily: 'monospace' }}>{r.price}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* OUR APPROACH */}
      <section style={{ padding: 'clamp(48px,6vw,80px) clamp(20px,6vw,80px)', borderBottom: `1px solid ${b}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 3, color: g, marginBottom: 12, fontWeight: 600 }}>Our approach</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40, alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,36px)', fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, color: t, marginBottom: 20 }}>
                Set a price once.<br /><span style={{ color: g }}>Pay only for results.</span>
              </h2>
              <p style={{ fontSize: 14, color: t2, lineHeight: 1.8, marginBottom: 16 }}>
                With decengpu, you upload your encrypted dataset, split it into batches, and set a fixed USDC price per completed batch. That's it. You never pay for idle time, setup, or failures.
              </p>
              <p style={{ fontSize: 14, color: t2, lineHeight: 1.8, marginBottom: 24 }}>
                The community does the work. Each worker downloads one encrypted batch, trains locally, and submits gradients. You only pay when results arrive.
              </p>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {[
                  { stat: 'Pay per batch', sub: 'Not per hour' },
                  { stat: 'E2E encrypted', sub: 'Data never exposed' },
                  { stat: 'No idle cost', sub: 'Results only' },
                ].map(s => (
                  <div key={s.stat}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: g }}>{s.stat}</div>
                    <div style={{ fontSize: 12, color: t3 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: bg2, border: `1px solid ${b}`, borderRadius: 12, padding: 24, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: g }} />
              <div style={{ fontSize: 11, color: t3, fontFamily: 'monospace', marginBottom: 16 }}>EXAMPLE · 50 batch training job</div>
              {[
                { label: 'Dataset upload', desc: 'AES-256-GCM encrypted in browser', cost: 'Free' },
                { label: 'Batch 1 completed', desc: 'Worker trains locally, submits gradients', cost: '$1.50' },
                { label: 'Batches 2–49', desc: '48 more workers contribute compute', cost: '$72.00' },
                { label: 'Batch 50 completed', desc: 'Final gradient, model fully trained', cost: '$1.50' },
                { label: 'Crashes / idle time', desc: 'Failed batches auto-reassigned', cost: '$0.00' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: i < 4 ? `1px solid ${b}` : 'none' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: t }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: t3, marginTop: 2 }}>{item.desc}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: item.cost === '$0.00' ? t3 : g, flexShrink: 0 }}>{item.cost}</div>
                </div>
              ))}
              <div style={{ marginTop: 12, padding: '12px 0', borderTop: `2px solid ${g}`, display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: t }}>Total</div>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'monospace', color: g }}>$75.00</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOR WORKERS */}
      <section style={{ padding: 'clamp(48px,6vw,80px) clamp(20px,6vw,80px)', borderBottom: `1px solid ${b}`, background: bg2 }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 3, color: g, marginBottom: 12, fontWeight: 600 }}>For workers</div>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,36px)', fontWeight: 800, letterSpacing: -1, color: t, marginBottom: 40 }}>
            Your GPU earns while<br />you're not using it
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {[
              { icon: '🌙', title: 'Earn while you sleep', desc: 'Enable auto-allocate. Your desktop app picks up batches automatically, trains overnight, earns USDC by morning.' },
              { icon: '🌿', title: 'Save the environment', desc: 'Your GPU already uses power at idle. Training tasks make that power productive — no additional carbon footprint from new data centers.' },
              { icon: '🏆', title: 'Climb the leaderboard', desc: 'Every completed batch adds to your reputation score. Top contributors get priority allocation and feature placement on decengpu.in.' },
              { icon: '🔐', title: 'Privacy guaranteed', desc: 'You train on encrypted batches. You never see the raw data. Gradients are your only output. Fully end-to-end encrypted.' },
            ].map(c => (
              <div key={c.title} style={{ padding: 22, border: `1px solid ${b}`, borderRadius: 10, background: bg, position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{c.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: t, marginBottom: 8 }}>{c.title}</div>
                <p style={{ fontSize: 12, color: t2, lineHeight: 1.7 }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LEADERBOARD TEASER */}
      <section style={{ padding: 'clamp(48px,6vw,80px) clamp(20px,6vw,80px)', borderBottom: `1px solid ${b}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 48, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 3, color: g, marginBottom: 12, fontWeight: 600 }}>Recognition</div>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,36px)', fontWeight: 800, letterSpacing: -1, color: t, marginBottom: 16 }}>
              Rank high.<br />Get recognized.
            </h2>
            <p style={{ fontSize: 14, color: t2, lineHeight: 1.8, marginBottom: 24 }}>
              The leaderboard isn't just a number. Top contributors are featured on the network homepage, receive priority batch allocation, and build a verifiable on-chain reputation tied to their Phantom wallet.
            </p>
            <button onClick={() => router.push('/community#lb-sec')} style={{ padding: '10px 20px', background: g, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              View Leaderboard →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[
              { rank: 1, name: 'PrettyMonster', batches: 47, usdc: '$70.50', color: '#a07000' },
              { rank: 2, name: 'bubbles', batches: 38, usdc: '$57.00', color: '#888' },
              { rank: 3, name: 'gpu_wizard', batches: 31, usdc: '$46.50', color: '#8c5020' },
              { rank: 4, name: 'trainmaster', batches: 24, usdc: '$36.00', color: t3 },
              { rank: 5, name: 'solana_miner', batches: 19, usdc: '$28.50', color: t3 },
            ].map((w, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: `1px solid ${b}`, borderRadius: 8, background: bg2 }}>
                <span style={{ width: 24, fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: w.color }}>#{w.rank}</span>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${g}22`, border: `1px solid ${g}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: g }}>{w.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t }}>{w.name}</div>
                  <div style={{ fontSize: 11, color: t3 }}>{w.batches} batches completed</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: g }}>{w.usdc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(20px,6vw,80px)', background: dark ? '#030603' : '#0a140a', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle at 30% 50%, ${g}15 0%, transparent 60%), radial-gradient(circle at 70% 50%, ${g}08 0%, transparent 60%)` }} />
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 3, color: g, marginBottom: 16, fontWeight: 600 }}>Our mission</div>
          <h2 style={{ fontSize: 'clamp(28px,5vw,52px)', fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1, color: '#e8f5e8', marginBottom: 24 }}>
            Decentralise AI compute.<br />Democratise AI training.
          </h2>
          <p style={{ fontSize: 'clamp(14px,2vw,17px)', color: '#7ab87a', lineHeight: 1.8, marginBottom: 40 }}>
            Data centers consume 1–2% of global electricity. Most of it goes to GPUs sitting idle between jobs. Meanwhile, millions of consumer GPUs do the same in homes and offices worldwide. We connect the two — and make both sides better off.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 48 }}>
            {[
              { num: '2.5B+', label: 'Consumer GPUs worldwide sitting idle every night' },
              { num: '60%', label: 'Average GPU utilisation in cloud data centers' },
              { num: '$0', label: 'Data center dependency for decengpu providers' },
            ].map(s => (
              <div key={s.num} style={{ padding: 20, border: '1px solid rgba(22,163,74,.2)', borderRadius: 10, background: 'rgba(22,163,74,.05)' }}>
                <div style={{ fontSize: 'clamp(22px,4vw,36px)', fontWeight: 800, color: g, fontFamily: 'monospace', marginBottom: 8 }}>{s.num}</div>
                <div style={{ fontSize: 12, color: '#7ab87a', lineHeight: 1.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <button onClick={() => router.push('/login')} style={{ padding: '14px 32px', background: g, color: '#fff', border: 'none', borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            Join the network →
          </button>
        </div>
      </section>

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  )
}