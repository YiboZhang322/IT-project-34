'use client'

import { useState } from 'react'
import { useToastContext } from '@/contexts/ToastContext'

interface TravelInterestsModalProps {
  isOpen: boolean
  onClose: () => void
}

const interests = [
  'Adventure', 'Relaxation', 'Culture', 'Foodie', 
  'History', 'Nightlife', 'Nature', 'Shopping',
  'Art', 'Wellness', 'Sports', 'Luxury'
]

const InterestTag = ({ label, selected, onClick }: any) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full border transition-all duration-200 text-sm font-semibold ${
      selected 
        ? 'bg-orange-500 text-black border-orange-500' 
        : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'
    }`}
  >
    {label}
  </button>
);

const BudgetSegment = ({ label, value, selected, onClick }: any) => (
  <button
    onClick={() => onClick(value)}
    className={`flex-1 text-center px-4 py-2 rounded-lg cursor-pointer transition-colors text-sm font-semibold ${
      selected ? 'bg-orange-500 text-black' : 'bg-gray-700/50 text-white/70 hover:bg-gray-700'
    }`}
  >
    {label}
  </button>
);

export default function TravelInterestsModal({ isOpen, onClose }: TravelInterestsModalProps) {
  const { success } = useToastContext()
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Culture', 'Foodie'])
  const [budget, setBudget] = useState('comfortable')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleToggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest) 
        : [...prev, interest]
    )
  }

  const handleSave = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      success('Preferences Saved', 'Your travel interests have been updated.')
      onClose()
    }, 1500)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 transition-opacity duration-300">
      <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl w-full max-w-lg m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Travel Interests</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-white mb-3">My Interests</h3>
            <div className="flex flex-wrap gap-3">
              {interests.map(interest => (
                <InterestTag
                  key={interest}
                  label={interest}
                  selected={selectedInterests.includes(interest)}
                  onClick={() => handleToggleInterest(interest)}
                />
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-3">Typical Budget</h3>
            <div className="flex gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
              <BudgetSegment label="Economy" value="economy" selected={budget === 'economy'} onClick={setBudget} />
              <BudgetSegment label="Comfortable" value="comfortable" selected={budget === 'comfortable'} onClick={setBudget} />
              <BudgetSegment label="Luxury" value="luxury" selected={budget === 'luxury'} onClick={setBudget} />
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
