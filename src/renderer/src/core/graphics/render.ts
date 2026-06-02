import { drawObject } from './shapes'
import type { CanvasObject, Tool } from '../../types'
import { drawGrid, drawMarquee, drawSelection } from './drawing'

export function renderScene(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  objects: CanvasObject[],
  selectedIds: string[],
  scale: number,
  offsetX: number,
  offsetY: number,
  gridSize: number,
  marquee: any
): void {
  const dpr = window.devicePixelRatio || 1

  // сброс и очистка
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)

  // рисуем сетку
  drawGrid(ctx, scale, offsetX, offsetY, gridSize)

  // трансформация для объеков
  ctx.translate(offsetX, offsetY)
  ctx.scale(scale, scale)

  // отрисовка объектов
  objects.forEach((obj) => {
    const isSelected = selectedIds.includes(obj.id)
    if (obj.type !== 'arrow') {
      drawObject(ctx, obj, isSelected, scale)
    }
    // если есть стрелки, их отрисовка должна быть тут
  })

  // отрисовка UI элементов (selection, marquee)
  selectedIds.forEach((id) => {
    const obj = objects.find((o) => o.id === id)
    if (obj) drawSelection(ctx, obj, scale)
  })

  if (marquee) drawMarquee(ctx, marquee, scale)
}

/**
 * Возвращает нужный класс курсора в зависимости от состояния инструментов холста.
 */
export function getCanvasCursorClass(
  isCanvasDragging: boolean,
  isSpacePressed: boolean,
  activeTool: Tool
): string {
  if (isCanvasDragging) return 'cursor-figjam-grabbing'
  if (isSpacePressed || activeTool === 'hand') return 'cursor-figjam-grab'
  if (activeTool === 'shape' || activeTool === 'arrow') return 'cursor-figjam-crosshair'
  return 'cursor-figjam-select'
}

/**
 * Корректно масштабирует буфер холста под DPR устройства.
 */
export function resizeCanvasToDisplaySize(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): void {
  const dpr = window.devicePixelRatio || 1
  canvas.width = window.innerWidth * dpr
  canvas.height = window.innerHeight * dpr
  canvas.style.width = `${window.innerWidth}px`
  canvas.style.height = `${window.innerHeight}px`
  ctx.scale(dpr, dpr)
}
