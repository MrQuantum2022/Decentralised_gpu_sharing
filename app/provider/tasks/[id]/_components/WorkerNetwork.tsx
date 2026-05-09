'use client'

import { useEffect, useRef } from 'react'

export interface WorkerNode {
  id: string
  gpu: string
  batches: number
  status: 'active' | 'warn' | 'idle'
  position: [number, number, number]
}

interface Props {
  workers: WorkerNode[]
  selectedId: string | null
  onSelectWorker: (id: string) => void
  dark: boolean
}

export function WorkerNetwork({ workers, selectedId, onSelectWorker, dark }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<any>(null)

  useEffect(() => {
    
      const canvas = canvasRef.current
      if (!canvas) return

      // Wait for Three.js to be available
    let animId: number
        const THREE = (window as any).THREE
        if (!THREE) return

    const W = canvas.parentElement?.clientWidth || 500
    const H = 320
    canvas.width = W
    canvas.height = H

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
    renderer.setSize(W, H)
    renderer.setClearColor(dark ? 0x0A0A0A : 0xFAFAFA, 1)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100)
    camera.position.set(0, 0, 5)

    // Core node
    const coreMat = new THREE.MeshBasicMaterial({ color: dark ? 0x22C55E : 0x16A34A })
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 32), coreMat)
    scene.add(core)

    // Orbiting ring
    const ringMat = new THREE.MeshBasicMaterial({
      color: dark ? 0x22C55E : 0x16A34A,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
    })
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.26, 0.30, 64), ringMat)
    scene.add(ring)

    // Worker nodes
    const nodeMeshes: any[] = []
    const edges: { from: any; to: any }[] = []
    const packets: { mesh: any; from: any; to: any; t: number; spd: number }[] = []

    workers.forEach((w) => {
      const col =
        w.status === 'active'
          ? dark ? 0x22C55E : 0x16A34A
          : w.status === 'warn'
          ? dark ? 0xF59E0B : 0xD97706
          : dark ? 0x333333 : 0xD1D1D6
      const size = w.status === 'active' ? 0.09 : 0.07
      const mat = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: w.status === 'idle' ? 0.35 : 1,
      })
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 16, 16), mat)
      mesh.position.set(...w.position)
      mesh.userData = { workerId: w.id }
      scene.add(mesh)
      nodeMeshes.push(mesh)

      if (w.status !== 'idle') {
        const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(...w.position)]
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({
            color: dark ? 0x22C55E : 0x16A34A,
            transparent: true,
            opacity: 0.1,
          })
        )
        scene.add(line)
        edges.push({
          from: new THREE.Vector3(...w.position),
          to: new THREE.Vector3(0, 0, 0),
        })
      }
    })

    // Raycaster for click
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    function onClick(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObjects(nodeMeshes)
      if (hits.length > 0) {
        const id = hits[0].object.userData.workerId
        if (id) onSelectWorker(id)
      }
    }
    canvas.addEventListener('click', onClick)

    function spawnPacket() {
      if (!edges.length) return
      const e = edges[Math.floor(Math.random() * edges.length)]
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 8, 8),
        new THREE.MeshBasicMaterial({
          color: dark ? 0x22C55E : 0x16A34A,
          transparent: true,
          opacity: 0.85,
        })
      )
      mesh.position.copy(e.from)
      scene.add(mesh)
      packets.push({ mesh, from: e.from.clone(), to: e.to.clone(), t: 0, spd: 0.016 + Math.random() * 0.012 })
    }

    let orb = true
    let foc = false
    let angle = 0
    let t = 0

    sceneRef.current = {
      setOrbit: (v: boolean) => { orb = v },
      setFocus: (v: boolean) => { foc = v },
      resetCam: () => { camera.position.set(0, 0, 5); angle = 0 },
      highlightNode: (id: string | null) => {
        nodeMeshes.forEach((m) => {
          const wid = m.userData.workerId
          m.material.opacity = id === null
            ? (workers.find(w => w.id === wid)?.status === 'idle' ? 0.35 : 1)
            : wid === id ? 1 : 0.12
        })
      },
    }

    function animate() {
      animId = requestAnimationFrame(animate)
      t += 0.008

      if (orb) {
        angle += 0.004
        camera.position.x = Math.sin(angle) * 5
        camera.position.z = Math.cos(angle) * 5
        camera.position.y = Math.sin(angle * 0.3) * 1.2
      }
      if (foc) camera.position.lerp(new THREE.Vector3(0, 0, 2.5), 0.05)
      camera.lookAt(0, 0, 0)

      core.scale.setScalar(1 + Math.sin(t * 2) * 0.04)
      ring.rotation.z = t * 0.5
      ring.rotation.x = Math.sin(t * 0.3) * 0.3

      nodeMeshes.forEach((m, i) => {
        if (workers[i]?.status === 'active') {
          m.scale.setScalar(1 + Math.sin(t * 3 + i) * 0.1)
        }
      })

      if (Math.random() < 0.03) spawnPacket()

      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i]
        p.t += p.spd
        p.mesh.position.lerpVectors(p.from, p.to, p.t)
        p.mesh.material.opacity = 1 - p.t
        if (p.t >= 1) { scene.remove(p.mesh); packets.splice(i, 1) }
      }

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      canvas.removeEventListener('click', onClick)
      renderer.dispose()
    }
  }, [dark, workers])

  // Highlight selected node
  useEffect(() => {
    sceneRef.current?.highlightNode(selectedId)
    const timer = selectedId
      ? setTimeout(() => sceneRef.current?.highlightNode(null), 2500)
      : undefined
    return () => clearTimeout(timer)
  }, [selectedId])

  return (
    <div style={{ position: 'relative' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />
      {/* Controls overlay */}
      <div style={{
        position: 'absolute', top: 10, right: 10,
        display: 'flex', gap: 6,
      }}>
        {[
          { label: 'Orbit', key: 'o' },
          { label: 'Focus', key: 'f' },
          { label: 'Reset', key: 'r' },
        ].map(({ label, key }) => (
          <button
            key={key}
            onClick={() => {
              if (key === 'o') sceneRef.current?.setOrbit(true)
              if (key === 'f') sceneRef.current?.setFocus(true)
              if (key === 'r') sceneRef.current?.resetCam()
            }}
            style={{
              padding: '4px 10px',
              borderRadius: 8,
              border: '1px solid var(--border2)',
              background: 'var(--bg2)',
              color: 'var(--text2)',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'var(--font)',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}