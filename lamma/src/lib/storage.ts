const PREFIX = 'lamma:'

export function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* التخزين ممتلئ أو معطّل — نتجاهل بهدوء */
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    /* تجاهل */
  }
}

export const GAME_KEY = 'game:v1'
export const BANK_KEY = 'bank:v1'
