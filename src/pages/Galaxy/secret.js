/* Secret phrase check. Legacy rule: any phrase containing the keyword unlocks. */

export function normalizePhrase(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{Letter}\p{Number}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function matchesSecret(value, keyword) {
  const phrase = normalizePhrase(value)
  return phrase.length > 0 && phrase.includes(normalizePhrase(keyword))
}

/** Detects WebGL support without keeping the context alive. */
export function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!context) return false
    context.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}
