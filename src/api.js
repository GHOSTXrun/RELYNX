const configured = String(import.meta.env.VITE_PID0_API_ORIGIN || '').replace(/\/$/, '')
const local = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
export const apiOrigin = configured
export const apiConfigured = Boolean(configured || local)
export function apiUrl(path) { return `${configured}${path}` }
export async function requestJson(path, options = {}) {
  if (!apiConfigured) throw new Error('Gateway not connected')
  const response = await fetch(apiUrl(path), { cache: 'no-store', signal: AbortSignal.timeout(12000), ...options })
  if (!response.ok) throw new Error(`Request failed (${response.status})`)
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Gateway returned an invalid response')
  return response.json()
}
