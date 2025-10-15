'use client'

import { useState } from 'react'
import { useToastContext } from '@/contexts/ToastContext'

interface NotificationSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const SettingToggle = ({ title, description, checked, onChange }: any) => (
  <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
    <div>
      <h4 className="font-semibold text-white">{title}</h4>
      <p className="text-sm text-white/60">{description}</p>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
    </label>
  </div>
);

const CheckboxSetting = ({ title, description, checked, onChange }: any) => (
    <div className="flex items-start gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
      <div className="flex items-center h-6 mt-1">
        <input
            id={title}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="w-5 h-5 bg-gray-700 border-gray-600 rounded text-orange-500 focus:ring-orange-600 focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor={title} className="font-semibold text-white">{title}</label>
        <p className="text-sm text-white/60">{description}</p>
      </div>
    </div>
  );
  

export default function NotificationSettingsModal({ isOpen, onClose }: NotificationSettingsModalProps) {
  const { success } = useToastContext()
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [tripReminders, setTripReminders] = useState(true)
  const [promotionalOffers, setPromotionalOffers] = useState(false)
  const [friendUpdates, setFriendUpdates] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleSave = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      success('Settings Saved', 'Your notification settings have been updated.')
      onClose()
    }, 1500)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 transition-opacity duration-300">
      <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl w-full max-w-lg m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Notification Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="space-y-6">
          <SettingToggle
            title="Email Notifications"
            description="Receive updates and summaries via email"
            checked={emailNotifications}
            onChange={() => setEmailNotifications(!emailNotifications)}
          />
          <SettingToggle
            title="Push Notifications"
            description="Get real-time alerts on your mobile device"
            checked={pushNotifications}
            onChange={() => setPushNotifications(!pushNotifications)}
          />
          
          <div className="pt-4 border-t border-white/10">
            <h3 className="font-semibold text-white mb-3">Fine-tune your notifications</h3>
            <div className="space-y-4">
              <CheckboxSetting
                title="Trip Reminders"
                description="Get notified about upcoming activities and plans"
                checked={tripReminders}
                onChange={() => setTripReminders(!tripReminders)}
              />
              <CheckboxSetting
                title="Promotional Offers"
                description="Receive special deals and promotions"
                checked={promotionalOffers}
                onChange={() => setPromotionalOffers(!promotionalOffers)}
              />
              <CheckboxSetting
                title="Friend Updates"
                description="Get notified when friends share or update plans"
                checked={friendUpdates}
                onChange={() => setFriendUpdates(!friendUpdates)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button onClick={onClose} className="bg-gray-700/50 hover:bg-gray-600/50 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 border border-gray-600/50">Cancel</button>
          <button onClick={handleSave} disabled={isLoading} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-black font-bold px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[150px]">
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-black/50 border-t-black rounded-full animate-spin"></div>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
