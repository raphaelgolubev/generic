import { get } from 'svelte/store'
import { objects, selectedIds, scale, offsetX, offsetY, sceneActions, mouse } from './store'
import type { Tool, ShapeType, ResizeHandle, CanvasObject } from './types'

export class InputHandler {
  private isPanning = false
  private draggedId: string | null = null
  private isResizing = false
  private activeHandle: ResizeHandle = null

  private selectionStart: { x: number; y: number } | null = null
  // публичный для доступа из компонента
  public currentMarquee: { x: number; y: number; w: number; h: number } | null = null

  // вспомогательная функция для перевода экранных координат в мировые
  screenToWorld(clientX: number, clientY: number): { x: number; y: number } {
    const s = get(scale)
    const ox = get(offsetX)
    const oy = get(offsetY)

    return {
      x: (clientX - ox) / s,
      y: (clientY - oy) / s
    }
  }

  // функция для проверки находится ли точка (px, py) рядом с отрезком (x1,y1)-(x2,y2)
  isNearSegment(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    tol: number
  ) {
    const l2 = (x1 - x2) ** 2 + (y1 - y2) ** 2
    if (l2 === 0) return Math.hypot(px - x1, py - y1) < tol

    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2
    t = Math.max(0, Math.min(1, t))

    const dist = Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)))
    return dist < tol
  }

  getHitObject(clientX: number, clientY: number): CanvasObject | undefined {
    const { x, y } = this.screenToWorld(clientX, clientY)
    const objs = get(objects)
    const s = get(scale)

    return [...objs].reverse().find((obj) => {
      if (obj.type !== 'arrow') {
        return x >= obj.x && x <= obj.x + obj.width && y >= obj.y && y <= obj.y + obj.height
      }
    })
  }

  private getSnapPoint(x: number, y: number, excludeId: string | null): { x: number; y: number } {
    const objs = get(objects)
    const s = get(scale)
    const snapThreshold = 20 / s // дистанция срабатывания магнита

    for (const obj of objs) {
      if (obj.type === 'arrow' || obj.id === excludeId) continue

      // точки на серединах сторон объекта
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
    const { x, y } = this.screenToWorld(e.clientX, e.clientY)
    const s = get(scale)
    const objs = get(objects)
    const currentSelectedIds = get(selectedIds)

    if (currentSelectedIds.length === 1) {
      const obj = objs.find((o) => o.id === currentSelectedIds[0])

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
      // ...
      return
    }
  }

  handleMouseMove(e: MouseEvent) {
    const s = get(scale)

    const { x, y } = this.screenToWorld(e.clientX, e.clientY)

    mouse.set({
      mouseX: e.clientX,
      mouseY: e.clientY,
      worldMouseX: x,
      worldMouseY: y
    })

    // логика рамки выделения
    if (this.selectionStart) {
      // const { x, y } = this.screenToWorld(e.clientX, e.clientY)

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
          if (obj.type !== 'arrow') {
            // Для обычных фигур
            return (
              obj.x < marquee.x + marquee.w &&
              obj.x + obj.width > marquee.x &&
              obj.y < marquee.y + marquee.h &&
              obj.y + obj.height > marquee.y
            )
          }
        })
        .map((o) => o.id)

      selectedIds.set(hitIds)
      return
    }

    if (this.isPanning) {
      offsetX.update((val) => val + e.movementX)
      offsetY.update((val) => val + e.movementY)
      return
    }

    if (this.draggedId) {
      const currentIds = get(selectedIds)

      if (this.isResizing) {
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
      } else {
        // логика обычного перемещения (panning/drag объекта)
        if (currentIds.includes(this.draggedId)) {
          currentIds.forEach((id) => {
            sceneActions.updateObject(id, e.movementX / s, e.movementY / s, null)
          })
        } else {
          sceneActions.updateObject(this.draggedId, e.movementX / s, e.movementY / s, null)
        }
      }

      // // если объект часть группы — двигаем всю группу
      // if (currentIds.includes(this.draggedId)) {
      //   currentIds.forEach((id) => {
      //     sceneActions.updateObject(id, e.movementX / s, e.movementY / s, this.activeHandle)
      //   })
      // } else {
      //   sceneActions.updateObject(
      //     this.draggedId,
      //     e.movementX / s,
      //     e.movementY / s,
      //     this.activeHandle
      //   )
      // }
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
