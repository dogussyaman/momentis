'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const AuthContext = createContext({ user: null, status: 'loading', refresh: async () => {}, logout: async () => {}, setUser: () => {} })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')
  const refreshRequest = useRef(null)

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser || false)
    setStatus(nextUser ? 'authenticated' : 'anonymous')
  }, [])

  const refresh = useCallback(async () => {
    if (refreshRequest.current) return refreshRequest.current

    setStatus((current) => current === 'authenticated' ? current : 'loading')
    const request = (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' })
        if (res.status === 401) {
          updateUser(false)
          return false
        }
        if (!res.ok) throw new Error(`Oturum kontrolü başarısız oldu (${res.status})`)
        const data = await res.json()
        updateUser(data.user || false)
        return data.user || false
      } catch (error) {
        console.error('[auth] Oturum durumu doğrulanamadı', error)
        setStatus((current) => current === 'authenticated' ? current : 'error')
        return false
      } finally {
        refreshRequest.current = null
      }
    })()
    refreshRequest.current = request
    return request
  }, [updateUser])

  const logout = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      if (!response.ok) throw new Error(`Çıkış yapılamadı (${response.status})`)
    } catch (error) {
      console.error('[auth] Sunucu oturumu kapatılamadı', error)
    } finally {
      updateUser(false)
    }
  }, [updateUser])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    const retryWhenAvailable = () => {
      if (status === 'error' && document.visibilityState === 'visible') refresh()
    }
    window.addEventListener('focus', retryWhenAvailable)
    document.addEventListener('visibilitychange', retryWhenAvailable)
    return () => {
      window.removeEventListener('focus', retryWhenAvailable)
      document.removeEventListener('visibilitychange', retryWhenAvailable)
    }
  }, [refresh, status])

  return <AuthContext.Provider value={{ user, status, refresh, logout, setUser: updateUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
