'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  signUp, confirmSignUp, resendSignUpCode,
  signIn, signOut, fetchAuthSession
} from 'aws-amplify/auth'

interface User {
  id: string
  email: string
  name?: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{
    success: boolean; isNewUser?: boolean; incorrectPassword?: boolean; needsConfirm?: boolean
  }>
  logout: () => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<boolean>
  /** 新增：在“输入验证码”页面调用 */
  confirmSignup: (email: string, code: string) => Promise<void>
  /** 新增：重发验证码 */
  resendCode: (email: string) => Promise<void>
  updateUser: (userData: Partial<User>) => void
  checkUserExists: (email: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  function parseIdToken(idToken: string | undefined | null): User | null {
    if (!idToken) return null
    try {
      const payload = JSON.parse(atob(idToken.split('.')[1]))
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        avatar: payload.name
          ? `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.name)}&background=f97316&color=000&size=128`
          : undefined
      }
    } catch { return null }
  }

  async function refreshSession() {
    const s = await fetchAuthSession()
    const idToken = s.tokens?.idToken?.toString()
    setUser(parseIdToken(idToken))
  }

  useEffect(() => {
    (async () => { try { await refreshSession() } finally { setIsLoading(false) } })()
  }, [])

  const login: AuthContextType['login'] = async (email, password) => {
    try {
      setIsLoading(true)
      await signIn({ username: email, password })
      await refreshSession()
      return { success: true }
    } catch (e: any) {
      if (e?.name === 'UserNotFoundException') return { success: false, isNewUser: true }
      if (e?.name === 'NotAuthorizedException') return { success: false, incorrectPassword: true }
      if (e?.name === 'UserNotConfirmedException') return { success: false, needsConfirm: true }
      return { success: false }
    } finally {
      setIsLoading(false)
    }
  }

  // AuthContext.tsx
const signup: AuthContextType['signup'] = async (email, password, name) => {
  setIsLoading(true)
  try {
    await signUp({
      username: email,
      password,
      options: { userAttributes: { email, name } }
    })
    return true
  } catch (e: any) {
    console.error('Cognito signUp error:', e?.name, e?.message)

    // 常见错误归一化，便于 UI 分辨
    if (e?.name === 'UsernameExistsException') {
      throw new Error('User already exists')
    }
    if (e?.name === 'InvalidPasswordException') {
      throw new Error('Weak password')
    }
    throw e
  } finally {
    setIsLoading(false)
  }
}

  // 新增：暴露给 /confirm 页面
  const confirmSignup: AuthContextType['confirmSignup'] = async (email, code) => {
    await confirmSignUp({ username: email, confirmationCode: code })
  }

  // 新增：重发验证码
  const resendCode: AuthContextType['resendCode'] = async (email) => {
    await resendSignUpCode({ username: email })
  }

  const logout = async () => { await signOut(); setUser(null) }

  const updateUser = (userData: Partial<User>) => { if (user) setUser({ ...user, ...userData }) }

  const checkUserExists = (_email: string) => false

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    signup,
    confirmSignup,   // ← 新增
    resendCode,      // ← 新增
    updateUser,
    checkUserExists
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
