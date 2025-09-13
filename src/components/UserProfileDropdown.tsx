'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import UserAvatar from './UserAvatar'
import { useAuth } from '@/contexts/AuthContext'
import { useToastContext } from '@/contexts/ToastContext'

interface UserProfileDropdownProps {
  className?: string
  variant?: 'default' | 'large'
}

export default function UserProfileDropdown({ className = '', variant = 'default' }: UserProfileDropdownProps) {
  const { user, logout } = useAuth()
  const { info } = useToastContext()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    logout()
    setIsOpen(false)
    info('Logged out', 'You have been successfully logged out.')
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center bg-white/5 backdrop-blur-sm rounded-full border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/10 ${
          variant === 'large' 
            ? 'px-8 py-5 gap-4' 
            : 'px-4 py-2 gap-3'
        }`}
      >
        <UserAvatar 
          src={user?.avatar}
          name={user?.name || 'User'}
          size={variant === 'large' ? 'xl' : 'md'}
          showOnlineStatus={true}
          isOnline={true}
        />
        <span className={`text-white font-semibold hidden sm:block ${
          variant === 'large' ? 'text-xl' : 'text-sm'
        }`}>
          {user?.name}
        </span>
        <svg 
          className={`text-white/70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${
            variant === 'large' ? 'w-6 h-6' : 'w-4 h-4'
          }`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute right-0 mt-2 bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50 ${
          variant === 'large' ? 'w-72' : 'w-64'
        }`}>
          {/* User Info Header */}
          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <UserAvatar 
                src={user?.avatar}
                name={user?.name || 'User'}
                size="lg"
                showOnlineStatus={true}
                isOnline={true}
              />
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">
                  {user?.name}
                </p>
                <p className="text-white/60 text-xs truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link 
              href="/profile"
              className="flex items-center gap-3 px-6 py-3 text-white/90 hover:bg-white/5 transition-colors duration-200 group"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-5 h-5 text-white/60 group-hover:text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium">Profile Settings</span>
            </Link>

            <Link 
              href="/smart-planning"
              className="flex items-center gap-3 px-6 py-3 text-white/90 hover:bg-white/5 transition-colors duration-200 group"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-5 h-5 text-white/60 group-hover:text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="font-medium">My Plans</span>
            </Link>

            <Link 
              href="/guidebook"
              className="flex items-center gap-3 px-6 py-3 text-white/90 hover:bg-white/5 transition-colors duration-200 group"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-5 h-5 text-white/60 group-hover:text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="font-medium">Attractions</span>
            </Link>

            <div className="border-t border-white/10 my-2"></div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-6 py-3 text-red-400 hover:bg-red-500/10 transition-colors duration-200 group w-full text-left"
            >
              <svg className="w-5 h-5 text-red-400 group-hover:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">LOGOUT</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
