import { writable } from 'svelte/store'
import type { CanvasObject } from '../types'

export const objects = writable<CanvasObject[]>([])
export const selectedIds = writable<string[]>([])
export const scale = writable(3)
export const offsetX = writable(0)
export const offsetY = writable(0)
export const isAnyBarHovered = writable(false)

export const Mouse = {
  mouseX: 0,
  mouseY: 0,
  worldMouseX: 0,
  worldMouseY: 0
}
export const mouse = writable(Mouse)
