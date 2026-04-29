import type { SceneObject, CanvasObject } from './types'
import { drawObject } from './shapes'
import { drawArrow } from './arrows'

export function renderScene(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  objects: CanvasObject[],
  selectedIds: string[],
  scale: number,
  offsetX: number,
  offsetY: number,
  gridSize: number,
  marquee: any // параметр для рамки выбора
): void {
  const dpr = window.devicePixelRatio || 1

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  ctx.translate(offsetX, offsetY)
  ctx.scale(scale, scale)

  // сетка
  drawGrid(ctx, canvas, scale, offsetX, offsetY, gridSize)

  // объекты
  objects.forEach((obj) => {
    const isSelected = selectedIds.includes(obj.id)
    if (obj.type === 'arrow') {
      drawArrow(ctx, obj, scale)
    } else {
      drawObject(ctx, obj, isSelected, scale)
    }
  })

  // рамки выделения для всех выбранных объектов
  selectedIds.forEach((id) => {
    const obj = objects.find((o) => o.id === id)
    if (obj) {
      drawSelection(ctx, obj, scale)
    }
  })

  // отрисовка активной рамки выбора (marquee)
  if (marquee) {
    drawMarquee(ctx, marquee, scale)
  }
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  scale: number,
  offsetX: number,
  offsetY: number,
  gridSize: number
): void {
  ctx.fillStyle = '#e0e0e0'
  const dotSize = 2 / scale
  const left = -offsetX / scale
  const top = -offsetY / scale
  const right = left + canvas.width / scale
  const bottom = top + canvas.height / scale

  for (let x = Math.floor(left / gridSize) * gridSize; x < right; x += gridSize) {
    for (let y = Math.floor(top / gridSize) * gridSize; y < bottom; y += gridSize) {
      ctx.beginPath()
      ctx.arc(x, y, dotSize, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

export function drawSelection(
  ctx: CanvasRenderingContext2D,
  obj: CanvasObject,
  scale: number
): void {
  ctx.save()
  ctx.strokeStyle = '#18a0fb'
  ctx.lineWidth = 2 / scale

  if (obj.type === 'arrow') {
    // --- Рамка для стрелки (только точки на концах) ---
    const hs = 8 / scale
    ctx.fillStyle = 'white'

    const points = [obj.start, obj.end]

    points.forEach((p) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, hs / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    })
  } else {
    // --- Рамка для прямоугольных фигур (SceneObject) ---
    ctx.strokeRect(obj.x, obj.y, obj.width, obj.height)

    const hs = 8 / scale
    ctx.fillStyle = 'white'

    const corners = [
      { x: obj.x, y: obj.y },
      { x: obj.x + obj.width, y: obj.y },
      { x: obj.x, y: obj.y + obj.height },
      { x: obj.x + obj.width, y: obj.y + obj.height }
    ]

    corners.forEach((c) => {
      ctx.fillRect(c.x - hs / 2, c.y - hs / 2, hs, hs)
      ctx.strokeRect(c.x - hs / 2, c.y - hs / 2, hs, hs)
    })
  }

  ctx.restore()
}

export function drawMarquee(ctx: CanvasRenderingContext2D, marquee: any, scale: number) {
  if (!marquee) return
  ctx.save()
  ctx.strokeStyle = '#18a0fb'
  ctx.fillStyle = 'rgba(24, 160, 251, 0.1)'
  ctx.lineWidth = 1 / scale
  ctx.fillRect(marquee.x, marquee.y, marquee.w, marquee.h)
  ctx.strokeRect(marquee.x, marquee.y, marquee.w, marquee.h)
  ctx.restore()
}
