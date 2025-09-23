'use client'

import { useState } from 'react'
import { useToastContext } from '@/contexts/ToastContext'

interface PrivacySettingsModalProps {
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

export default function PrivacySettingsModal({ isOpen, onClose }: PrivacySettingsModalProps) {
  const { success } = useToastContext()
  const [profileVisibility, setProfileVisibility] = useState('public')
  const [sharePlans, setSharePlans] = useState(true)
  const [dataCollection, setDataCollection] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleSave = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      success('Settings Saved', 'Your privacy settings have been updated.')
      onClose()
    }, 1500)
  }

  const RadioButton = ({ id, name, value, label, checked, onChange }: any) => (
    <label htmlFor={id} className={`flex-1 text-center px-4 py-2 rounded-lg cursor-pointer transition-colors text-sm font-semibold ${checked ? 'bg-orange-500 text-black' : 'bg-gray-700/50 text-white/70 hover:bg-gray-700'}`}>
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {label}
    </label>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 transition-opacity duration-300">
      <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl w-full max-w-lg m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Privacy Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-white mb-3">Profile Visibility</h3>
            <div className="flex gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
              <RadioButton id="public" name="visibility" value="public" label="Public" checked={profileVisibility === 'public'} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileVisibility(e.target.value)} />
              <RadioButton id="friends" name="visibility" value="friends" label="Friends Only" checked={profileVisibility === 'friends'} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileVisibility(e.target.value)} />
              <RadioButton id="private" name="visibility" value="private" label="Private" checked={profileVisibility === 'private'} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileVisibility(e.target.value)} />
            </div>
          </div>
          
          <SettingToggle
            title="Share My Trip Plans"
            description="Allow friends to see your upcoming trips"
            checked={sharePlans}
            onChange={() => setSharePlans(!sharePlans)}
          />

          <SettingToggle
            title="Anonymous Data Collection"
            description="Help us improve by sharing anonymous usage data"
            checked={dataCollection}
            onChange={() => setDataCollection(!dataCollection)}
          />
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
