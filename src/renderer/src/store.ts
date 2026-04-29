import { writable, get } from 'svelte/store'
import type { CanvasObject, SceneObject, ArrowObject, ShapeType, ResizeHandle } from './types'

// константы
export const GRID_SIZE = 30
export const objects = writable<CanvasObject[]>([])
export const selectedIds = writable<string[]>([])
export const scale = writable(1)
export const offsetX = writable(0)
export const offsetY = writable(0)

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

  // вспомогательная функция для перевода экранных координат в мировые
  screenToWorld(clientX: number, clientY: number): { x: number; y: number } {
    const s = get(scale)
    const ox = get(offsetX)
    const oy = get(offsetY)

    return {
      x: (clientX - ox) / s,
      y: (clientY - oy) / s
    }
  },

  snapToGrid: (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE,

  addObject: (x: number, y: number, type: ShapeType, color: string) => {
    const id = Date.now().toString()
    const newObj: SceneObject = {
      id,
      type,
      x: sceneActions.snapToGrid(x - 45),
      y: sceneActions.snapToGrid(y - 45),
      width: 90,
      height: 90,
      color,
      text: 'Text',
      isSelected: false
      // preciseX: 0,
      // preciseY: 0,
      // preciseWidth: 0,
      // preciseHeight: 0
    }
    objects.update((objs) => [...objs, newObj])
    // selectedIds.update((ids) => [...ids, id])
    selectedIds.set([id])
  },

  addArrow: (startX: number, startY: number) => {
    const id = Date.now().toString()
    const newArrow: ArrowObject = {
      id,
      type: 'arrow',
      mode: 'orthogonal',
      color: '#18a0fb',
      start: { x: startX, y: startY },
      end: { x: startX, y: startY },
      startHead: 'none',
      endHead: 'arrow'
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
        if (obj.type === 'arrow') {
          // если тянем за саму стрелку (не за концы), перемещаем целиком
          return {
            ...obj,
            start: { x: obj.start.x + deltaX, y: obj.start.y + deltaY },
            end: { x: obj.end.x + deltaX, y: obj.end.y + deltaY }
          }
        }

        const s = obj as any
        // Инициализируем "точные" накопители, если их еще нет
        s.pX = s.pX ?? obj.x
        s.pY = s.pY ?? obj.y
        s.pW = s.pW ?? obj.width
        s.pH = s.pH ?? obj.height

        if (handle) {
          // --- ЛОГИКА РЕЗАЙЗА ---
          if (handle.includes('t')) {
            s.pY += deltaY
            s.pH -= deltaY
          }
          if (handle.includes('b')) {
            s.pH += deltaY
          }
          if (handle.includes('l')) {
            s.pX += deltaX
            s.pW -= deltaX
          }
          if (handle.includes('r')) {
            s.pW += deltaX
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
