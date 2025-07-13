import { useEffect, useState } from 'react'

interface LogoProps {
  className?: string
  onClick?: () => void
}

export const Logo: React.FC<LogoProps> = ({ className = '', onClick }) => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark')
      setIsDark(isDarkMode)
    }

    checkTheme()

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  return (
    <button
      onClick={onClick}
      className={`flex items-center hover:opacity-80 transition-opacity ${className}`}
    >
      <img
        src={isDark ? '/aigenticProDark.svg' : '/aigenticProLight.svg'}
        alt="AIgent Pro"
        className="h-16 w-auto"
      />
      <span className="ml-3 text-2xl font-semibold text-gray-800 dark:text-gray-200 hidden sm:block hover:text-[#3B7097] dark:hover:text-[#75BDE0] transition-colors">
        AIgent Pro
      </span>
    </button>
  )
}
