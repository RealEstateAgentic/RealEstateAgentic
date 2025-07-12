import { useEffect, useState } from 'react'

export const useTheme = () => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check initial theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches

    const shouldBeDark =
      savedTheme === 'dark' || (!savedTheme && systemPrefersDark)
    setIsDark(shouldBeDark)

    // Apply theme to document
    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)

    // Update localStorage
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')

    // Update document class
    if (newTheme) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return { isDark, toggleTheme }
}
