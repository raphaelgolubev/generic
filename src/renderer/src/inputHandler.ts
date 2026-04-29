import { get } from 'svelte/store'
import { objects, selectedIds, scale, offsetX, offsetY, sceneActions } from './store'
import type { Tool, ShapeType, SceneObject, ResizeHandle, ArrowObject, CanvasObject } from './types'

export class InputHandler {
  private isPanning = false
  private draggedId: string | null = null
  private isResizing = false
  private activeHandle: ResizeHandle = null
  private isDrawingArrow: boolean = false
  private activeArrowHandle: 'start' | 'end' | null = null

  private selectionStart: { x: number; y: number } | null = null
  // публичный для доступа из компонента
  public currentMarquee: { x: number; y: number; w: number; h: number } | null = null

  getHitObject(clientX: number, clientY: number): CanvasObject | undefined {
    const { x, y } = sceneActions.screenToWorld(clientX, clientY)
    const objs = get(objects)
    const s = get(scale)
    const threshold = 15 / s // чувствительность клика

    return [...objs].reverse().find((obj) => {
      // ЛОГИКА ДЛЯ СТРЕЛОК
      if (obj.type === 'arrow') {
        const { start, end, mode } = obj

        if (mode === 'straight') {
          // расстояние от точки (x,y) до отрезка
          const l2 = (start.x - end.x) ** 2 + (start.y - end.y) ** 2
          if (l2 === 0) return Math.hypot(x - start.x, y - start.y) < threshold

          let t = ((x - start.x) * (end.x - start.x) + (y - start.y) * (end.y - start.y)) / l2
          t = Math.max(0, Math.min(1, t))

          const dist = Math.hypot(
            x - (start.x + t * (end.x - start.x)),
            y - (start.y + t * (end.y - start.y))
          )
          return dist < threshold
        } else {
          // для Orthogonal и Bezier проверяем близость к концам или середине изгиба
          const midX = (start.x + end.x) / 2
          const midY = (start.y + end.y) / 2
          const distStart = Math.hypot(x - start.x, y - start.y)
          const distEnd = Math.hypot(x - end.x, y - end.y)
          const distMid = Math.hypot(x - midX, y - midY)

          return distStart < threshold || distEnd < threshold || distMid < threshold
        }
      }

      // ЛОГИКА ДЛЯ ПРЯМОУГОЛЬНЫХ ФИГУР
      return x >= obj.x && x <= obj.x + obj.width && y >= obj.y && y <= obj.y + obj.height
    })
  }

  private getSnapPoint(x: number, y: number, excludeId: string | null): { x: number; y: number } {
    const objs = get(objects)
    const s = get(scale)
    const snapThreshold = 20 / s // дистанция срабатывания магнита

    for (const obj of objs) {
      if (obj.type === 'arrow' || obj.id === excludeId) continue

      // ьточки на серединах сторон объекта
      const points = [
        { x: obj.x + obj.width / 2, y: obj.y }, // Top
        { x: obj.x + obj.width, y: obj.y + obj.height / 2 }, // Right
        { x: obj.x + obj.width / 2, y: obj.y + obj.height }, // Bottom
        { x: obj.x, y: obj.y + obj.height / 2 } // Left
      ]

      for (const p of points) {
        const dist = Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2)
        if (dist < snapThreshold) return p // магнитим к объекту
      }
    }

    // Если рядом нет объектов, магнитим к сетке
    return {
      x: sceneActions.snapToGrid(x),
      y: sceneActions.snapToGrid(y)
    }
  }

  handleMouseDown(
    e: MouseEvent,
    activeTool: Tool,
    activeShape: ShapeType,
    isSpacePressed: boolean
  ) {
    const { x, y } = sceneActions.screenToWorld(e.clientX, e.clientY)
    const s = get(scale)
    const objs = get(objects)
    const currentSelectedIds = get(selectedIds)

    if (currentSelectedIds.length === 1) {
      const obj = objs.find((o) => o.id === currentSelectedIds[0])

      if (obj && obj.type === 'arrow') {
        const handleSize = 15 / s
        // Проверяем попадание в начало или конец стрелки
        if (Math.abs(x - obj.start.x) < handleSize && Math.abs(y - obj.start.y) < handleSize) {
          this.activeArrowHandle = 'start'
          this.draggedId = obj.id
          return
        } else if (Math.abs(x - obj.end.x) < handleSize && Math.abs(y - obj.end.y) < handleSize) {
          this.activeArrowHandle = 'end'
          this.draggedId = obj.id
          return
        }
      }

      if (obj && obj.type !== 'arrow') {
        const handleSize = 15 / s

        if (Math.abs(x - obj.x) < handleSize && Math.abs(y - obj.y) < handleSize)
          this.activeHandle = 'tl'
        else if (Math.abs(x - (obj.x + obj.width)) < handleSize && Math.abs(y - obj.y) < handleSize)
          this.activeHandle = 'tr'
        else if (
          Math.abs(x - obj.x) < handleSize &&
          Math.abs(y - (obj.y + obj.height)) < handleSize
        )
          this.activeHandle = 'bl'
        else if (
          Math.abs(x - (obj.x + obj.width)) < handleSize &&
          Math.abs(y - (obj.y + obj.height)) < handleSize
        )
          this.activeHandle = 'br'

        if (this.activeHandle) {
          this.isResizing = true
          this.draggedId = obj.id
          return
        }
      }
    }

    if (activeTool === 'hand' || isSpacePressed || e.button === 1) {
      this.isPanning = true
      return
    }

    const hit = this.getHitObject(e.clientX, e.clientY)

    if (activeTool === 'select') {
      if (hit) {
        selectedIds.update((ids) => {
          if (e.shiftKey) {
            return ids.includes(hit.id) ? ids.filter((id) => id !== hit.id) : [...ids, hit.id]
          }
          return ids.includes(hit.id) ? ids : [hit.id]
        })
        this.draggedId = hit.id
      } else {
        // начинаем рисовать рамку
        this.selectionStart = { x, y }
        selectedIds.set([])

        this.currentMarquee = null
        this.selectionStart = { x, y }
      }
    } else if (activeTool === 'shape') {
      sceneActions.addObject(x, y, activeShape, activeShape === 'sticky' ? '#fff7d1' : '#ffffff')
    } else if (activeTool === 'arrow') {
      const id = sceneActions.addArrow(x, y)
      this.draggedId = id
      this.isDrawingArrow = true
      selectedIds.set([id])
      return
    }

    // if (activeTool === 'arrow') {
    //   const { x, y } = sceneActions.screenToWorld(e.clientX, e.clientY)
    //   const newArrow: ArrowObject = {
    //     id: Date.now().toString(),
    //     type: 'arrow',
    //     start: { x, y },
    //     end: { x, y },
    //     startHead: 'none',
    //     endHead: 'arrow',
    //     color: '#18a0fb'
    //   }
    //   objects.update((objs) => [...objs, newArrow])
    //   this.draggedId = newArrow.id
    //   this.isDrawingArrow = true
    //   return
    // }
  }

  handleMouseMove(e: MouseEvent) {
    const s = get(scale)

    // логика рамки выделения
    if (this.selectionStart) {
      const { x, y } = sceneActions.screenToWorld(e.clientX, e.clientY)

      this.currentMarquee = {
        x: Math.min(x, this.selectionStart.x),
        y: Math.min(y, this.selectionStart.y),
        w: Math.abs(x - this.selectionStart.x),
        h: Math.abs(y - this.selectionStart.y)
      }

      // выделяем объекты, попавшие в рамку
      const marquee = this.currentMarquee
      const objs = get(objects)
      const hitIds = objs
        .filter((obj) => {
          if (obj.type === 'arrow') {
            // проверяем, попадают ли обе точки (start и end) в рамку
            return (
              obj.start.x >= marquee.x &&
              obj.start.x <= marquee.x + marquee.w &&
              obj.start.y >= marquee.y &&
              obj.start.y <= marquee.y + marquee.h &&
              obj.end.x >= marquee.x &&
              obj.end.x <= marquee.x + marquee.w &&
              obj.end.y >= marquee.y &&
              obj.end.y <= marquee.y + marquee.h
            )
          }

          // Для обычных фигур
          return (
            obj.x < marquee.x + marquee.w &&
            obj.x + obj.width > marquee.x &&
            obj.y < marquee.y + marquee.h &&
            obj.y + obj.height > marquee.y
          )
        })
        .map((o) => o.id)

      selectedIds.set(hitIds)
      return
    }

    // рисование новой стрелки
    if (this.isDrawingArrow && this.draggedId) {
      const { x, y } = sceneActions.screenToWorld(e.clientX, e.clientY)
      const snapped = this.getSnapPoint(x, y, this.draggedId)

      objects.update((objs) =>
        objs.map((obj) =>
          obj.id === this.draggedId && obj.type === 'arrow' ? { ...obj, end: snapped } : obj
        )
      )
      return
    }

    // при растягивании существующей за концы
    if (this.activeArrowHandle && this.draggedId) {
      const { x, y } = sceneActions.screenToWorld(e.clientX, e.clientY)
      const snapped = this.getSnapPoint(x, y, this.draggedId)

      objects.update((objs) =>
        objs.map((obj) => {
          if (obj.id === this.draggedId && obj.type === 'arrow') {
            return {
              ...obj,
              [this.activeArrowHandle as string]: snapped
            }
          }
          return obj
        })
      )
      return
    }

    if (this.isPanning) {
      offsetX.update((val) => val + e.movementX)
      offsetY.update((val) => val + e.movementY)
      return
    }

    if (this.draggedId) {
      const currentIds = get(selectedIds)

      // если объект часть группы — двигаем всю группу
      if (currentIds.includes(this.draggedId)) {
        currentIds.forEach((id) => {
          sceneActions.updateObject(id, e.movementX / s, e.movementY / s, this.activeHandle)
        })
      } else {
        sceneActions.updateObject(
          this.draggedId,
          e.movementX / s,
          e.movementY / s,
          this.activeHandle
        )
      }
    }
  }

  handleMouseUp() {
    if (this.draggedId) {
      // Если мы тащили группу, нужно финализировать всех
      const currentIds = get(selectedIds)
      if (currentIds.includes(this.draggedId)) {
        currentIds.forEach((id) => sceneActions.finalizeObject(id))
      } else {
        sceneActions.finalizeObject(this.draggedId)
      }
    }

    this.isPanning = false
    this.isResizing = false
    this.draggedId = null
    this.selectionStart = null
    this.currentMarquee = null
    this.activeHandle = null
    this.isDrawingArrow = false
    this.activeArrowHandle = null
  }

  handleWheel(e: WheelEvent, minZoom: number, maxZoom: number) {
    e.preventDefault()
    if (e.ctrlKey) {
      const zoomSpeed = 0.01
      const delta = -e.deltaY
      const oldScale = get(scale)
      const newScale = Math.min(Math.max(minZoom, oldScale + delta * zoomSpeed), maxZoom)
      const mouseX = e.clientX
      const mouseY = e.clientY
      const ox = get(offsetX)
      const oy = get(offsetY)
      offsetX.set(mouseX - (mouseX - ox) * (newScale / oldScale))
      offsetY.set(mouseY - (mouseY - oy) * (newScale / oldScale))
      scale.set(newScale)
    } else {
      offsetX.update((val) => val - e.deltaX)
      offsetY.update((val) => val - e.deltaY)
    }
  }
}

export const inputHandler = new InputHandler()
