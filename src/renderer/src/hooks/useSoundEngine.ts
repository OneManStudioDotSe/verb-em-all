/**
 * Procedural sound engine for verb-em-all.
 * All audio is synthesised in real time using Web Audio API — zero audio files.
 *
 * Sounds:
 *  - playHover  : 140ms soft preview tone unique to the word
 *  - playCatch  : 1.8s "word spell" — FM bloom + arpeggio + shimmer tail
 *  - setAmbient : per-category background drone (for Cosmos view)
 */

import { useRef, useState, useCallback, useEffect } from 'react'
import type { WordViewModel } from '../../../shared/types'

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

// Harmonic scale intervals per category (frequency ratios from the fundamental)
const CAT_SCALES: Record<string, number[]> = {
  motion:      [1, 1.125, 1.25,   1.5,   1.667, 2,     2.25  ], // major pentatonic
  cognition:   [1, 1.125, 1.2,    1.333, 1.5,   1.8,   2     ], // Pythagorean
  creation:    [1, 1.125, 1.25,   1.414, 1.5,   1.875, 2     ], // Lydian (raised 4th)
  speech:      [1, 1.067, 1.2,    1.333, 1.422, 1.6,   2     ], // Phrygian
  technical:   [1, 2,     4,      8,     3,     6,     16    ], // pure integer harmonics
  social:      [1, 1.25,  1.5,    2,     2.5,   3,     4     ], // overtone series
  archaic:     [1, 1.053, 1.185,  1.333, 1.5,   1.6,   2     ], // Dorian
  cooking:     [1, 1.122, 1.26,   1.498, 1.682, 1.888, 2     ], // whole tone
  destruction: [1, 1.059, 1.414,  1.498, 1.587, 1.888, 2     ], // tritone-heavy
}

// Category waveform for arpeggio notes (affects timbre character)
const CAT_WAVEFORMS: Record<string, OscillatorType> = {
  motion:      'sine',
  cognition:   'sine',
  creation:    'triangle',
  speech:      'sine',
  technical:   'square',
  social:      'sine',
  archaic:     'sine',
  cooking:     'triangle',
  destruction: 'sawtooth',
}

// Arpeggio direction: 1 = ascending, -1 = descending, 0 = alternating
const CAT_ARP_DIR: Record<string, number> = {
  motion:      1,
  cognition:   0,
  creation:    1,
  speech:      0,
  technical:   1,
  social:      1,
  archaic:    -1,
  cooking:     0,
  destruction:-1,
}

// Reverb send amount (0 = dry, 1 = full wet)
const CAT_REVERB: Record<string, number> = {
  motion:      0.42,
  cognition:   0.80,
  creation:    0.65,
  speech:      0.55,
  technical:   0.08,
  social:      0.48,
  archaic:     0.88,
  cooking:     0.38,
  destruction: 0.12,
}

// ─── UTILITIES ────────────────────────────────────────────────────────────────

// FNV-1a hash → float in [0, 1)
function hashFloat(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 0xffffffff
}

// Derive a word's fundamental frequency from its ID.
// Range: 140–280 Hz (C3–C4), two octaves of spread.
function wordFundamental(id: string): number {
  return 140 * Math.pow(2, hashFloat(id))
}

// Map a lowercase letter → scale ratio from the category's scale.
// Non-alphabetic characters map to the root (1.0).
function charToRatio(ch: string, scale: number[]): number {
  const code = ch.charCodeAt(0)
  const a = 97 // 'a'
  const z = 122 // 'z'
  if (code < a || code > z) return scale[0]
  const idx = (code - a) % scale.length
  const octave = Math.floor((code - a) / scale.length) % 2
  return scale[idx] * (octave === 0 ? 1 : 2)
}

// Build a high-quality algorithmic reverb impulse response.
// Uses layered exponential decay with early reflections.
function buildReverb(ctx: AudioContext): ConvolverNode {
  const duration = 3.2
  const decay = 2.8
  const sampleRate = ctx.sampleRate
  const len = Math.floor(sampleRate * duration)
  const buf = ctx.createBuffer(2, len, sampleRate)

  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch)
    // Main diffuse tail
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-decay * (i / sampleRate))
    }
    // Early reflections (discrete room echoes at realistic ms offsets)
    const reflections: [number, number][] = [
      [Math.floor(0.013 * sampleRate), 0.6],
      [Math.floor(0.027 * sampleRate), 0.45],
      [Math.floor(0.041 * sampleRate), 0.32],
      [Math.floor(0.063 * sampleRate), 0.22],
      [Math.floor(0.091 * sampleRate), 0.14],
    ]
    for (const [idx, amp] of reflections) {
      if (idx < len) data[idx] += amp * (ch === 0 ? 1 : -0.85)
    }
  }
  const conv = ctx.createConvolver()
  conv.buffer = buf
  return conv
}

// Soft-clip saturation curve (tanh-like via Padé approximation)
function buildDistCurve(amount: number): Float32Array<ArrayBuffer> {
  const n = 512
  const buf = new ArrayBuffer(n * 4)
  const curve = new Float32Array(buf)
  const k = amount * 120
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1
    curve[i] = ((Math.PI + k) * x) / (Math.PI + k * Math.abs(x))
  }
  return curve
}

// Schedule a standard AHDSR (Attack, Hold, Decay+Release) envelope
function scheduleADR(
  gain: AudioParam,
  at: number,
  attack: number,
  peak: number,
  hold: number,
  release: number
): void {
  gain.setValueAtTime(0, at)
  gain.linearRampToValueAtTime(peak, at + attack)
  gain.setValueAtTime(peak, at + attack + hold)
  gain.exponentialRampToValueAtTime(0.00001, at + attack + hold + release)
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export interface SoundEngine {
  enabled: boolean
  toggle: () => void
  playHover: (word: WordViewModel) => void
  playCatch: (word: WordViewModel) => void
  setAmbientCategory: (category: string | null) => void
}

export function useSoundEngine(): SoundEngine {
  const [enabled, setEnabled] = useState(false)

  // Core graph nodes — initialised lazily on first use
  const ctxRef    = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const reverbRef = useRef<ConvolverNode | null>(null)
  const compRef   = useRef<DynamicsCompressorNode | null>(null)

  // Ambient management
  const ambientStopRef = useRef<(() => void) | null>(null)
  const currentCatRef  = useRef<string | null>(null)

  // Lazy audio graph init (must run after user gesture)
  function acquireCtx(): AudioContext {
    if (ctxRef.current) return ctxRef.current

    const ctx = new AudioContext()

    // Compressor prevents inter-modulation clipping when many sounds play
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -16
    comp.knee.value = 8
    comp.ratio.value = 5
    comp.attack.value = 0.004
    comp.release.value = 0.12

    const master = ctx.createGain()
    master.gain.value = 0.72

    const reverb = buildReverb(ctx)

    // Signal chain: reverb & direct → master → compressor → destination
    reverb.connect(master)
    master.connect(comp)
    comp.connect(ctx.destination)

    ctxRef.current    = ctx
    masterRef.current = master
    reverbRef.current = reverb
    compRef.current   = comp
    return ctx
  }

  // ── HOVER SOUND ───────────────────────────────────────────────────────────
  // A quick (140ms) soft tonal preview of the word's frequency signature.
  const playHover = useCallback(
    (word: WordViewModel) => {
      if (!enabled) return
      try {
        const ctx = acquireCtx()
        if (ctx.state === 'suspended') void ctx.resume()
        const now  = ctx.currentTime
        const freq = wordFundamental(word.id)
        const out  = masterRef.current!

        // Two sines at f and 2f — subtle harmonic preview
        for (const [mult, amp] of [[1, 0.065], [2, 0.032]] as const) {
          const osc  = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.value = freq * mult

          gain.gain.setValueAtTime(0, now)
          gain.gain.linearRampToValueAtTime(amp, now + 0.009)
          gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.15)

          osc.connect(gain)
          gain.connect(out)
          osc.start(now)
          osc.stop(now + 0.2)
        }
      } catch { /* silently ignore if AudioContext unavailable */ }
    },
    [enabled]
  )

  // ── CATCH SOUND ("THE WORD SPELL") ────────────────────────────────────────
  // A dramatic 1.8-second procedural composition unique to each word.
  //
  // Architecture:
  //   Phase 1 — IGNITION   (0ms):   Bandpass noise burst with frequency sweep
  //   Phase 2 — FM BLOOM   (50ms):  5 FM pairs, modulation index 6→0.05 sweep
  //   Phase 3 — ARPEGGIO   (280ms): Character-to-note sequence, panned L→R
  //   Phase 4 — SHIMMER    (750ms): High harmonic tail into full reverb
  const playCatch = useCallback(
    (word: WordViewModel) => {
      if (!enabled) return
      try {
        const ctx  = acquireCtx()
        if (ctx.state === 'suspended') void ctx.resume()

        const now   = ctx.currentTime
        const freq  = wordFundamental(word.id)
        const scale = CAT_SCALES[word.category]    ?? CAT_SCALES.motion
        const wform = CAT_WAVEFORMS[word.category] ?? 'sine'
        const revAmt= CAT_REVERB[word.category]    ?? 0.45
        const arpDir= CAT_ARP_DIR[word.category]   ?? 1

        const dry = masterRef.current!
        const wet = reverbRef.current!

        // ── PHASE 1: IGNITION ─────────────────────────────────────────────
        // Bandpass-filtered noise that sweeps from the word's frequency up
        // to its 12th harmonic, creating a sharp percussive attack.
        {
          const noiseLen = Math.floor(ctx.sampleRate * 0.28)
          const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate)
          const nd = noiseBuf.getChannelData(0)
          for (let i = 0; i < noiseLen; i++) nd[i] = Math.random() * 2 - 1

          const noiseSrc = ctx.createBufferSource()
          noiseSrc.buffer = noiseBuf

          const bpf = ctx.createBiquadFilter()
          bpf.type = 'bandpass'
          bpf.frequency.setValueAtTime(freq * 2, now)
          bpf.frequency.exponentialRampToValueAtTime(freq * 12, now + 0.22)
          bpf.Q.value = 1.8

          const ng = ctx.createGain()
          ng.gain.setValueAtTime(0.42, now)
          ng.gain.exponentialRampToValueAtTime(0.00001, now + 0.28)

          noiseSrc.connect(bpf)
          bpf.connect(ng)
          ng.connect(dry)
          if (revAmt > 0.25) ng.connect(wet)
          noiseSrc.start(now)
        }

        // ── PHASE 2: FM BLOOM ─────────────────────────────────────────────
        // Five FM synthesis pairs. Each carrier gets a modulator whose
        // modulation index sweeps from a high value (complex metallic sound)
        // to near-zero (pure tone), creating an "opening flower" effect.
        const bloomAt = now + 0.05
        const bloomEnd = bloomAt + 1.35

        // Use the first 5 characters to select harmonic ratios from the scale
        const wordCharsAll = word.word.toLowerCase().replace(/[^a-z]/g, '')
        const bloomRatios = Array.from({ length: 5 }, (_, i) =>
          charToRatio(wordCharsAll[i % wordCharsAll.length] ?? 'a', scale)
        )

        const needsDist = word.category === 'destruction' || word.category === 'technical'
        let distNode: WaveShaperNode | null = null
        if (needsDist) {
          distNode = ctx.createWaveShaper()
          distNode.curve = buildDistCurve(word.category === 'destruction' ? 0.65 : 0.28)
          distNode.oversample = '4x'
          distNode.connect(dry)
        }

        for (let i = 0; i < 5; i++) {
          const ratio = bloomRatios[i]
          const carrierFreq = freq * ratio

          // Modulator: ratio between C:M chosen from hash — gives each word a
          // unique timbre (common FM ratios: 0.5, 1.0, 1.5, 2.0, 3.0)
          const cmRatio = 0.5 + hashFloat(word.id + String(i)) * 2.5
          const modFreq  = carrierFreq * cmRatio

          const modOsc  = ctx.createOscillator()
          modOsc.type = 'sine'
          modOsc.frequency.value = modFreq

          // The modulation index sweeps from rich (β≈6) to pure (β≈0.05)
          const modGain = ctx.createGain()
          const hiIndex = carrierFreq * 6
          const loIndex = carrierFreq * 0.05
          modGain.gain.setValueAtTime(hiIndex, bloomAt)
          modGain.gain.exponentialRampToValueAtTime(loIndex, bloomAt + 0.75)

          const carrier = ctx.createOscillator()
          carrier.type = wform
          carrier.frequency.value = carrierFreq
          // Hash-seeded micro-detune for natural chorus spread
          carrier.detune.value = (hashFloat(word.id + 'det' + i) * 2 - 1) * 9

          modOsc.connect(modGain)
          modGain.connect(carrier.frequency)

          const amp = 0.14 / (i * 0.38 + 1)  // lower harmonics louder
          const hg  = ctx.createGain()
          scheduleADR(hg.gain, bloomAt, 0.07, amp, 0.65, 0.62)

          carrier.connect(hg)
          if (needsDist && distNode) {
            hg.connect(distNode)
          } else {
            hg.connect(dry)
            if (revAmt > 0) {
              const rs = ctx.createGain()
              rs.gain.value = revAmt * 0.9
              hg.connect(rs)
              rs.connect(wet)
            }
          }

          modOsc.start(bloomAt);   modOsc.stop(bloomEnd)
          carrier.start(bloomAt);  carrier.stop(bloomEnd)
        }

        // ── PHASE 3: ARPEGGIO ─────────────────────────────────────────────
        // Each letter of the word maps to a pitch in the category's scale.
        // Notes are panned left → right as the arpeggio progresses.
        const arpAt    = now + 0.30
        const arpStep  = word.category === 'technical' ? 0.055 : 0.072
        let arpChars   = wordCharsAll.split('')

        if (arpDir === -1) {
          arpChars = arpChars.reverse()
        } else if (arpDir === 0) {
          // Interleave ascending + descending for an "oscillating" pattern
          const asc  = [...wordCharsAll]
          const desc = [...wordCharsAll].reverse()
          arpChars   = asc.map((c, i) => (i % 2 === 0 ? c : (desc[i] ?? c)))
        }

        arpChars.forEach((ch, i) => {
          const t    = arpAt + i * arpStep
          const nf   = freq * charToRatio(ch, scale)

          const n1 = ctx.createOscillator()  // fundamental
          const n2 = ctx.createOscillator()  // 3rd harmonic (adds colour)
          n1.type = wform === 'sawtooth' ? 'sine' : wform
          n2.type = 'sine'
          n1.frequency.value = nf
          n2.frequency.value = nf * 3

          const ng = ctx.createGain()
          ng.gain.setValueAtTime(0, t)
          ng.gain.linearRampToValueAtTime(0.30, t + 0.012)
          ng.gain.exponentialRampToValueAtTime(0.00001, t + 0.075)

          // Sweep pan left → right across the word's length
          const pan = ctx.createStereoPanner()
          pan.pan.value = (i / Math.max(arpChars.length - 1, 1)) * 1.6 - 0.8

          n1.connect(ng);  n2.connect(ng)
          ng.connect(pan)
          pan.connect(dry)

          if (revAmt > 0.3) {
            const rs = ctx.createGain()
            rs.gain.value = revAmt * 0.55
            pan.connect(rs)
            rs.connect(wet)
          }

          n1.start(t);  n1.stop(t + 0.12)
          n2.start(t);  n2.stop(t + 0.12)
        })

        // ── PHASE 4: HIGH SHIMMER ─────────────────────────────────────────
        // Three ultra-high harmonics (×8, ×12, ×16) bloom into full reverb,
        // leaving a bell-like shimmer tail that lingers well past the arpeggio.
        const shimAt = now + 0.78
        const shimMults = [8, 12, 16] as const

        shimMults.forEach((mult, i) => {
          const sh = ctx.createOscillator()
          sh.type = 'sine'
          sh.frequency.value = freq * mult
          // Slight inharmonicity (each shimmer slightly detuned) for richness
          sh.detune.value = (hashFloat(word.id + 'sh' + i) * 2 - 1) * 6

          const sg = ctx.createGain()
          sg.gain.setValueAtTime(0, shimAt)
          sg.gain.linearRampToValueAtTime(0.055 / (i + 1), shimAt + 0.18)
          sg.gain.exponentialRampToValueAtTime(0.00001, shimAt + 1.0)

          sh.connect(sg)
          sg.connect(wet)  // shimmer goes entirely into reverb for a long airy tail
          sh.start(shimAt)
          sh.stop(shimAt + 1.3)
        })

      } catch (e) {
        console.error('[SoundEngine] playCatch error:', e)
      }
    },
    [enabled]
  )

  // ── AMBIENT CATEGORY DRONE ────────────────────────────────────────────────
  // Each category has a distinctive background texture.
  // Fades in over 800ms, fades out over 500ms when category changes.
  const setAmbientCategory = useCallback(
    (category: string | null) => {
      if (!enabled) return
      if (category === currentCatRef.current) return
      currentCatRef.current = category

      // Fade out the previous ambient
      if (ambientStopRef.current) {
        ambientStopRef.current()
        ambientStopRef.current = null
      }
      if (!category) return

      try {
        const ctx = acquireCtx()
        if (ctx.state === 'suspended') void ctx.resume()
        const now = ctx.currentTime

        // Every ambient feeds into this gain bus (fade in/out)
        const bus = ctx.createGain()
        bus.gain.setValueAtTime(0, now)
        bus.gain.linearRampToValueAtTime(1, now + 0.8)
        bus.connect(masterRef.current!)

        const oscs: (OscillatorNode | AudioBufferSourceNode)[] = []
        const lfos: OscillatorNode[] = []

        // Helper: add an oscillator into the bus via a gain
        function addOsc(type: OscillatorType, freq: number, amp: number, detune = 0): OscillatorNode {
          const o = ctx.createOscillator()
          const g = ctx.createGain()
          o.type = type
          o.frequency.value = freq
          o.detune.value = detune
          g.gain.value = amp
          o.connect(g)
          g.connect(bus)
          o.start()
          oscs.push(o)
          return o
        }

        // Helper: add an LFO (GainNode-routed to a param)
        function addLFO(rate: number, depth: number, target: AudioParam): OscillatorNode {
          const l  = ctx.createOscillator()
          const lg = ctx.createGain()
          l.type = 'sine'
          l.frequency.value = rate
          lg.gain.value = depth
          l.connect(lg)
          lg.connect(target)
          l.start()
          lfos.push(l)
          return l
        }

        switch (category) {
          case 'motion': {
            // Two detuned sawtooth waves (2 Hz beating) → gentle whoosh
            const filter = ctx.createBiquadFilter()
            filter.type = 'lowpass'
            filter.frequency.value = 380
            filter.Q.value = 1.4
            ;[110, 112].forEach((f) => {
              const o = ctx.createOscillator()
              const g = ctx.createGain()
              o.type = 'sawtooth'
              o.frequency.value = f
              g.gain.value = 0.038
              o.connect(g); g.connect(filter); filter.connect(bus)
              o.start(); oscs.push(o)
            })
            addLFO(0.28, 3.5, (oscs[0] as OscillatorNode).frequency)
            break
          }

          case 'cognition': {
            // Pure harmonic overtone series: crystalline, mathematical
            ;([220, 330, 440, 660] as const).forEach((f, i) => {
              addOsc('sine', f, 0.024 / (i * 0.6 + 1))
            })
            break
          }

          case 'creation': {
            // Warm layered pad: 5 sines at 110 Hz, tightly detuned, slow LFO
            const osc0 = addOsc('sine', 110, 0.026, 0)
            addOsc('sine', 110, 0.026,  4)
            addOsc('sine', 110, 0.026, -4)
            addOsc('sine', 110, 0.022,  8)
            addOsc('sine', 165, 0.016,  0)
            addLFO(0.09, 1.2, osc0.frequency)
            break
          }

          case 'speech': {
            // Formant-filtered drone — evokes a distant, muttering voice
            const base = ctx.createOscillator()
            base.type = 'sine'
            base.frequency.value = 110
            base.start()
            oscs.push(base)
            addLFO(0.07, 1.5, base.frequency)
            ;([[800, 9], [1200, 7]] as const).forEach(([fq, q]) => {
              const filt = ctx.createBiquadFilter()
              filt.type = 'bandpass'
              filt.frequency.value = fq
              filt.Q.value = q
              const g = ctx.createGain()
              g.gain.value = 0.022
              base.connect(filt); filt.connect(g); g.connect(bus)
            })
            break
          }

          case 'technical': {
            // Cold square wave + 7 Hz tremolo → robotic heartbeat
            const o   = addOsc('square', 80, 0.022)
            const filt= ctx.createBiquadFilter()
            filt.type = 'lowpass'
            filt.frequency.value = 900
            o.disconnect()
            const og = ctx.createGain()
            og.gain.value = 0.022
            o.connect(filt); filt.connect(og)
            const trem = ctx.createGain()
            trem.gain.value = 1
            og.connect(trem); trem.connect(bus)
            const trLFO = ctx.createOscillator()
            const trLFOG = ctx.createGain()
            trLFO.type = 'sine'
            trLFO.frequency.value = 7
            trLFOG.gain.value = 0.7
            trLFO.connect(trLFOG); trLFOG.connect(trem.gain)
            trLFO.start(); lfos.push(trLFO)
            break
          }

          case 'social': {
            // Open major triad: warm, optimistic, spacious
            ;([165, 206.25, 247.5] as const).forEach((f) => {
              addOsc('sine', f, 0.022)
            })
            break
          }

          case 'archaic': {
            // Ultra-slow beating (0.4 Hz): an ancient, barely-alive drone
            const filt = ctx.createBiquadFilter()
            filt.type = 'lowpass'
            filt.frequency.value = 280
            ;[80, 80.4].forEach((f) => {
              const o = ctx.createOscillator()
              const g = ctx.createGain()
              o.type = 'sine'
              o.frequency.value = f
              g.gain.value = 0.042
              o.connect(g); g.connect(filt); filt.connect(bus)
              o.start(); oscs.push(o)
            })
            break
          }

          case 'cooking': {
            // Bandpass-filtered noise modulated at 2.5 Hz → bubbling steam
            const noiseLen = ctx.sampleRate * 2
            const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate)
            const nd = noiseBuf.getChannelData(0)
            for (let i = 0; i < noiseLen; i++) nd[i] = Math.random() * 2 - 1
            const ns = ctx.createBufferSource()
            ns.buffer = noiseBuf
            ns.loop = true
            const filt = ctx.createBiquadFilter()
            filt.type = 'bandpass'
            filt.frequency.value = 600
            filt.Q.value = 3.2
            addLFO(2.5, 270, filt.frequency)
            const g = ctx.createGain()
            g.gain.value = 0.032
            ns.connect(filt); filt.connect(g); g.connect(bus)
            ns.start(); oscs.push(ns)
            // Soft low sine underneath
            addOsc('sine', 110, 0.014)
            break
          }

          case 'destruction': {
            // Tritone sawtooth pair through distortion — unresolved, tense
            const dist = ctx.createWaveShaper()
            dist.curve = buildDistCurve(0.38)
            dist.oversample = '4x'
            dist.connect(bus)
            ;([100, 141.4] as const).forEach((f) => {
              const o = ctx.createOscillator()
              const g = ctx.createGain()
              o.type = 'sawtooth'
              o.frequency.value = f
              g.gain.value = 0.024
              o.connect(g); g.connect(dist)
              o.start(); oscs.push(o)
            })
            break
          }
        }

        // Schedule stop: fade-out, then halt all nodes
        ambientStopRef.current = () => {
          const t = ctxRef.current!.currentTime
          bus.gain.setValueAtTime(bus.gain.value, t)
          bus.gain.linearRampToValueAtTime(0, t + 0.5)
          const stopAt = t + 0.55
          oscs.forEach((o) => { try { o.stop(stopAt) } catch { /* already stopped */ } })
          lfos.forEach((o) => { try { o.stop(stopAt) } catch { /* already stopped */ } })
        }

      } catch (e) {
        console.error('[SoundEngine] ambient error:', e)
      }
    },
    [enabled]
  )

  // Stop ambient when sound is disabled
  useEffect(() => {
    if (!enabled) {
      ambientStopRef.current?.()
      ambientStopRef.current = null
      currentCatRef.current  = null
    }
  }, [enabled])

  const toggle = useCallback(() => setEnabled((v) => !v), [])

  return { enabled, toggle, playHover, playCatch, setAmbientCategory }
}
