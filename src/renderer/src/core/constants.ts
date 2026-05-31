import { writable } from 'svelte/store'
import type { CanvasObject } from '../types'

export const Mouse = {
  mouseX: 0,
  mouseY: 0,
  worldMouseX: 0,
  worldMouseY: 0
}
export const mouse = writable(Mouse)

export const theme = {
  accentColor: '#ffb800',
  accentColorTint: '#fff6df',
  canvasBackgroundColor: '#fbfbfb',
  gridDotsColor: '#e0e0e0',
  selectionStrokeColor: '#0b84fe',
  selectionSquareColor: 'rgba(11, 132, 254, 0.05)'
} as const

export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 6.0
export const GRID_SIZE = 10
export const objects = writable<CanvasObject[]>([])
export const selectedIds = writable<string[]>([])
export const scale = writable(3)
export const offsetX = writable(0)
export const offsetY = writable(0)
export const isAnyBarHovered = writable(false)
