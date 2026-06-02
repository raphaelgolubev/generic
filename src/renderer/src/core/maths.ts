import { get } from 'svelte/store'
import { offsetX, offsetY, scale } from './constants'

export function screenToWorld(clientX: number, clientY: number): { x: number; y: number } {
  const s = get(scale)
  const ox = get(offsetX)
  const oy = get(offsetY)

  return {
    x: (clientX - ox) / s,
    y: (clientY - oy) / s
  }
}
