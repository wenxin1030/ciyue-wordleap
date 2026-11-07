const PREFIX = 'wl_'

export function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch (e) {
    console.warn('[storage] read failed', key, e)
    return fallback
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch (e) {
    console.warn('[storage] write failed', key, e)
  }
}

export function remove(key) {
  localStorage.removeItem(PREFIX + key)
}

export function hashPassword(pw) {
  let h = 5381
  for (let i = 0; i < pw.length; i++) h = ((h << 5) + h + pw.charCodeAt(i)) >>> 0
  return 'h' + h.toString(36)
}

export function uid(prefix = 'id') {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}
