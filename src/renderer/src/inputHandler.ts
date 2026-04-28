import { get } from 'svelte/store'
import { objects, selectedIds, scale, offsetX, offsetY, sceneActions } from './store'
import type { Tool, ShapeType, SceneObject, ResizeHandle } from './types'

export class InputHandler {
  private isPanning = false
  private draggedId: string | null = null
  private isResizing = false
  private activeHandle: ResizeHandle = null

  private selectionStart: { x: number; y: number } | null = null
  // публичный для доступа из компонента
  public currentMarquee: { x: number; y: number; w: number; h: number } | null = null

  getHitObject(clientX: number, clientY: number): SceneObject | undefined {
    const { x, y } = sceneActions.screenToWorld(clientX, clientY)
    const objs = get(objects)
    return [...objs]
      .reverse()
      .find((obj) => x >= obj.x && x <= obj.x + obj.width && y >= obj.y && y <= obj.y + obj.height)
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
      if (obj) {
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
    }
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
        .filter(
          (obj) =>
            obj.x < marquee.x + marquee.w &&
            obj.x + obj.width > marquee.x &&
            obj.y < marquee.y + marquee.h &&
            obj.y + obj.height > marquee.y
        )
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
