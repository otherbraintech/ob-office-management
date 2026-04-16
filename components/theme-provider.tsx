"use client"

import * as React from "react"

export type Theme = "dark" | "light"

const ThemeContext = React.createContext<{
  theme: Theme
  setTheme: (theme: Theme) => void
}>({
  theme: "dark",
  setTheme: () => null,
})

export const useTheme = () => React.useContext(ThemeContext)

export function ThemeProvider({
  children,
  initialTheme = "dark",
}: {
  children: React.ReactNode
  initialTheme?: Theme
}) {
  const [theme, setTheme] = React.useState<Theme>(initialTheme)

  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    // Guardar en cookie para que el servidor lo sepa en la próxima carga
    document.cookie = `theme=${newTheme}; path=/; max-age=31536000` // 1 año
  }

  React.useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme: updateTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
