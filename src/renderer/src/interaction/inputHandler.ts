import { get } from 'svelte/store'
import { objects, selectedIds, scale, offsetX, offsetY, mouse } from '../core/state'
import { sceneActions } from '../scene'
import type { Tool, ShapeType, ResizeHandle, CanvasObject } from '../types'
import {
  calculateZoomOffsets,
  getResizeHandleAtPosition,
  isObjectInMarquee,
  isPointInObject,
  screenToWorld
} from '../core/maths'

export class InputHandler {
  private isPanning = false
  private draggedId: string | null = null
  private isResizing = false
  private activeHandle: ResizeHandle = null

  private selectionStart: { x: number; y: number } | null = null
  // публичный для доступа из компонента
  public currentMarquee: { x: number; y: number; w: number; h: number } | null = null

  getHitObject(clientX: number, clientY: number): CanvasObject | undefined {
    const { x, y } = screenToWorld(clientX, clientY)
    const objs = get(objects)

    return [...objs].reverse().find((obj) => isPointInObject(x, y, obj))
  }

  handleMouseDown(
    e: MouseEvent,
    activeTool: Tool,
    activeShape: ShapeType,
    isSpacePressed: boolean
  ) {
    const { x, y } = screenToWorld(e.clientX, e.clientY)
    const s = get(scale)
    const objs = get(objects)
    const currentSelectedIds = get(selectedIds)

    if (currentSelectedIds.length === 1) {
      const obj = objs.find((o) => o.id === currentSelectedIds[0])
      if (obj) {
        this.activeHandle = getResizeHandleAtPosition(x, y, obj, s)
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
        this.selectionStart = { x, y }
        selectedIds.set([])
        this.currentMarquee = null
      }
    } else if (activeTool === 'shape') {
      sceneActions.addObject(x, y, activeShape, activeShape === 'rect' ? '#fff7d1' : '#ffffff')
    } else if (activeTool === 'arrow') {
      return
    }
  }

  handleMouseMove(e: MouseEvent) {
    const s = get(scale)

    const { x, y } = screenToWorld(e.clientX, e.clientY)

    mouse.set({
      mouseX: e.clientX,
      mouseY: e.clientY,
      worldMouseX: x,
      worldMouseY: y
    })

    // логика рамки выделения
    if (this.selectionStart) {
      this.currentMarquee = {
        x: Math.min(x, this.selectionStart.x),
        y: Math.min(y, this.selectionStart.y),
        w: Math.abs(x - this.selectionStart.x),
        h: Math.abs(y - this.selectionStart.y)
      }

      const marquee = this.currentMarquee
      const objs = get(objects)
      const hitIds = objs.filter((obj) => isObjectInMarquee(obj, marquee)).map((o) => o.id)

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
      const handleToPass = this.isResizing ? this.activeHandle : null

      if (currentIds.includes(this.draggedId)) {
        currentIds.forEach((id) => {
          sceneActions.updateObject(id, e.movementX / s, e.movementY / s, handleToPass)
        })
      } else {
        sceneActions.updateObject(this.draggedId, e.movementX / s, e.movementY / s, handleToPass)
      }
    }
  }

  handleMouseUp() {
    if (this.draggedId) {
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

      const { ox, oy } = calculateZoomOffsets(
        oldScale,
        newScale,
        e.clientX,
        e.clientY,
        get(offsetX),
        get(offsetY)
      )

      offsetX.set(ox)
      offsetY.set(oy)
      scale.set(newScale)
    } else {
      offsetX.update((val) => val - e.deltaX)
      offsetY.update((val) => val - e.deltaY)
    }
  }
}

export const inputHandler = new InputHandler()
