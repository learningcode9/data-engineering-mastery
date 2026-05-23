// Safe localStorage wrappers — never throw, always return typed results.

export function getItemSafe<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return (JSON.parse(raw) as T) ?? fallback
  } catch {
    return fallback
  }
}

export function setItemSafe(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeItemSafe(key: string): void {
  try { localStorage.removeItem(key) } catch {}
}

// Replace a single item in a stored array, matched by predicate
export function updateArrayItem<T>(
  key: string,
  predicate: (item: T) => boolean,
  updater: (item: T) => T
): void {
  const arr = getItemSafe<T[]>(key, [])
  setItemSafe(key, arr.map(item => predicate(item) ? updater(item) : item))
}

// Insert or replace a single item in a stored array, matched by predicate
export function upsertArrayItem<T>(
  key: string,
  predicate: (item: T) => boolean,
  newItem: T
): void {
  const arr = getItemSafe<T[]>(key, [])
  const idx = arr.findIndex(predicate)
  if (idx === -1) {
    setItemSafe(key, [newItem, ...arr])
  } else {
    arr[idx] = newItem
    setItemSafe(key, arr)
  }
}
