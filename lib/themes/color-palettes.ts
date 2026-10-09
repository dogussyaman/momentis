import type { CanvasDocument, CanvasElement } from "@/store/editor-store"

export type PaletteCategory = "Luxury" | "Romantic" | "Natural" | "Modern" | "Soft"
export type ThemeTokenName = "primary" | "secondary" | "accent" | "background" | "foreground"
export type ThemeColorToken = ThemeTokenName | "border" | "muted" | "surface" | "overlay"

export type PaletteColors = Record<ThemeTokenName, string>

export type ColorPalette = {
  id: string
  name: string
  description: string
  category: PaletteCategory
  colors: PaletteColors
  custom?: boolean
}

export const COLOR_PALETTES: ColorPalette[] = [
  { id: "champagne", name: "Champagne", description: "Sıcak ve zarif", category: "Luxury", colors: { primary: "#A67C45", secondary: "#D6C2A5", accent: "#E8DCCB", background: "#FAF7F2", foreground: "#292524" } },
  { id: "ivory-gold", name: "Ivory Gold", description: "Fildişi ve altın", category: "Luxury", colors: { primary: "#9B783E", secondary: "#D9C99E", accent: "#EEE5CF", background: "#FFFCF5", foreground: "#302B22" } },
  { id: "midnight-luxury", name: "Midnight Luxury", description: "Gece mavisi ve şampanya", category: "Luxury", colors: { primary: "#172033", secondary: "#39445C", accent: "#C9A96E", background: "#F5F1E8", foreground: "#15171C" } },
  { id: "black-pearl", name: "Black Pearl", description: "Siyah inci ve sıcak krem", category: "Luxury", colors: { primary: "#282526", secondary: "#6C5C57", accent: "#B99A70", background: "#F6F1E9", foreground: "#242122" } },
  { id: "burgundy-gold", name: "Burgundy Gold", description: "Bordo ve antik altın", category: "Luxury", colors: { primary: "#702F3B", secondary: "#A66B65", accent: "#C5A56A", background: "#FBF5EF", foreground: "#352426" } },
  { id: "rose-romance", name: "Rose Romance", description: "Romantik gül tonları", category: "Romantic", colors: { primary: "#A95568", secondary: "#D9A6AC", accent: "#F1D7D9", background: "#FFF8F7", foreground: "#3D292D" } },
  { id: "dusty-rose", name: "Dusty Rose", description: "Soluk gül ve sıcak taş", category: "Romantic", colors: { primary: "#94636B", secondary: "#C99DA0", accent: "#EAD9D4", background: "#FAF6F2", foreground: "#392D30" } },
  { id: "blush", name: "Blush", description: "Yumuşak pembe ve kum", category: "Romantic", colors: { primary: "#B76E79", secondary: "#E2B8B7", accent: "#F3DEDA", background: "#FFFAF8", foreground: "#422D31" } },
  { id: "soft-pink", name: "Soft Pink", description: "Narin pembe dokunuşlar", category: "Romantic", colors: { primary: "#A95F72", secondary: "#DDAFBA", accent: "#F5E2E5", background: "#FFF9FA", foreground: "#3B2C31" } },
  { id: "mauve", name: "Mauve", description: "Mürdüm ve gül kurusu", category: "Romantic", colors: { primary: "#76516E", secondary: "#B89AAF", accent: "#E5D8E2", background: "#FAF7FA", foreground: "#302832" } },
  { id: "sage-garden", name: "Sage Garden", description: "Adaçayı ve doğal krem", category: "Natural", colors: { primary: "#657A62", secondary: "#A8B69A", accent: "#E1E5D6", background: "#F7F7F0", foreground: "#2D382F" } },
  { id: "olive", name: "Olive", description: "Zeytin ve keten", category: "Natural", colors: { primary: "#687044", secondary: "#A9A77C", accent: "#E2DDC2", background: "#F8F6ED", foreground: "#333527" } },
  { id: "forest", name: "Forest", description: "Orman yeşili ve yosun", category: "Natural", colors: { primary: "#315A48", secondary: "#78947C", accent: "#D7E0D1", background: "#F5F7F1", foreground: "#26362F" } },
  { id: "earth", name: "Earth", description: "Toprak ve doğal taş", category: "Natural", colors: { primary: "#825E49", secondary: "#B99A7C", accent: "#E8DCCB", background: "#F8F4EE", foreground: "#372E28" } },
  { id: "terracotta", name: "Terracotta", description: "Kil ve gün batımı", category: "Natural", colors: { primary: "#A6533D", secondary: "#D18B6D", accent: "#EFD6C5", background: "#FCF6F0", foreground: "#422D27" } },
  { id: "minimal-beige", name: "Minimal Beige", description: "Sade bej ve espresso", category: "Modern", colors: { primary: "#75634F", secondary: "#B9AA98", accent: "#E8E0D5", background: "#FAF8F4", foreground: "#292724" } },
  { id: "black-ivory", name: "Black & Ivory", description: "Kontrastlı siyah ve fildişi", category: "Modern", colors: { primary: "#252525", secondary: "#77716A", accent: "#D7C8AE", background: "#FAF8F2", foreground: "#1F2021" } },
  { id: "midnight-blue", name: "Midnight Blue", description: "Lacivert ve gümüş mavi", category: "Modern", colors: { primary: "#243B5A", secondary: "#7187A0", accent: "#D4DDE5", background: "#F6F8FA", foreground: "#202A35" } },
  { id: "charcoal", name: "Charcoal", description: "Kömür ve sıcak gri", category: "Modern", colors: { primary: "#41464A", secondary: "#8A8D8C", accent: "#D8D5CE", background: "#F7F6F2", foreground: "#26282A" } },
  { id: "emerald", name: "Emerald", description: "Zümrüt ve şampanya", category: "Modern", colors: { primary: "#176B57", secondary: "#6E9B88", accent: "#D8E7DF", background: "#F6F8F3", foreground: "#20342E" } },
  { id: "lavender", name: "Lavender", description: "Lavanta ve menekşe", category: "Soft", colors: { primary: "#74618C", secondary: "#B2A4C5", accent: "#E5DFF0", background: "#FAF8FC", foreground: "#302B38" } },
  { id: "powder-blue", name: "Powder Blue", description: "Pudra mavisi ve bulut", category: "Soft", colors: { primary: "#587B91", secondary: "#9CB8C7", accent: "#DFEAF0", background: "#F8FBFC", foreground: "#26343B" } },
  { id: "cream", name: "Cream", description: "Kremsi tonlar ve bal", category: "Soft", colors: { primary: "#92713D", secondary: "#C7B58E", accent: "#EEE5D1", background: "#FBF8EF", foreground: "#332E24" } },
  { id: "nude", name: "Nude", description: "Nude ve yumuşak kahve", category: "Soft", colors: { primary: "#9B6E5A", secondary: "#C7A895", accent: "#EADDD2", background: "#FAF6F2", foreground: "#382D28" } },
  { id: "pearl", name: "Pearl", description: "İnci ve gümüş", category: "Soft", colors: { primary: "#687783", secondary: "#AEB9BE", accent: "#E3E8E8", background: "#FAFBFA", foreground: "#293237" } },
]

export const PALETTE_CATEGORIES = ["Tümü", "Luxury", "Romantic", "Natural", "Modern", "Soft"] as const
export const PALETTE_COLOR_KEYS: (keyof PaletteColors)[] = ["primary", "secondary", "accent", "background", "foreground"]
export const PALETTE_COLOR_LABELS: Record<keyof PaletteColors, string> = {
  primary: "Ana renk",
  secondary: "İkincil",
  accent: "Vurgu",
  background: "Zemin",
  foreground: "Metin",
}

export function normalizePaletteColors(colors: Partial<Record<ThemeTokenName, string>> | Record<string, string> | undefined): PaletteColors {
  const source = colors ?? {}
  return {
    primary: clampHex(String(source.primary ?? "#A67C45")) ?? "#A67C45",
    secondary: clampHex(String(source.secondary ?? "#D6C2A5")) ?? "#D6C2A5",
    accent: clampHex(String(source.accent ?? "#E8DCCB")) ?? "#E8DCCB",
    background: clampHex(String(source.background ?? "#FAF7F2")) ?? "#FAF7F2",
    foreground: clampHex(String(source.foreground ?? "#292524")) ?? "#292524",
  }
}

export function normalizePalette(palette: Partial<ColorPalette> | undefined): ColorPalette {
  const candidate = palette ?? COLOR_PALETTES[0]
  return {
    id: candidate.id ?? "custom-palette",
    name: candidate.name ?? "Özel palet",
    description: candidate.description ?? "Özel düzenlenmiş palet",
    category: candidate.category ?? "Luxury",
    colors: normalizePaletteColors(candidate.colors),
    custom: Boolean(candidate.custom),
  }
}

const DEFAULT_ACCENTS = ["#C9A96E", "#D9A441", "#B8742A", "#C7A76C", "#D6C2A5", "#E8DCCB"]
const DEFAULT_DARKS = ["#1C2430", "#101827", "#3B2F27", "#3B3320", "#292524", "#172033", "#15171C", "#242122", "#352426"]
const clampHex = (value: string) => /^#[0-9a-f]{6}$/i.test(value) ? value.toUpperCase() : null

function luminance(hex: string) {
  const rgb = hex.match(/[a-f\d]{2}/gi)?.map((value) => {
    const channel = parseInt(value, 16) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  }) ?? [0, 0, 0]
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
}

function isThemeToken(value: string): value is ThemeTokenName {
  return ["primary", "secondary", "accent", "background", "foreground"].includes(value)
}

function resolveTokenForLegacyHex(hex: string, element: CanvasElement, index: number): ThemeTokenName {
  const color = clampHex(hex)
  if (!color) return "primary"

  if (element.type === "text") {
    if (DEFAULT_DARKS.includes(color)) return "foreground"
    if (DEFAULT_ACCENTS.includes(color)) return "primary"
    return "foreground"
  }

  if (DEFAULT_DARKS.includes(color)) return "foreground"
  if (DEFAULT_ACCENTS.includes(color)) return "accent"

  const light = luminance(color)
  if (light > 0.82) return "background"
  if (light > 0.52) return "secondary"
  if (light > 0.26) return "accent"
  return index % 2 === 0 ? "primary" : "foreground"
}

function resolveElementColorToken(element: CanvasElement, key: "fill" | "stroke" | "color", value: string, index: number): ThemeTokenName {
  const tokenKey = `${key}Token` as "fillToken" | "strokeToken" | "colorToken"
  const token = typeof element[tokenKey] === "string" && isThemeToken(element[tokenKey])
    ? element[tokenKey]
    : null

  if (token) return token

  const hex = clampHex(value)
  if (!hex) return key === "color" ? "foreground" : "primary"

  return resolveTokenForLegacyHex(hex, element, index)
}

function solidizePaletteColor(value: string, palette: ColorPalette, token: ThemeTokenName) {
  const themeColor = palette.colors[token]
  return typeof themeColor === "string" && /^#[0-9a-f]{6}$/i.test(themeColor) ? themeColor.toUpperCase() : value
}

function recolorVectorContent(content: string, element: CanvasElement, index: number, palette: ColorPalette) {
  return content.replace(/(fill|stroke|color)\s*=\s*("|\x27)([^"\x27]+)\2/gi, (match, property, quote, value) => {
    const normalizedValue = value.trim()
    if (!normalizedValue || normalizedValue === "none" || normalizedValue === "transparent" || normalizedValue === "currentColor" || normalizedValue.startsWith("var(") || normalizedValue.startsWith("url(")) {
      return match
    }

    const hex = clampHex(normalizedValue)
    if (!hex) return match

    const token = resolveElementColorToken(element, property.toLowerCase() as "fill" | "stroke" | "color", hex, index)
    return `${property}=${quote}${solidizePaletteColor(hex, palette, token)}${quote}`
  })
}

export function applyPaletteToDesign(design: CanvasDocument, palette: ColorPalette): CanvasDocument {
  return {
    ...design,
    background: palette.colors.background,
    palette: { id: palette.id, name: palette.name, colors: palette.colors },
    elements: design.elements.map((element, index) => {
      if (element.type === "image") return element
      const updated = { ...element }

      if (typeof updated.fill === "string") {
        const fillToken = resolveElementColorToken(updated, "fill", updated.fill, index)
        updated.fillToken = fillToken
        updated.fill = solidizePaletteColor(updated.fill, palette, fillToken)
      }

      if (typeof updated.stroke === "string") {
        const strokeToken = resolveElementColorToken(updated, "stroke", updated.stroke, index)
        updated.strokeToken = strokeToken
        updated.stroke = solidizePaletteColor(updated.stroke, palette, strokeToken)
      }

      if (typeof updated.color === "string") {
        const colorToken = resolveElementColorToken(updated, "color", updated.color, index)
        updated.colorToken = colorToken
        updated.color = solidizePaletteColor(updated.color, palette, colorToken)
      }

      if (typeof updated.svgContent === "string") {
        updated.svgContent = recolorVectorContent(updated.svgContent, updated, index, palette)
      }

      return updated
    }),
  }
}

export function getContrastRatio(foreground: string, background: string) {
  const fg = clampHex(foreground)
  const bg = clampHex(background)
  if (!fg || !bg) return 1
  const values = [luminance(fg), luminance(bg)].sort((a, b) => b - a)
  return (values[0] + 0.05) / (values[1] + 0.05)
}

export function createRandomPalette() {
  return COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)]
}
