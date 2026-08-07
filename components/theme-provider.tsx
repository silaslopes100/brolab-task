'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type ThemeName = 'dark' | 'clean' | 'warm'

const STORAGE_KEY = 'bro:theme'

const ThemeContext = createContext<{
  theme: ThemeName
  setTheme: (theme: ThemeName) => void
}>({
  theme: 'dark',
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('dark')

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved === 'dark' || saved === 'clean' || saved === 'warm') {
        setThemeState(saved)
      }
    } catch {
      // localStorage indisponível — mantém o padrão
    }
  }, [])

  useEffect(() => {
    document.body.classList.remove('theme-dark', 'theme-clean', 'theme-warm')
    document.body.classList.add(`theme-${theme}`)
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // localStorage indisponível — tema vale só para a sessão
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
