'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  name: string
  password: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; isNewUser?: boolean; incorrectPassword?: boolean }>
  logout: () => void
  signup: (email: string, password: string, name: string) => Promise<boolean>
  updateUser: (userData: Partial<User>) => void
  checkUserExists: (email: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([])

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const userData = localStorage.getItem('user_data')
        const storedUsers = localStorage.getItem('registered_users')
        
        if (storedUsers) {
          setRegisteredUsers(JSON.parse(storedUsers))
        }
        
        if (token && userData) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        // Clear invalid data
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthStatus()
  }, [])

  const checkUserExists = (email: string): boolean => {
    return registeredUsers.some(user => user.email.toLowerCase() === email.toLowerCase())
  }

  const login = async (email: string, password: string, rememberMe = false): Promise<{ success: boolean; isNewUser?: boolean; incorrectPassword?: boolean }> => {
    try {
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Check if user exists
      const existingUser = registeredUsers.find(user => user.email.toLowerCase() === email.toLowerCase())
      
      if (!existingUser) {
        // User doesn't exist, they need to sign up first
        return { success: false, isNewUser: true }
      }
      
      // Verify password
      if (existingUser.password !== password) {
        return { success: false, incorrectPassword: true }
      }
      
      // Mock successful login for existing user
      if (email && password.length >= 6) {
        const token = 'mock_jwt_token_' + Math.random().toString(36).substr(2, 16)
        
        // Store in localStorage or sessionStorage based on rememberMe
        const storage = rememberMe ? localStorage : sessionStorage
        storage.setItem('auth_token', token)
        storage.setItem('user_data', JSON.stringify(existingUser))
        
        setUser(existingUser)
        return { success: true }
      } else {
        throw new Error('Invalid credentials')
      }
    } catch (error) {
      console.error('Login failed:', error)
      return { success: false }
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      // Check if user already exists
      if (checkUserExists(email)) {
        throw new Error('User already exists')
      }
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock successful signup
      if (email && password.length >= 6 && name.length >= 2) {
        const userData: User = {
          id: 'user_' + Math.random().toString(36).substr(2, 9),
          email,
          name,
          password,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f97316&color=000&size=128`
        }
        
        // Add user to registered users list
        const updatedUsers = [...registeredUsers, userData]
        setRegisteredUsers(updatedUsers)
        localStorage.setItem('registered_users', JSON.stringify(updatedUsers))
        const token = 'mock_jwt_token_' + Math.random().toString(36).substr(2, 16)
        localStorage.setItem('auth_token', token)
        localStorage.setItem('user_data', JSON.stringify(userData))
        setUser(userData)
        return true
      } else {
        throw new Error('Invalid signup data')
      }
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    sessionStorage.removeItem('auth_token')
    sessionStorage.removeItem('user_data')
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData }
      setUser(updatedUser)
      
      // Update stored user data
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
      if (token) {
        const storage = localStorage.getItem('auth_token') ? localStorage : sessionStorage
        storage.setItem('user_data', JSON.stringify(updatedUser))
      }
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    signup,
    updateUser,
    checkUserExists
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Higher-order component for protected routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth()
    
    if (isLoading) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/70">Loading...</p>
          </div>
        </div>
      )
    }
    
    if (!isAuthenticated) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
            <p className="text-white/70 mb-6">Please log in to access this page.</p>
            <a 
              href="/login" 
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-black font-semibold px-6 py-3 rounded-full transition-all duration-200"
            >
              Go to Login
            </a>
          </div>
        </div>
      )
    }
    
    return <Component {...props} />
  }
}
