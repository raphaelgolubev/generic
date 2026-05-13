import { writable, get } from 'svelte/store'
import type { CanvasObject, SceneObject, ArrowObject, ShapeType, ResizeHandle } from './types'

// константы
export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 6.0
export const GRID_SIZE = 10
export const objects = writable<CanvasObject[]>([])
export const selectedIds = writable<string[]>([])
export const scale = writable(1)
export const offsetX = writable(0)
export const offsetY = writable(0)

// чисто для дебага
export const Mouse = {
  mouseX: 0,
  mouseY: 0,
  worldMouseX: 0,
  worldMouseY: 0
}

export const mouse = writable(Mouse)

// цвета
export const theme = {
  accentColor: '#98fb87',
  canvasBackgroundColor: '#fbfbfb',
  gridDotsColor: '#e0e0e0',
  selectionStrokeColor: '#18a0fb',
  selectionSquareColor: 'rgba(24, 160, 251, 0.1)'
} as const

// логика обработки действий
export const sceneActions = {
  finalizeObject: (id: string) => {
    objects.update((objs) =>
      objs.map((obj) => {
        if (obj.id !== id) return obj

        // для стрелок точные накопители обычно не нужны или очищаются иначе
        if (obj.type === 'arrow') return obj

        // Создаем копию без временных p-свойств
        const { pX, pY, pW, pH, ...rest } = obj as any
        return rest as SceneObject
      })
    )
  },

  snapToGrid: (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE,

  addObject: (x: number, y: number, type: ShapeType, color: string) => {
    const id = Date.now().toString()
    const initialSize = GRID_SIZE * 8
    const offset = initialSize / 2
    const newObj: SceneObject = {
      id,
      type,
      x: sceneActions.snapToGrid(x - offset),
      y: sceneActions.snapToGrid(y - offset),
      width: initialSize,
      height: initialSize,
      color,
      text: 'Text',
      isSelected: false
    }
    objects.update((objs) => [...objs, newObj])
    selectedIds.set([id])
  },

  addArrow: (startX: number, startY: number) => {
    const id = Date.now().toString()
    const newArrow: ArrowObject = {
      id,
      type: 'arrow',
      mode: 'orthogonal',
      color: '#a7a7a7',
      start: { x: startX, y: startY },
      end: { x: startX, y: startY },
      startHead: 'none',
      endHead: 'arrow',
      orthogonalOffset: 0
    }
    objects.update((objs) => [...objs, newArrow])
    return id
  },

  deleteSelected: () => {
    const ids = get(selectedIds) // теперь это массив строк [id1, id2, ...]

    if (ids.length > 0) {
      objects.update((objs) =>
        // оставляем только те объекты, чьих ID НЕТ в списке выбранных
        objs.filter((obj) => !ids.includes(obj.id))
      )

      // очищаем список выбранных (пустой массив вместо null)
      selectedIds.set([])
    }
  },

  updateObject: (id: string, deltaX: number, deltaY: number, handle: ResizeHandle = null) => {
    objects.update((objs) =>
      objs.map((obj) => {
        if (obj.id !== id) return obj

        // --- ЛОГИКА ДЛЯ СТРЕЛОК ---
        if (obj.type === 'arrow') return obj

        const s = obj as any
        // Инициализируем "точные" накопители, если их еще нет
        s.pX = s.pX ?? obj.x
        s.pY = s.pY ?? obj.y
        s.pW = s.pW ?? obj.width
        s.pH = s.pH ?? obj.height

        // if (handle) {
        //   // --- ЛОГИКА РЕЗАЙЗА ---
        //   if (handle.includes('t')) {
        //     s.pY += deltaY
        //     s.pH -= deltaY
        //   }
        //   if (handle.includes('b')) {
        //     s.pH += deltaY
        //   }
        //   if (handle.includes('l')) {
        //     s.pX += deltaX
        //     s.pW -= deltaX
        //   }
        //   if (handle.includes('r')) {
        //     s.pW += deltaX
        //   }

        //   return {
        //     ...obj,
        //     x: sceneActions.snapToGrid(s.pX),
        //     y: sceneActions.snapToGrid(s.pY),
        //     width: Math.max(GRID_SIZE, sceneActions.snapToGrid(s.pW)),
        //     height: Math.max(GRID_SIZE, sceneActions.snapToGrid(s.pH))
        //   }
        // } else {
        if (handle) {
          // --- ЛОГИКА РЕЗАЙЗА С ЗАЩИТОЙ ОТ ИНВЕРСИИ ---

          if (handle.includes('t')) {
            // вычисляем, сколько МАКСИМУМ мы можем забрать у высоты,
            // чтобы она не стала меньше GRID_SIZE
            const maxDeltaY = s.pH - GRID_SIZE
            // ограничиваем дельту
            const clampedDeltaY = Math.min(deltaY, maxDeltaY)

            s.pY += clampedDeltaY
            s.pH -= clampedDeltaY
          }

          if (handle.includes('b')) {
            s.pH += deltaY
            if (s.pH < GRID_SIZE) s.pH = GRID_SIZE // защита от ухода в минус
          }

          if (handle.includes('l')) {
            // точно такое же ограничение для ширины при изменении левой границы
            const maxDeltaX = s.pW - GRID_SIZE
            const clampedDeltaX = Math.min(deltaX, maxDeltaX)

            s.pX += clampedDeltaX
            s.pW -= clampedDeltaX
          }

          if (handle.includes('r')) {
            s.pW += deltaX
            if (s.pW < GRID_SIZE) s.pW = GRID_SIZE // защита от ухода в минус
          }

          return {
            ...obj,
            x: sceneActions.snapToGrid(s.pX),
            y: sceneActions.snapToGrid(s.pY),
            width: Math.max(GRID_SIZE, sceneActions.snapToGrid(s.pW)),
            height: Math.max(GRID_SIZE, sceneActions.snapToGrid(s.pH))
          }
        } else {
          // --- ЛОГИКА ПЕРЕМЕЩЕНИЯ ---
          s.pX += deltaX
          s.pY += deltaY

          return {
            ...obj,
            x: sceneActions.snapToGrid(s.pX),
            y: sceneActions.snapToGrid(s.pY)
          }
        }
      })
    )
  },

  moveSelected: (direction: 'front' | 'back') => {
    const ids = get(selectedIds)
    if (ids.length === 0) return

    objects.update((objs) => {
      const selected = objs.filter((o) => ids.includes(o.id))
      const remaining = objs.filter((o) => !ids.includes(o.id))

      if (direction === 'front') {
        return [...remaining, ...selected] // Перемещаем в конец массива
      } else {
        return [...selected, ...remaining] // Перемещаем в начало массива
      }
    })
  }
}
