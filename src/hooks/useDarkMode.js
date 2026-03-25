import { useState, useEffect } from 'react'

const DARK_MODE_KEY = 'diagramr_dark_mode'

export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem(DARK_MODE_KEY)
    if (saved !== null) {
      return saved === 'true'
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    localStorage.setItem(DARK_MODE_KEY, isDarkMode)
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const toggle = () => setIsDarkMode(!isDarkMode)

  return { isDarkMode, toggle }
}
