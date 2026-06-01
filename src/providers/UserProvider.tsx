// UserProvider — resolves the current user once on mount and exposes auth actions.
// Works without Supabase credentials: getCurrentUser() returns a mock guest user.

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import {
  getCurrentUser,
  signOut as authSignOut,
  onAuthStateChange as watchAuthStateChange,
  type AuthUser,
} from '../services/supabase/auth'
import { isBackendEnabled } from '../config/env'

interface UserContextValue {
  currentUser: AuthUser | null
  userId: string | null
  isLoading: boolean
  isMockUser: boolean
  authPageOpen: boolean
  openAuthPage: () => void
  closeAuthPage: () => void
  onboardingPageOpen: boolean
  openOnboardingPage: () => void
  closeOnboardingPage: () => void
  refreshUser: () => Promise<void>
  signOut: () => Promise<void>
}

const UserContext = createContext<UserContextValue>({
  currentUser: null,
  userId: null,
  isLoading: true,
  isMockUser: true,
  authPageOpen: false,
  openAuthPage: () => {},
  closeAuthPage: () => {},
  onboardingPageOpen: false,
  openOnboardingPage: () => {},
  closeOnboardingPage: () => {},
  refreshUser: async () => {},
  signOut: async () => {},
})

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading]               = useState(true)
  const [authPageOpen, setAuthPageOpen]         = useState(false)
  const [onboardingPageOpen, setOnboardingPageOpen] = useState(false)

  const loadUser = useCallback(async () => {
    try {
      const user = await getCurrentUser()
      setCurrentUser(user)
    } catch {
      setCurrentUser(null)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    loadUser().finally(() => {
      if (mounted) setIsLoading(false)
    })

    if (!isBackendEnabled()) {
      return () => { mounted = false }
    }

    const unsubscribe = watchAuthStateChange(async () => {
      await loadUser()
      if (mounted) setIsLoading(false)
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [loadUser])

  const refreshUser = useCallback(async () => {
    await loadUser()
  }, [loadUser])

  const openAuthPage  = useCallback(() => setAuthPageOpen(true),  [])
  const closeAuthPage = useCallback(() => setAuthPageOpen(false), [])

  const openOnboardingPage  = useCallback(() => setOnboardingPageOpen(true),  [])
  const closeOnboardingPage = useCallback(() => setOnboardingPageOpen(false), [])

  const signOut = useCallback(async () => {
    try {
      await authSignOut()
    } catch {
      // best-effort
    }
    await refreshUser()
    setAuthPageOpen(false)
  }, [refreshUser])

  const isMockUser = currentUser?.id === 'local-guest' || !currentUser

  return (
    <UserContext.Provider
      value={{
        currentUser,
        userId: currentUser?.id ?? null,
        isLoading,
        isMockUser,
        authPageOpen,
        openAuthPage,
        closeAuthPage,
        onboardingPageOpen,
        openOnboardingPage,
        closeOnboardingPage,
        refreshUser,
        signOut,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser(): UserContextValue {
  return useContext(UserContext)
}
