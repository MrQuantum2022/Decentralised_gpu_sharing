'use client'

import { useRouter } from 'next/navigation'
import Navbar, { useTheme } from '@/components/Navbar'

export default function ProductsPage() {
  const router = useRouter()
  const { dark, toggleDark, accentIdx, setAccent, accent } = useTheme()
  const g = accent.g
  const bg = dark ? '#060a06' : '#fff'
  const bg2 = dark ? '#0d140d' : '#f8faf8'
  const b = dark ? '#1a2e1a' : '#e2e8e2'
  const t = dark ? '#e8f5e8' : '#0a140a'
  const t2 = dark ? '#7ab87a' : '#3d5c3d'
  const t3 = dark ? '#4a7a4a' : '#8aaa8a'

  return (
    <div style={{ background: bg, color: t, fontFamily: 'system-ui,sans-serif', minHeight: '100vh' }}>
      <Navbar dark={dark} toggleDark={toggleDark} accentIdx={accentIdx} setAccent={setAccent} accent={accent} />

      {/* Header */}
      <section style={{ padding: 'clamp(48px,6vw,80px) clamp(20px,6vw,80px)', borderBottom: `1px solid ${b}`, textAlign: 'center' }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 3, color: g, marginBottom: 12, fontWeight: 600 }}>Products</div>
        <h1 style={{ fontSize: 'clamp(28px,5vw,52px)', fontWeight: 800, letterSpacing: -1.5, color: t, marginBottom: 16 }}>
          Two sides of the network
        </h1>
        <p style={{ fontSize: 16, color: t2, maxWidth: 500, margin: '0 auto' }}>
          Whether you have compute to offer or a model to train — we have the tool for you.
        </p>
      </section>

      {/* Products grid */}
      <section style={{ padding: 'clamp(40px,6vw,72px) clamp(20px,6vw,80px)', borderBottom: `1px solid ${b}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>

          {/* Worker Desktop App */}
          <div style={{ border: `1px solid ${b}`, borderRadius: 14, overflow: 'hidden', background: bg }}>
            <div style={{ height: 200, background: dark ? '#0a1a0a' : '#e8f5e8', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle at 50% 50%, ${g}20 0%, transparent 70%)` }} />
              {/* Mock app UI */}
              <div style={{ width: 220, background: dark ? '#111a11' : '#fff', border: `1px solid ${b}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,.2)' }}>
                <div style={{ background: dark ? '#0d140d' : '#f0f4f0', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: `1px solid ${b}` }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, width: 11, height: 11 }}>{[0,1,2,3].map(i => <div key={i} style={{ borderRadius: 1.5, background: g, opacity: i===1||i===2?.35:1 }} />)}</div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: t }}>GPUmesh</span>
                </div>
                <div style={{ padding: 10 }}>
                  <div style={{ fontSize: 9, color: t3, marginBottom: 6 }}>PAID BATCHES (2)</div>
                  {[{n:'ResNet Training',p:'$1.50/batch'},{n:'GPT-2 Fine-tune',p:'$2.00/batch'}].map(task => (
                    <div key={task.n} style={{ padding: '6px 8px', border: `1px solid ${b}`, borderRadius: 5, marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 9, color: t, fontWeight: 500 }}>{task.n}</span>
                      <span style={{ fontSize: 9, color: g, fontWeight: 600 }}>{task.p}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 8, padding: '5px 8px', background: g, borderRadius: 5, textAlign: 'center', fontSize: 9, color: '#fff', fontWeight: 600 }}>Accept Batch</div>
                </div>
              </div>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ padding: '3px 8px', background: `${g}18`, border: `1px solid ${g}30`, borderRadius: 20, fontSize: 10, color: g, fontWeight: 600 }}>Worker</div>
                <div style={{ padding: '3px 8px', background: bg2, border: `1px solid ${b}`, borderRadius: 20, fontSize: 10, color: t3 }}>Desktop App</div>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -.5, color: t, marginBottom: 10 }}>GPUmesh Desktop</h2>
              <p style={{ fontSize: 13, color: t2, lineHeight: 1.7, marginBottom: 20 }}>
                Connect your GPU to the network. Browse available training tasks, accept batches, train locally, and earn USDC. Auto-allocate mode keeps you earning 24/7.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {['Phantom wallet integration for instant USDC payouts','Auto-allocate batches while you sleep','Real-time training progress with stage tracker','Works on Windows, Mac, and Linux'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: t2 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: `${g}20`, border: `1px solid ${g}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 9, color: g }}>✓</div>
                    {f}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={{ flex: 1, padding: '10px 16px', background: g, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Download for Linux
                </button>
                <button style={{ padding: '10px 14px', background: 'none', color: t2, border: `1px solid ${b}`, borderRadius: 7, fontSize: 12, cursor: 'pointer' }}>
                  .exe
                </button>
                <button style={{ padding: '10px 14px', background: 'none', color: t2, border: `1px solid ${b}`, borderRadius: 7, fontSize: 12, cursor: 'pointer' }}>
                  .dmg
                </button>
              </div>
            </div>
          </div>

          {/* Provider Portal */}
          <div style={{ border: `1px solid ${b}`, borderRadius: 14, overflow: 'hidden', background: bg }}>
            <div style={{ height: 200, background: dark ? '#0a1a0a' : '#e8f5e8', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle at 50% 50%, ${g}20 0%, transparent 70%)` }} />
              {/* Mock portal UI */}
              <div style={{ width: 240, background: dark ? '#111a11' : '#fff', border: `1px solid ${b}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,.2)' }}>
                <div style={{ background: dark ? '#0d140d' : '#f0f4f0', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${b}` }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: t }}>GPULEND.IO</span>
                  <span style={{ fontSize: 9, padding: '2px 6px', background: `${g}20`, color: g, borderRadius: 4, fontWeight: 600 }}>My Tasks</span>
                </div>
                <div style={{ padding: 10 }}>
                  {[{n:'ResNet-50',pct:62,e:'$34.50'},{n:'GPT-2 NLP',pct:38,e:'$16.00'}].map(task => (
                    <div key={task.n} style={{ padding: '7px 0', borderBottom: `1px solid ${b}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 9, fontWeight: 600, color: t }}>{task.n}</span>
                        <span style={{ fontSize: 9, color: g, fontWeight: 600 }}>{task.e} earned</span>
                      </div>
                      <div style={{ height: 2, background: dark ? '#1a2e1a' : '#e2e8e2', borderRadius: 2 }}>
                        <div style={{ height: 2, background: g, width: `${task.pct}%` }} />
                      </div>
                      <div style={{ fontSize: 8, color: t3, marginTop: 2 }}>{task.pct}% complete</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ padding: '3px 8px', background: `${g}18`, border: `1px solid ${g}30`, borderRadius: 20, fontSize: 10, color: g, fontWeight: 600 }}>Provider</div>
                <div style={{ padding: '3px 8px', background: bg2, border: `1px solid ${b}`, borderRadius: 20, fontSize: 10, color: t3 }}>Web Portal</div>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -.5, color: t, marginBottom: 10 }}>GPULEND Portal</h2>
              <p style={{ fontSize: 13, color: t2, lineHeight: 1.7, marginBottom: 20 }}>
                Upload your training dataset, configure batch pricing, and watch the network train your model. Real-time dashboard with 3D worker visualization and payment tracking.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {['AES-256-GCM client-side dataset encryption','Set price per batch in USDC — pay only for results','Live batch map and worker network visualization','Download payment CSV for all contributors'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: t2 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: `${g}20`, border: `1px solid ${g}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 9, color: g }}>✓</div>
                    {f}
                  </div>
                ))}
              </div>
              <button onClick={() => router.push('/login')} style={{ width: '100%', padding: '10px 16px', background: g, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Launch Provider Portal →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section style={{ padding: 'clamp(40px,6vw,72px) clamp(20px,6vw,80px)', borderBottom: `1px solid ${b}`, background: bg2 }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 3, color: g, marginBottom: 12, fontWeight: 600, textAlign: 'center' }}>Comparison</div>
          <h2 style={{ fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, letterSpacing: -1, color: t, marginBottom: 32, textAlign: 'center' }}>decengpu vs traditional cloud</h2>
          <div style={{ border: `1px solid ${b}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: bg }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${b}`, fontSize: 11, color: t3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Feature</div>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${b}`, borderLeft: `1px solid ${b}`, fontSize: 12, fontWeight: 700, color: '#ef4444', textAlign: 'center' }}>Traditional Cloud</div>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${b}`, borderLeft: `1px solid ${b}`, fontSize: 12, fontWeight: 700, color: g, textAlign: 'center' }}>decengpu</div>
            </div>
            {[
              ['Pricing model', 'Per hour (idle or not)', 'Per completed batch'],
              ['Failed run cost', 'Full price charged', 'Zero — reassigned free'],
              ['Data privacy', 'Uploaded to their servers', 'E2E encrypted, never exposed'],
              ['Setup time', '~15 minutes + config', 'Upload & go'],
              ['Minimum spend', '$10–$50 minimums', 'Any amount'],
              ['Payment', 'Credit card, monthly invoice', 'USDC, instant per batch'],
            ].map(([feat, bad, good], i) => (
              <div key={feat} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: i % 2 === 0 ? bg : bg2 }}>
                <div style={{ padding: '11px 16px', borderBottom: `1px solid ${b}`, fontSize: 12, color: t }}>{feat}</div>
                <div style={{ padding: '11px 16px', borderBottom: `1px solid ${b}`, borderLeft: `1px solid ${b}`, fontSize: 12, color: '#ef4444', textAlign: 'center' }}>{bad}</div>
                <div style={{ padding: '11px 16px', borderBottom: `1px solid ${b}`, borderLeft: `1px solid ${b}`, fontSize: 12, color: g, textAlign: 'center', fontWeight: 500 }}>{good}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: 'clamp(48px,6vw,80px) clamp(20px,6vw,80px)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 800, letterSpacing: -1, color: t, marginBottom: 16 }}>Ready to get started?</h2>
        <p style={{ fontSize: 15, color: t2, marginBottom: 32, maxWidth: 440, margin: '0 auto 32px' }}>
          Join thousands of workers earning USDC and hundreds of providers training models.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button style={{ padding: '12px 28px', background: g, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Download Desktop App
          </button>
          <button onClick={() => router.push('/login')} style={{ padding: '12px 28px', background: 'none', color: t, border: `1px solid ${b}`, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Launch Provider Portal
          </button>
        </div>
      </section>

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  )
}