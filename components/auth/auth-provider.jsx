'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

const AuthContext = createContext({ user: null, refresh: async () => {}, logout: async () => {}, setUser: () => {} })

export function AuthProvider({ children }) {
  // null = checking, false = anonymous, object = authenticated
  const [user, setUser] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' })
      if (!res.ok) { setUser(false); return false }
      const data = await res.json()
      setUser(data.user || false)
      return data.user || false
    } catch {
      setUser(false)
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
    setUser(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return <AuthContext.Provider value={{ user, refresh, logout, setUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
