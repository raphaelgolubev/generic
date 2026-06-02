// src/core/graphics/drawing.ts
import type { CanvasObject, ResizeHandle } from '../../types'
import { theme } from '../constants'

/**
 * Отрисовывает сетку из точек на холсте в экранных координатах с оптимизацией производительности.
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  scale: number,
  offsetX: number,
  offsetY: number,
  gridSize: number
): void {
  ctx.save()

  const dpr = window.devicePixelRatio || 1
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0) // Переходим в экранные пиксели

  let scaledStep = gridSize * scale
  while (scaledStep < 12) scaledStep *= 2 // Предотвращаем избыточную плотность точек

  const startX = offsetX % scaledStep
  const startY = offsetY % scaledStep

  const baseRadius = 0.8
  const maxRadius = 4.0
  const radius = Math.max(baseRadius, Math.min(maxRadius, baseRadius * scale))

  const opacity = 0.25
  ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`

  // Группируем все точки сетки в один саб-путь для пакетной отправки на GPU
  ctx.beginPath()
  for (let x = startX; x < window.innerWidth; x += scaledStep) {
    for (let y = startY; y < window.innerHeight; y += scaledStep) {
      // Округление центра гарантирует, что точка попадет ровно в пиксель и не размылится
      const centerX = Math.round(x)
      const centerY = Math.round(y)

      ctx.moveTo(centerX + radius, centerY)
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    }
  }
  ctx.fill()

  ctx.restore()
}

/**
 * Внутренняя вспомогательная функция для добавления круга маркера в текущий путь контекста.
 */
function addHandlerPath(
  ctx: CanvasRenderingContext2D,
  obj: CanvasObject,
  scale: number,
  handleType: ResizeHandle
): void {
  if (obj.type === 'arrow' || obj.width <= 0 || obj.height <= 0) return

  const visualRadius = 5
  let radius = visualRadius / scale

  // Защита: хендл не должен превышать треть минимальной стороны объекта
  const maxRadius = Math.max(1, Math.min(obj.width, obj.height) / 3)
  if (radius > maxRadius) {
    radius = maxRadius
  }

  let x = obj.x
  let y = obj.y

  if (handleType === 'tr') x += obj.width
  if (handleType === 'br') {
    x += obj.width
    y += obj.height
  }
  if (handleType === 'bl') y += obj.height

  ctx.moveTo(x + radius, y)
  ctx.arc(x, y, radius, 0, 2 * Math.PI)
}

/**
 * Отрисовывает рамку выделения вокруг активного объекта и маркеры изменения размера.
 */
export function drawSelection(
  ctx: CanvasRenderingContext2D,
  obj: CanvasObject,
  scale: number
): void {
  if (obj.type === 'arrow') return

  ctx.save()

  // 1. Отрисовка основной рамки
  ctx.strokeStyle = theme.selectionStrokeColor
  ctx.lineWidth = 2 / scale
  ctx.strokeRect(obj.x, obj.y, obj.width, obj.height)

  // 2. Оптимизированная отрисовка 4-х угловых маркеров (хендлов)
  ctx.beginPath()
  addHandlerPath(ctx, obj, scale, 'tl')
  addHandlerPath(ctx, obj, scale, 'tr')
  addHandlerPath(ctx, obj, scale, 'br')
  addHandlerPath(ctx, obj, scale, 'bl')

  // Пакетная заливка и обводка всех 4-х кругов сразу
  ctx.fillStyle = 'white'
  ctx.fill()

  ctx.strokeStyle = 'red'
  ctx.lineWidth = 1 / scale
  ctx.stroke()

  ctx.restore()
}

/**
 * Отрисовывает прямоугольную рамку группового выделения мыши (marquee).
 */
export function drawMarquee(
  ctx: CanvasRenderingContext2D,
  marquee: { x: number; y: number; w: number; h: number } | null,
  scale: number
): void {
  if (!marquee) return

  ctx.save()
  ctx.strokeStyle = theme.selectionStrokeColor
  ctx.fillStyle = theme.selectionSquareColor
  ctx.lineWidth = 1 / scale

  ctx.fillRect(marquee.x, marquee.y, marquee.w, marquee.h)
  ctx.strokeRect(marquee.x, marquee.y, marquee.w, marquee.h)

  ctx.restore()
}
