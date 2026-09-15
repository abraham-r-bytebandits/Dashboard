import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { setUser, setShowModal, setLoading } from '@/store/authSlice'
import { apiClient } from '@/lib/apiClient'
import type { User } from '@/types'

type AuthContextType = {
  user: User | null
  setUser: (user: User | null) => void
  login: (identifier: string, password: string, remember: boolean) => Promise<void>
  logout: () => Promise<void>
  showModal: boolean
  setShowModal: (show: boolean) => void
  loading: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  onAuthSuccess: (accessToken: string, refreshToken: string, remember: boolean) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

type AuthProviderProps = {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const showModal = useAppSelector((state) => state.auth.showModal)
  const loading = useAppSelector((state) => state.auth.loading)

  const isAdmin = (() => {
    if (!user) return false
    const roles = Array.isArray(user.roles) ? user.roles : []
    return roles.some((r) => r.toUpperCase() === 'ADMIN' || r.toUpperCase() === 'SUPER_ADMIN')
  })()

  const isSuperAdmin = (() => {
    if (!user) return false
    const roles = Array.isArray(user.roles) ? user.roles : []
    return roles.some((r) => r.toUpperCase() === 'SUPER_ADMIN')
  })()

  useEffect(() => {
    const initAuth = async (): Promise<void> => {
      try {
        const accessToken =
          localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

        if (!accessToken) {
          dispatch(setShowModal(true))
          dispatch(setLoading(false))
          return
        }

        const res = await apiClient.get<{ data: User }>('/user/profile')
        const userData = res.data?.data || res.data
        dispatch(setUser(userData as User))
      } catch {
        localStorage.clear()
        sessionStorage.clear()
        dispatch(setUser(null))
        dispatch(setShowModal(true))
      } finally {
        dispatch(setLoading(false))
      }
    }

    initAuth()
  }, [dispatch])

  const onAuthSuccess = async (
    accessToken: string,
    refreshToken: string,
    remember: boolean
  ) => {
    if (remember) {
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
    } else {
      sessionStorage.setItem('accessToken', accessToken)
      sessionStorage.setItem('refreshToken', refreshToken)
    }
    const me = await apiClient.get<{ data: User }>('/user/profile')
    const userData = me.data?.data || me.data
    dispatch(setUser(userData as User))
    dispatch(setShowModal(false))
  }

  const login = async (
    identifier: string,
    password: string,
    remember: boolean
  ): Promise<void> => {
    const isPhone =
      /^\+?[\d\s\-()]+$/.test(identifier) && identifier.replace(/\D/g, '').length >= 7
    const payload = isPhone
      ? { phone: identifier, password, remember }
      : { email: identifier, password, remember }

    const res = await apiClient.post<{ accessToken: string; refreshToken: string }>(
      '/auth/login',
      payload
    )

    const { accessToken, refreshToken } = res.data
    await onAuthSuccess(accessToken, refreshToken, remember)
  }

  const logout = async (): Promise<void> => {
    try {
      const refreshToken =
        localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken')

      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken })
      }
    } finally {
      localStorage.clear()
      sessionStorage.clear()
      dispatch(setUser(null))
      dispatch(setShowModal(true))
    }
  }

  const value: AuthContextType = {
    user,
    setUser: (u) => dispatch(setUser(u)),
    login,
    logout,
    showModal,
    setShowModal: (s) => dispatch(setShowModal(s)),
    loading,
    isAdmin,
    isSuperAdmin,
    onAuthSuccess,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}