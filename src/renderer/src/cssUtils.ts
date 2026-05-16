export function applyTheme(node: HTMLElement, themeObject: Record<string, string>) {
  const updateTheme = (theme: Record<string, string>) => {
    Object.entries(theme).forEach(([key, value]) => {
      // Превращаем camelCase (accentColor) в kebab-case (--accent-color)
      const cssKey = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
      console.log(`ApplyTheme: ${cssKey}`)
      node.style.setProperty(cssKey, value)
    })
  }

  updateTheme(themeObject)

  return {
    update(newTheme: Record<string, string>) {
      updateTheme(newTheme)
    }
  }
}
