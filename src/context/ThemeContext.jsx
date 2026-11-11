import { useEffect, useLayoutEffect, useState } from 'react'
import { ThemeContext } from './theme-context.js'
import { useAuth } from './auth-context.js'
import { readSettings } from '../utils/account-storage.js'

const STORAGE_KEY = 'bridgeai-theme'

function getSavedPreference() {
  try {
    const savedPreference = window.localStorage.getItem(STORAGE_KEY)
    if (['system', 'light', 'dark'].includes(savedPreference)) {
      return savedPreference[0].toUpperCase() + savedPreference.slice(1)
    }
  } catch {
    return 'System'
  }
  return 'System'
}

function getSystemTheme() {
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
    ? 'dark'
    : 'light'
}

function saveDevicePreference(preference) {
  try {
    window.localStorage.setItem(STORAGE_KEY, preference.toLowerCase())
  } catch {
    return false
  }
  return true
}

function ThemePreferenceProvider({ children, user, loading }) {
  const [systemTheme, setSystemTheme] = useState(getSystemTheme)
  const [preference, setPreference] = useState(() =>
    !loading && user
      ? readSettings(user.uid).settings.theme
      : getSavedPreference(),
  )
  const theme = preference === 'System' ? systemTheme : preference.toLowerCase()

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mediaQuery) return undefined

    const updateSystemTheme = (event) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }
    mediaQuery.addEventListener('change', updateSystemTheme)
    return () => mediaQuery.removeEventListener('change', updateSystemTheme)
  }, [])

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
    saveDevicePreference(preference)
  }, [preference, theme])

  function setThemePreference(nextPreference) {
    if (!['System', 'Light', 'Dark'].includes(nextPreference)) {
      throw new Error('Theme preference must be System, Light, or Dark.')
    }

    setPreference(nextPreference)
  }

  return (
    <ThemeContext.Provider value={{ theme, preference, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function ThemeProvider({ children }) {
  const { user, loading } = useAuth()
  const providerKey = loading ? 'loading' : user?.uid ?? 'signed-out'

  return (
    <ThemePreferenceProvider key={providerKey} user={user} loading={loading}>
      {children}
    </ThemePreferenceProvider>
  )
}
