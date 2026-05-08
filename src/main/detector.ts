import { WORDS } from '../renderer/src/data/words'

// Pre-compile one regex per word at module load time
const WORD_PATTERNS: Array<{ id: string; regex: RegExp }> = WORDS
  .filter((w) => w.word.length >= 5) // skip very short words to reduce noise
  .map((w) => ({
    id: w.id,
    // Escape special regex chars in word (handles hyphens, apostrophes, etc.)
    regex: new RegExp(
      '\\b' + w.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "[''']?") + '\\b',
      'i'
    )
  }))

/**
 * Scan arbitrary text and return IDs of words that appear in it.
 * Returns a deduplicated array.
 */
export function detectWords(text: string): string[] {
  if (!text || text.length < 3) return []
  const found: string[] = []
  for (const { id, regex } of WORD_PATTERNS) {
    if (regex.test(text)) found.push(id)
  }
  return found
}

/**
 * Extract human-readable text from a Claude Code JSONL session line.
 * Handles both assistant messages (text + thinking blocks) and plain strings.
 */
export function extractTextFromJsonlLine(raw: string): string {
  try {
    const parsed = JSON.parse(raw)
    const parts: string[] = []

    // Format: { message: { content: [...] } }
    const content = parsed?.message?.content ?? parsed?.content
    if (Array.isArray(content)) {
      for (const block of content) {
        if (block.type === 'text' && block.text) parts.push(block.text)
        if (block.type === 'thinking' && block.thinking) parts.push(block.thinking)
      }
    }

    // Format: { text: "..." } or { thinking: "..." }
    if (parsed?.text) parts.push(parsed.text)
    if (parsed?.thinking) parts.push(parsed.thinking)

    return parts.join('\n')
  } catch {
    // Not JSON — return as-is (plain text line)
    return raw
  }
}
