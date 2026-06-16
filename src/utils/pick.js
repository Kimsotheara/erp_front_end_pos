// Pick the first present value among candidate keys (case-insensitive-ish),
// useful when the backend response field names aren't known precisely.
export function pick(obj, keys, fallback = null) {
  if (!obj) return fallback
  for (const k of keys) {
    if (obj[k] != null) return obj[k]
  }
  return fallback
}

// Find the first array value in an object (e.g. a list nested under any key).
export function firstArray(obj, keys) {
  if (!obj) return []
  for (const k of keys) {
    if (Array.isArray(obj[k])) return obj[k]
  }
  for (const v of Object.values(obj)) {
    if (Array.isArray(v)) return v
  }
  return []
}
