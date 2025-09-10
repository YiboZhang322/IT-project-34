import Image from 'next/image'

interface UserAvatarProps {
  src?: string
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
  showOnlineStatus?: boolean
  isOnline?: boolean
}

export default function UserAvatar({ 
  src, 
  name, 
  size = 'md', 
  className = '',
  showOnlineStatus = false,
  isOnline = false
}: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-32 h-32 text-2xl'
  }
  
  const onlineIndicatorSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5'
  }

  // Generate initials from name with safety check
  const safeName = name || 'User'
  const initials = safeName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Generate a consistent color based on name
  const getAvatarColor = (name: string) => {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const colors = [
      'from-red-500 to-red-600',
      'from-blue-500 to-blue-600', 
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
      'from-yellow-500 to-yellow-600',
      'from-teal-500 to-teal-600'
    ]
    return colors[Math.abs(hash) % colors.length]
  }

  return (
    <div className={`relative ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center font-semibold text-white relative`}>
        {src ? (
          <Image
            src={src}
            alt={safeName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getAvatarColor(safeName)} flex items-center justify-center`}>
            {initials}
          </div>
        )}
      </div>
      
      {showOnlineStatus && (
        <div className={`absolute -bottom-0.5 -right-0.5 ${onlineIndicatorSizes[size]} rounded-full border-2 border-gray-900 ${
          isOnline ? 'bg-green-500' : 'bg-gray-400'
        }`} />
      )}
    </div>
  )
}
