export interface AccentEntry {
  color: string
  shadow: string
  label: string
}

export const ACCENT_PALETTE: AccentEntry[] = [
  { color: '#f5e642', shadow: '#5c550d', label: 'Yellow' },
  { color: '#00f5d4', shadow: '#055c52', label: 'Cyan' },
  { color: '#f542d4', shadow: '#5c1050', label: 'Magenta' },
  { color: '#42f587', shadow: '#0d5c28', label: 'Green' },
  { color: '#f5a742', shadow: '#5c3a0d', label: 'Orange' },
  { color: '#4287f5', shadow: '#0d255c', label: 'Blue' },
  { color: '#f54242', shadow: '#5c0d0d', label: 'Red' },
  { color: '#b042f5', shadow: '#3d0d5c', label: 'Purple' },
  { color: '#f5f542', shadow: '#5c5c0d', label: 'Lime' },
  { color: '#42e8f5', shadow: '#0d4d5c', label: 'Sky' },
]

export const DEFAULT_ACCENT = ACCENT_PALETTE[0]

export function findAccentEntry(color: string): AccentEntry {
  return ACCENT_PALETTE.find((p) => p.color === color) ?? DEFAULT_ACCENT
}
