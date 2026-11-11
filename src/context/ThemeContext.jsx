import { useEffect, useState } from 'react'
import { ThemeContext } from './theme-context.js'

const STORAGE_KEY = 'bridgeai-theme'

function getSystemTheme() {
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
    ? 'dark'
    : 'light'
}

function getSavedTheme() {
  try {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY)
    return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : null
  } catch {
    return null
  }
}

export function ThemeProvider({ children }) {
  const [systemTheme, setSystemTheme] = useState(getSystemTheme)
  const [preference, setPreference] = useState(getSavedTheme)
  const theme = preference ?? systemTheme

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mediaQuery) return undefined

    const updateSystemTheme = (event) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }
    mediaQuery.addEventListener('change', updateSystemTheme)
    return () => mediaQuery.removeEventListener('change', updateSystemTheme)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  function toggleTheme() {
    const nextPreference = theme === 'dark' ? 'light' : 'dark'
    setPreference(nextPreference)
    try {
      window.localStorage.setItem(STORAGE_KEY, nextPreference)
    } catch {
      // The selected theme remains active for this page even when storage is unavailable.
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
