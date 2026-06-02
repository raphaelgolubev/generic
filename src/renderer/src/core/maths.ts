import { get } from 'svelte/store'
import { offsetX, offsetY, scale } from './state'
import type { ResizeHandle, SceneObject } from '../types'

export function screenToWorld(clientX: number, clientY: number): { x: number; y: number } {
  const s = get(scale)
  const ox = get(offsetX)
  const oy = get(offsetY)

  return {
    x: (clientX - ox) / s,
    y: (clientY - oy) / s
  }
}

/**
 * Округление значения до ближайшего шага сетки.
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize
}

/**
 * Трансформация (ресайз или перемещение) одиночного объекта сцены.
 */
export function transformSceneObject(
  obj: SceneObject,
  deltaX: number,
  deltaY: number,
  handle: ResizeHandle,
  gridSize: number
): SceneObject {
  const s = obj as any
  // Инициализируем "точные" накопители, если их еще нет
  s.pX = s.pX ?? obj.x
  s.pY = s.pY ?? obj.y
  s.pW = s.pW ?? obj.width
  s.pH = s.pH ?? obj.height

  if (handle) {
    // --- ЛОГИКА РЕЗАЙЗА С ЗАЩИТОЙ ОТ ИНВЕРСИИ ---
    if (handle.includes('t')) {
      const maxDeltaY = s.pH - gridSize
      const clampedDeltaY = Math.min(deltaY, maxDeltaY)
      s.pY += clampedDeltaY
      s.pH -= clampedDeltaY
    }

    if (handle.includes('b')) {
      s.pH += deltaY
      if (s.pH < gridSize) s.pH = gridSize
    }

    if (handle.includes('l')) {
      const maxDeltaX = s.pW - gridSize
      const clampedDeltaX = Math.min(deltaX, maxDeltaX)
      s.pX += clampedDeltaX
      s.pW -= clampedDeltaX
    }

    if (handle.includes('r')) {
      s.pW += deltaX
      if (s.pW < gridSize) s.pW = gridSize
    }

    return {
      ...obj,
      x: snapToGrid(s.pX, gridSize),
      y: snapToGrid(s.pY, gridSize),
      width: Math.max(gridSize, snapToGrid(s.pW, gridSize)),
      height: Math.max(gridSize, snapToGrid(s.pH, gridSize))
    } as SceneObject
  } else {
    // --- ЛОГИКА ПЕРЕМЕЩЕНИЯ ---
    s.pX += deltaX
    s.pY += deltaY

    return {
      ...obj,
      x: snapToGrid(s.pX, gridSize),
      y: snapToGrid(s.pY, gridSize)
    } as SceneObject
  }
}
