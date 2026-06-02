import { get } from 'svelte/store'
import { objects, selectedIds } from './core/state'
import { GRID_SIZE } from './core/constants'
import type { SceneObject, ArrowObject, ShapeType, ResizeHandle } from './types'
import { snapToGrid, transformSceneObject } from './core/maths'

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

  addObject: (x: number, y: number, type: ShapeType, color: string) => {
    const id = Date.now().toString()
    const initialSize = GRID_SIZE * 8
    const offset = initialSize / 2
    const newObj: SceneObject = {
      id,
      type,
      x: snapToGrid(x - offset, GRID_SIZE),
      y: snapToGrid(y - offset, GRID_SIZE),
      width: initialSize,
      height: initialSize,
      color,
      text: 'Text',
      strokeColor: '#666666',
      strokeWidth: 3,
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
  //   objects.update((objs) =>
  //     objs.map((obj) => {
  //       if (obj.id !== id) return obj

  //       // --- ЛОГИКА ДЛЯ СТРЕЛОК ---
  //       if (obj.type === 'arrow') return obj

  //       const s = obj as any
  //       // Инициализируем "точные" накопители, если их еще нет
  //       s.pX = s.pX ?? obj.x
  //       s.pY = s.pY ?? obj.y
  //       s.pW = s.pW ?? obj.width
  //       s.pH = s.pH ?? obj.height

  //       // if (handle) {
  //       //   // --- ЛОГИКА РЕЗАЙЗА ---
  //       //   if (handle.includes('t')) {
  //       //     s.pY += deltaY
  //       //     s.pH -= deltaY
  //       //   }
  //       //   if (handle.includes('b')) {
  //       //     s.pH += deltaY
  //       //   }
  //       //   if (handle.includes('l')) {
  //       //     s.pX += deltaX
  //       //     s.pW -= deltaX
  //       //   }
  //       //   if (handle.includes('r')) {
  //       //     s.pW += deltaX
  //       //   }

  //       //   return {
  //       //     ...obj,
  //       //     x: sceneActions.snapToGrid(s.pX),
  //       //     y: sceneActions.snapToGrid(s.pY),
  //       //     width: Math.max(GRID_SIZE, sceneActions.snapToGrid(s.pW)),
  //       //     height: Math.max(GRID_SIZE, sceneActions.snapToGrid(s.pH))
  //       //   }
  //       // } else {
  //       if (handle) {
  //         // --- ЛОГИКА РЕЗАЙЗА С ЗАЩИТОЙ ОТ ИНВЕРСИИ ---

  //         if (handle.includes('t')) {
  //           // вычисляем, сколько МАКСИМУМ мы можем забрать у высоты,
  //           // чтобы она не стала меньше GRID_SIZE
  //           const maxDeltaY = s.pH - GRID_SIZE
  //           // ограничиваем дельту
  //           const clampedDeltaY = Math.min(deltaY, maxDeltaY)

  //           s.pY += clampedDeltaY
  //           s.pH -= clampedDeltaY
  //         }

  //         if (handle.includes('b')) {
  //           s.pH += deltaY
  //           if (s.pH < GRID_SIZE) s.pH = GRID_SIZE // защита от ухода в минус
  //         }

  //         if (handle.includes('l')) {
  //           // точно такое же ограничение для ширины при изменении левой границы
  //           const maxDeltaX = s.pW - GRID_SIZE
  //           const clampedDeltaX = Math.min(deltaX, maxDeltaX)

  //           s.pX += clampedDeltaX
  //           s.pW -= clampedDeltaX
  //         }

  //         if (handle.includes('r')) {
  //           s.pW += deltaX
  //           if (s.pW < GRID_SIZE) s.pW = GRID_SIZE // защита от ухода в минус
  //         }

  //         return {
  //           ...obj,
  //           x: sceneActions.snapToGrid(s.pX),
  //           y: sceneActions.snapToGrid(s.pY),
  //           width: Math.max(GRID_SIZE, sceneActions.snapToGrid(s.pW)),
  //           height: Math.max(GRID_SIZE, sceneActions.snapToGrid(s.pH))
  //         }
  //       } else {
  //         // --- ЛОГИКА ПЕРЕМЕЩЕНИЯ ---
  //         s.pX += deltaX
  //         s.pY += deltaY

  //         return {
  //           ...obj,
  //           x: sceneActions.snapToGrid(s.pX),
  //           y: sceneActions.snapToGrid(s.pY)
  //         }
  //       }
  //     })
  //   )
  // },

  updateObject: (id: string, deltaX: number, deltaY: number, handle: ResizeHandle = null) => {
    objects.update((objs) =>
      objs.map((obj) => {
        if (obj.id !== id) return obj
        // Вызываем чистую математическую функцию из core
        return transformSceneObject(obj as SceneObject, deltaX, deltaY, handle, GRID_SIZE)
      })
    )
  },

  moveSelected: (direction: 'front' | 'back') => {
    const ids = get(selectedIds)
    console.log('Selected IDs to move:', ids)
    if (ids.length === 0) return

    objects.update((objs) => {
      const selected = objs.filter((o) => ids.includes(o.id))
      const remaining = objs.filter((o) => !ids.includes(o.id))

      console.log(
        'Before move:',
        objs.map((o) => o.id)
      )
      const result =
        direction === 'front' ? [...remaining, ...selected] : [...selected, ...remaining]
      console.log(
        'After move:',
        result.map((o) => o.id)
      )

      return result
    })
  }
}
