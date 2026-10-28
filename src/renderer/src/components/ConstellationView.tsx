import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import type { WordViewModel } from '../../../shared/types'

const VW = 1000
const VH = 680

interface Zone {
  cx: number
  cy: number
  spread: number
  name: string
  color: string
}

const ZONES: Record<string, Zone> = {
  motion:      { cx: 140, cy: 135, spread: 75,  name: 'THE MOVERS',     color: '#f5e642' },
  cognition:   { cx: 500, cy:  95, spread: 88,  name: 'THE THINKERS',   color: '#00f5d4' },
  creation:    { cx: 860, cy: 135, spread: 75,  name: 'THE MAKERS',     color: '#42f587' },
  speech:      { cx: 100, cy: 350, spread: 72,  name: 'THE SPEAKERS',   color: '#f542d4' },
  technical:   { cx: 500, cy: 345, spread: 110, name: 'THE BUILDERS',   color: '#f5e642' },
  social:      { cx: 900, cy: 350, spread: 72,  name: 'THE CONNECTORS', color: '#00f5d4' },
  cooking:     { cx: 500, cy: 578, spread: 80,  name: 'THE ALCHEMISTS', color: '#f59e42' },
}

// Outer-ring creature wander path through all peripheral constellation zones
const CREATURE_PATH =
  'M 140,135 C 300,55 430,65 500,95 C 610,130 760,100 860,135 ' +
  'C 952,198 964,310 900,350 C 840,470 700,590 500,578 ' +
  'C 300,590 160,470 100,350 C 122,274 128,203 140,135 Z'
const CREATURE_LOOP_MS = 90_000
const CREATURE_STEPS = 900
// Caught stars twinkle in a few shared phases, each phase one glow layer over the static SVG
const TWINKLE_MS = 3000
const TWINKLE_PHASES = 4
// Creature and twinkle are stepped by a timer, not continuous animations: any running
// animation makes Chromium render a frame on every display refresh (~60% of a core here)
const TICK_MS = 100

function makeRng(seed: string): () => number {
  let h = 5381
  for (let i = 0; i < seed.length; i++) {
    h = (((h << 5) + h) ^ seed.charCodeAt(i)) | 0
  }
  return () => {
    h = (h ^ (h << 13)) | 0
    h = (h ^ (h >> 17)) | 0
    h = (h ^ (h << 5)) | 0
    return (h >>> 0) / 0xffffffff
  }
}

interface StarData {
  id: string
  word: WordViewModel
  x: number
  y: number
  category: string
  phase: number
}

interface EdgeData {
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
}

interface ConstellationViewProps {
  words: WordViewModel[]
  onCatch: (word: WordViewModel) => void
  onHover?: (word: WordViewModel) => void
  setAmbientCategory?: (category: string | null) => void
}

export function ConstellationView({ words, onCatch, onHover, setAmbientCategory }: ConstellationViewProps): React.JSX.Element {
  const [hovered, setHovered] = useState<StarData | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isGrabbing, setIsGrabbing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const creaturePathRef = useRef<SVGPathElement>(null)
  const creatureRef = useRef<HTMLDivElement>(null)
  const twinkleRefs = useRef<(HTMLDivElement | null)[]>([])
  // Where the SVG's "xMidYMid meet" puts the viewBox inside the container
  const [fit, setFit] = useState({ x: 0, y: 0, s: 1 })
  const isDragging = useRef(false)
  const hasDragged = useRef(false)
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 })

  const stars = useMemo<StarData[]>(() => {
    const twRng = makeRng('twinkle-params')
    return words.flatMap((word) => {
      const zone = ZONES[word.category]
      if (!zone) return []
      const rng = makeRng(word.id)
      const angle = rng() * Math.PI * 2
      // sqrt for uniform circular distribution (avoids central clustering)
      const dist = Math.sqrt(rng()) * zone.spread
      return [
        {
          id: word.id,
          word,
          x: zone.cx + Math.cos(angle) * dist,
          y: zone.cy + Math.sin(angle) * dist,
          category: word.category,
          phase: Math.floor(twRng() * TWINKLE_PHASES),
        },
      ]
    })
  }, [words])

  const edges = useMemo<EdgeData[]>(() => {
    const byCategory: Record<string, StarData[]> = {}
    for (const s of stars) {
      ;(byCategory[s.category] ??= []).push(s)
    }
    const result: EdgeData[] = []
    for (const [cat, catStars] of Object.entries(byCategory)) {
      const zone = ZONES[cat]
      if (!zone || catStars.length < 2) continue
      const cx = catStars.reduce((acc, s) => acc + s.x, 0) / catStars.length
      const cy = catStars.reduce((acc, s) => acc + s.y, 0) / catStars.length
      // Sort by angle from centroid to form a polygon ring
      const sorted = [...catStars].sort(
        (a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx)
      )
      // Outer polygon
      for (let i = 0; i < sorted.length; i++) {
        const j = (i + 1) % sorted.length
        result.push({ x1: sorted[i].x, y1: sorted[i].y, x2: sorted[j].x, y2: sorted[j].y, color: zone.color })
      }
      // Inner spokes from the most-central star to spread the constellation shape
      const hub = sorted.reduce((best, s) =>
        Math.hypot(s.x - cx, s.y - cy) < Math.hypot(best.x - cx, best.y - cy) ? s : best
      )
      const step = Math.max(1, Math.floor(sorted.length / 5))
      for (let i = 0; i < sorted.length; i += step) {
        if (sorted[i] !== hub) {
          result.push({ x1: hub.x, y1: hub.y, x2: sorted[i].x, y2: sorted[i].y, color: zone.color })
        }
      }
    }
    return result
  }, [stars])

  const bgStars = useMemo(() => {
    const rng = makeRng('bg-field-stars-seed')
    return Array.from({ length: 220 }, () => ({
      x: rng() * VW,
      y: rng() * VH,
      r: rng() * 0.85 + 0.15,
      opacity: rng() * 0.22 + 0.04,
    }))
  }, [])

  // Track the meet-fit so the creature layer lines up with the SVG
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const s = Math.min(width / VW, height / VH)
      setFit({ x: (width - VW * s) / 2, y: (height - VH * s) / 2, s })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Step the creature along its path and the twinkle phases; only while the window is focused
  useEffect(() => {
    const path = creaturePathRef.current
    const creature = creatureRef.current
    if (!path || !creature) return
    const length = path.getTotalLength()
    // Even spacing along the path keeps the speed constant
    const points = Array.from({ length: CREATURE_STEPS }, (_, i) =>
      path.getPointAtLength((length * i) / CREATURE_STEPS)
    )
    const start = performance.now()
    function tick(): void {
      const t = performance.now() - start
      const p = points[Math.floor(((t / CREATURE_LOOP_MS) % 1) * CREATURE_STEPS)]
      creature!.style.transform = `translate(${p.x}px, ${p.y}px)`
      twinkleRefs.current.forEach((layer, k) => {
        if (layer) layer.style.opacity = (0.35 + 0.35 * Math.cos(2 * Math.PI * (t / TWINKLE_MS + k / TWINKLE_PHASES))).toFixed(2)
      })
    }
    let timer: ReturnType<typeof setInterval> | undefined
    function run(): void {
      clearInterval(timer)
      if (document.hasFocus()) timer = setInterval(tick, TICK_MS)
    }
    tick()
    run()
    window.addEventListener('focus', run)
    window.addEventListener('blur', run)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', run)
      window.removeEventListener('blur', run)
    }
  }, [])

  // Drive category ambient from whichever constellation zone is hovered
  useEffect(() => {
    setAmbientCategory?.(hovered?.category ?? null)
  }, [hovered?.category, setAmbientCategory])

  // Non-passive wheel listener so we can preventDefault and prevent page scroll
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const rawDelta = Math.min(Math.abs(e.deltaY), 120) * Math.sign(e.deltaY)
      const factor = rawDelta < 0 ? 1.06 : 1 / 1.06
      setZoom(prevZoom => {
        const newZoom = Math.min(5, Math.max(0.4, prevZoom * factor))
        const actual = newZoom / prevZoom
        setPan(prev => ({
          x: mx + (prev.x - mx) * actual,
          y: my + (prev.y - my) * actual,
        }))
        return newZoom
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // Document-level mouse move/up for smooth drag outside container bounds
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const dx = e.clientX - dragStart.current.mx
      const dy = e.clientY - dragStart.current.my
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged.current = true
      if (hasDragged.current) {
        setPan({ x: dragStart.current.px + dx, y: dragStart.current.py + dy })
      }
    }
    const onUp = () => {
      if (isDragging.current) {
        isDragging.current = false
        setIsGrabbing(false)
      }
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    isDragging.current = true
    hasDragged.current = false
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y }
    setIsGrabbing(true)
  }, [pan])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [])

  const handleDoubleClick = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const BTN_ZOOM = 1.25
  const BTN_PAN = 100

  const stopPropDown = useCallback((e: React.MouseEvent) => e.stopPropagation(), [])

  const zoomIn = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const el = containerRef.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    const mx = width / 2
    const my = height / 2
    setZoom(prev => {
      const newZoom = Math.min(5, prev * BTN_ZOOM)
      const actual = newZoom / prev
      setPan(p => ({ x: mx + (p.x - mx) * actual, y: my + (p.y - my) * actual }))
      return newZoom
    })
  }, [])

  const zoomOut = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const el = containerRef.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    const mx = width / 2
    const my = height / 2
    setZoom(prev => {
      const newZoom = Math.max(0.4, prev / BTN_ZOOM)
      const actual = newZoom / prev
      setPan(p => ({ x: mx + (p.x - mx) * actual, y: my + (p.y - my) * actual }))
      return newZoom
    })
  }, [])

  const panBy = useCallback((dx: number, dy: number) => (e: React.MouseEvent) => {
    e.stopPropagation()
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }))
  }, [])

  const isTransformed = zoom !== 1 || pan.x !== 0 || pan.y !== 0

  const tooltipStyle = useMemo((): React.CSSProperties => {
    if (!hovered || !containerRef.current) return {}
    const rect = containerRef.current.getBoundingClientRect()
    const tw = 250
    const th = 105
    let x = tooltipPos.x + 18
    let y = tooltipPos.y - 12
    if (x + tw > rect.width - 8) x = tooltipPos.x - tw - 12
    if (y + th > rect.height - 8) y = tooltipPos.y - th - 6
    if (y < 8) y = 8
    return { left: x, top: y }
  }, [tooltipPos, hovered])

  return (
    <div
      className="constellation-view"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      style={{ cursor: isGrabbing ? 'grabbing' : 'grab' }}
    >
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        className="constellation-svg"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          // No will-change: it freezes the layer's raster at 1x, so zooming in looks blurry
          transformOrigin: '0 0',
        }}
      >
        <defs>
          <filter id="csf-star-glow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Never drawn; only measured to build the creature's keyframes */}
          <path ref={creaturePathRef} d={CREATURE_PATH} />
        </defs>

        {/* Decorative field stars */}
        <g>
          {bgStars.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.opacity} />
          ))}
        </g>

        {/* Constellation lines */}
        <g>
          {edges.map((e, i) => (
            <line
              key={i}
              x1={e.x1} y1={e.y1}
              x2={e.x2} y2={e.y2}
              stroke={e.color}
              strokeWidth="0.65"
              opacity="0.13"
            />
          ))}
        </g>

        {/* Zone name labels */}
        {Object.entries(ZONES).map(([cat, zone]) => (
          <text
            key={cat}
            x={zone.cx}
            y={zone.cy + zone.spread + 17}
            textAnchor="middle"
            fill={zone.color}
            opacity="0.28"
            fontSize="8.5"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight="700"
            letterSpacing="0.18em"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {zone.name}
          </text>
        ))}

        {/* Verb stars */}
        {stars.map((star) => {
          const caught = star.word.isCaught
          const zone = ZONES[star.category]
          const color = zone?.color ?? '#ffffff'
          const isHov = hovered?.id === star.id
          const r = caught ? (isHov ? 7 : 4.5) : isHov ? 3.5 : 1.8

          return (
            <g key={star.id}>
              {caught && (
                <circle
                  cx={star.x} cy={star.y}
                  r={isHov ? 14 : 9}
                  fill={color}
                  opacity={isHov ? 0.22 : 0.11}
                  style={{ pointerEvents: 'none' }}
                />
              )}
              <circle
                cx={star.x}
                cy={star.y}
                r={r}
                fill={caught ? color : '#c0c0c0'}
                opacity={caught ? (isHov ? 1 : 0.9) : isHov ? 0.75 : 0.28}
                filter={caught ? 'url(#csf-star-glow)' : undefined}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => { setHovered(star); onHover?.(star.word) }}
                onMouseLeave={() => setHovered(null)}
                onClick={() => { if (!hasDragged.current) onCatch(star.word) }}
              />
            </g>
          )
        })}

      </svg>

      {/* Twinkle glows and the wandering creature live outside the SVG on layers mapped to
          viewBox units: changing their opacity/transform only recomposites, while changing
          anything inside the SVG re-rasterises all of it (blur filters included). */}
      <div
        className="constellation-creature-layer"
        style={{
          width: VW,
          height: VH,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) translate(${fit.x}px, ${fit.y}px) scale(${fit.s})`,
        }}
      >
        {Array.from({ length: TWINKLE_PHASES }, (_, k) => (
          <div key={k} className="constellation-twinkle" ref={(el) => { twinkleRefs.current[k] = el }}>
            {stars
              .filter((star) => star.word.isCaught && star.phase === k)
              .map((star) => (
                <span key={star.id} style={{ left: star.x, top: star.y, color: ZONES[star.category]?.color }} />
              ))}
          </div>
        ))}
        <div className="constellation-creature" ref={creatureRef}>
          <span>◈</span>
        </div>
      </div>

      {/* Control pad */}
      <div className="constellation-controls" onMouseDown={stopPropDown}>
        <div className="constellation-controls-zoom">
          <button className="csctl-btn" onClick={zoomIn} title="Zoom in">+</button>
          <button className="csctl-btn" onClick={zoomOut} title="Zoom out">−</button>
        </div>
        <div className="constellation-controls-dpad">
          <button className="csctl-btn csctl-up"    onClick={panBy(0, BTN_PAN)}  title="Pan up">▲</button>
          <button className="csctl-btn csctl-left"  onClick={panBy(BTN_PAN, 0)}  title="Pan left">◀</button>
          <button
            className={`csctl-btn csctl-center${isTransformed ? ' active' : ''}`}
            onClick={(e) => { e.stopPropagation(); setZoom(1); setPan({ x: 0, y: 0 }) }}
            title="Reset view"
          >⊹</button>
          <button className="csctl-btn csctl-right" onClick={panBy(-BTN_PAN, 0)} title="Pan right">▶</button>
          <button className="csctl-btn csctl-down"  onClick={panBy(0, -BTN_PAN)} title="Pan down">▼</button>
        </div>
      </div>

      {/* Hint */}
      <div className="constellation-hint" style={{ opacity: isTransformed ? 0 : 1 }}>
        scroll to zoom · drag to pan · double-click to reset
      </div>

      {/* Hover tooltip */}
      {hovered && (
        <div className="constellation-tooltip" style={tooltipStyle}>
          <div className="constellation-tooltip-top">
            <span className="constellation-tooltip-emoji">{hovered.word.emoji}</span>
            <div className="constellation-tooltip-info">
              <span className="constellation-tooltip-word">{hovered.word.word}</span>
              <span
                className="constellation-tooltip-cat"
                style={{ color: ZONES[hovered.category]?.color ?? '#888' }}
              >
                {hovered.category}
              </span>
            </div>
            {hovered.word.isCaught && (
              <span className="constellation-tooltip-count">×{hovered.word.catchCount}</span>
            )}
          </div>
          <div className="constellation-tooltip-desc">{hovered.word.description}</div>
          <div className={`constellation-tooltip-action${hovered.word.isCaught ? ' is-caught' : ''}`}>
            {hovered.word.isCaught ? '★ caught — click to catch again' : '↯ click to catch'}
          </div>
        </div>
      )}
    </div>
  )
}
