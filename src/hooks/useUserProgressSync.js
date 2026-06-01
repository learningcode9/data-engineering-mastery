import { useEffect, useMemo, useRef } from 'react'
import { isBackendEnabled } from '../config/env'
import { loadUserProgress, mergeProgressSnapshots, saveUserProgress, normalizeProgressSnapshot } from '../services/supabase/userProgress'

function serializeProgress(snapshot) {
  return JSON.stringify(normalizeProgressSnapshot(snapshot))
}

export function useUserProgressSync({ userId, snapshot, onHydrate }) {
  const hydratedUserIdRef = useRef(null)
  const latestSnapshotRef = useRef(snapshot)
  const lastSavedRef = useRef('')

  const normalizedSnapshot = useMemo(
    () => normalizeProgressSnapshot(snapshot),
    [snapshot]
  )

  useEffect(() => {
    latestSnapshotRef.current = normalizedSnapshot
  }, [normalizedSnapshot])

  useEffect(() => {
    if (!isBackendEnabled() || !userId || userId === 'local-guest') {
      hydratedUserIdRef.current = null
      lastSavedRef.current = ''
      return
    }

    let cancelled = false

    async function hydrate() {
      try {
        const remote = await loadUserProgress(userId)
        const local = latestSnapshotRef.current
        const merged = mergeProgressSnapshots(local, remote)
        if (cancelled) return
        onHydrate?.(merged)
        hydratedUserIdRef.current = userId
        lastSavedRef.current = serializeProgress(merged)
      } catch {
        hydratedUserIdRef.current = userId
      }
    }

    hydrate()

    return () => {
      cancelled = true
    }
  }, [userId, onHydrate])

  useEffect(() => {
    if (!isBackendEnabled() || !userId || userId === 'local-guest') return
    if (hydratedUserIdRef.current !== userId) return

    const serialized = serializeProgress(normalizedSnapshot)
    if (serialized === lastSavedRef.current) return

    const timer = window.setTimeout(() => {
      saveUserProgress(userId, normalizedSnapshot)
        .then(() => {
          lastSavedRef.current = serialized
        })
        .catch(() => {})
    }, 600)

    return () => window.clearTimeout(timer)
  }, [userId, normalizedSnapshot])
}
