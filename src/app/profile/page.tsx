'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useToastContext } from '@/contexts/ToastContext'
import UserAvatar from '@/components/UserAvatar'
import { withAuth } from '@/contexts/AuthContext'

function ProfilePage() {
  const { user, updateUser } = useAuth()
  const { success, error } = useToastContext()
  const [isEditing, setIsEditing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        updateUser(data.user)
        setIsEditing(false)
        success('Information Updated', 'Your information has been updated successfully!')
      } else {
        error('Update Failed', data.error || 'Failed to update profile')
      }
    } catch (err) {
      error('Update Failed', 'Network error occurred')
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || ''
    })
    setIsEditing(false)
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      error('Invalid File', 'Please select an image file')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      error('File Too Large', 'Please select an image smaller than 5MB')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/auth/upload-avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')}`
        },
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        updateUser({ avatar: data.avatarUrl })
        success('Profile Updated', 'Your profile picture has been updated successfully!')
      } else {
        error('Upload Failed', data.error || 'Failed to upload profile picture')
      }
    } catch (err) {
      error('Upload Failed', 'Network error occurred')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation Header */}
      <header className="max-w-7xl mx-auto flex justify-between items-center px-8 py-8">
        <Link href="/" className="flex items-center gap-4">
          <Image
            src="/Logo.png"
            alt="GoPlanner Logo"
            width={180}
            height={60}
            className="object-contain brightness-125 contrast-125 drop-shadow-lg"
            style={{ filter: 'brightness(1.5) contrast(1.4) saturate(1.3) hue-rotate(-10deg)' }}
          />
        </Link>
        
        <nav className="flex items-center gap-10">
          <Link href="/" className="text-white hover:text-orange-400 transition-all duration-200 font-medium text-lg tracking-wide hover:scale-105">HOME</Link>
          <Link href="/guidebook" className="text-white hover:text-orange-400 transition-all duration-200 font-medium text-lg tracking-wide hover:scale-105">ATTRACTIONS</Link>
          <Link href="/smart-planning" className="text-white hover:text-orange-400 transition-all duration-200 font-medium text-lg tracking-wide hover:scale-105">MY PLANS</Link>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-white via-orange-400 to-white bg-clip-text text-transparent">
            Profile Settings
          </h1>
          <p className="text-white/70 text-xl max-w-2xl mx-auto leading-relaxed">
            Manage your account information and preferences
          </p>
        </div>

        {/* Main Profile Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Profile Picture Card */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
              <div className="text-center">
                <div className="relative group mb-6">
                  <div className="w-32 h-32 mx-auto relative">
                    <UserAvatar 
                      src={user?.avatar}
                      name={user?.name || 'User'}
                      size="2xl"
                      className="cursor-pointer"
                    />
                    <button
                      onClick={handleAvatarClick}
                      disabled={isUploading}
                      className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 disabled:opacity-100 backdrop-blur-sm"
                    >
                      {isUploading ? (
                        <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <div className="bg-white/20 rounded-full p-3">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{user?.name}</h3>
                <p className="text-orange-400 font-medium mb-4">{user?.email}</p>
                <p className="text-white/60 text-sm mb-6">
                  Click to change profile
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                {/* Quick Stats */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/70 text-sm">Member Since</span>
                    <span className="text-white font-semibold">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric'
                      }) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Status</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-400 font-semibold text-sm">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information Card */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl h-full">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Account Information</h2>
                <p className="text-white/60 text-base">Update your personal details and preferences</p>
              </div>

              <div className="space-y-8">
                {/* Name Field */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <label className="block text-white/90 font-semibold text-base mb-3">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white text-lg placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-white text-base py-2 font-medium">{user?.name}</p>
                  )}
                </div>

                {/* Email Field */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <label className="block text-white/90 font-semibold text-base mb-3">Email Address</label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white text-lg placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your email"
                    />
                  ) : (
                    <p className="text-white text-base py-2 font-medium">{user?.email}</p>
                  )}
                </div>

                {/* Member Since */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <label className="block text-white/90 font-semibold text-base mb-3">Member Since</label>
                  <p className="text-white/70 text-base py-2">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-6 mt-12">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-black font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-lg transform hover:scale-105"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-700/50 hover:bg-gray-600/50 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 border border-gray-600/50 text-lg"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-black font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-lg transform hover:scale-105"
                  >
                    Edit Information
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Account Settings */}
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white">Account Settings</h3>
            </div>
            <div className="space-y-6">
              <button className="w-full text-left p-6 bg-white/5 rounded-2xl hover:bg-white/10 transition-all duration-300 border border-white/10 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white text-base mb-1">Change Password</p>
                    <p className="text-white/60 text-sm">Update your account password</p>
                  </div>
                  <svg className="w-6 h-6 text-white/40 group-hover:text-white/60 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
              
              <button className="w-full text-left p-6 bg-white/5 rounded-2xl hover:bg-white/10 transition-all duration-300 border border-white/10 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white text-base mb-1">Privacy Settings</p>
                    <p className="text-white/60 text-sm">Manage your privacy preferences</p>
                  </div>
                  <svg className="w-6 h-6 text-white/40 group-hover:text-white/60 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          {/* Trip Preferences */}
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white">Trip Preferences</h3>
            </div>
            <div className="space-y-6">
              <button className="w-full text-left p-6 bg-white/5 rounded-2xl hover:bg-white/10 transition-all duration-300 border border-white/10 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white text-base mb-1">Travel Interests</p>
                    <p className="text-white/60 text-sm">Customize your travel preferences</p>
                  </div>
                  <svg className="w-6 h-6 text-white/40 group-hover:text-white/60 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
              
              <button className="w-full text-left p-6 bg-white/5 rounded-2xl hover:bg-white/10 transition-all duration-300 border border-white/10 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white text-base mb-1">Notification Settings</p>
                    <p className="text-white/60 text-sm">Manage your notification preferences</p>
                  </div>
                  <svg className="w-6 h-6 text-white/40 group-hover:text-white/60 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default withAuth(ProfilePage)
