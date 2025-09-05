interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'orange' | 'white' | 'blue' | 'red'
  className?: string
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'orange',
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }
  
  const colorClasses = {
    orange: 'border-orange-500/30 border-t-orange-500',
    white: 'border-white/30 border-t-white',
    blue: 'border-blue-500/30 border-t-blue-500',
    red: 'border-red-500/30 border-t-red-500'
  }
  
  return (
    <div 
      className={`${sizeClasses[size]} border-2 ${colorClasses[color]} rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}
