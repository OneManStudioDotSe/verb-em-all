import { describe, it, expect } from 'vitest'
import { ACCENT_PALETTE, DEFAULT_ACCENT, findAccentEntry } from '../src/renderer/src/data/palette'

describe('accent palette', () => {
  it('has 10 unique colours, each with a shadow', () => {
    expect(ACCENT_PALETTE).toHaveLength(10)
    expect(new Set(ACCENT_PALETTE.map((p) => p.color)).size).toBe(10)
    for (const p of ACCENT_PALETTE) expect(p.shadow).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('finds an entry by colour and falls back to the default', () => {
    expect(findAccentEntry(ACCENT_PALETTE[3].color)).toBe(ACCENT_PALETTE[3])
    expect(findAccentEntry('#000000')).toBe(DEFAULT_ACCENT)
  })
})
