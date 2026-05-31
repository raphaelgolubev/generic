import type { CanvasObject, ResizeHandle } from '../../types'
import { theme } from '../constants'

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  scale: number,
  offsetX: number,
  offsetY: number,
  gridSize: number
): void {
  ctx.save()

  const dpr = window.devicePixelRatio || 1
  // работаем в экранных пикселях
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  let scaledStep = gridSize * scale
  while (scaledStep < 12) scaledStep *= 2

  const startX = offsetX % scaledStep
  const startY = offsetY % scaledStep

  // размер при отдалении
  const baseRadius = 0.8
  // максимально допустимый размер
  const maxRadius = 4.0
  // радуис растет пропорционально зуму но не превышает 3 пикселя
  const radius = Math.max(baseRadius, Math.min(maxRadius, baseRadius * scale))

  const opacity = 0.25 //scale > 2 ? 0.25 : 0.15
  ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`

  // отрисовка точек сетки
  ctx.beginPath() // группируем все точки в один путь для скорости
  for (let x = startX; x < window.innerWidth; x += scaledStep) {
    for (let y = startY; y < window.innerHeight; y += scaledStep) {
      // Важно: Math.round для центра круга, чтобы он был четким
      const centerX = Math.round(x)
      const centerY = Math.round(y)

      ctx.moveTo(centerX + radius, centerY)
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    }
  }
  ctx.fill()

  ctx.restore()
}

export function drawHandler(
  ctx: CanvasRenderingContext2D,
  obj: CanvasObject,
  scale: number,
  handleType: ResizeHandle
): void {
  if (obj.type == 'arrow') return

  // если фигура схлопнулась, не рисуем маркеры вообще, чтобы избежать краша
  if (obj.width <= 0 || obj.height <= 0) return

  // желаем радиус хэндлера
  const visualRadius = 5
  let radius = visualRadius / scale

  // ограничение, хэндлер не должен быть больше трети
  // мнинимальной стороны объекта
  // чтобы не перекрывать фигуру при сильном отдалении

  // защищаем от нуля берем максимум между вычисленным ограничением и 1px
  const maxRadius = Math.max(1, Math.min(obj.width, obj.height) / 3)
  // const maxRadius = Math.min(obj.width, obj.height) / 3
  if (radius > maxRadius) {
    radius = maxRadius
  }

  // изначально левый верхний угол
  let x = obj.x
  let y = obj.y

  if (handleType == 'tr') x += obj.width // двигаем в правый верхний угол
  if (handleType == 'br') {
    x += obj.width
    y += obj.height
  } // двигаем вниз и вправо
  if (handleType == 'bl') y += obj.height // двигаем только вниз

  // рисуем
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, 2 * Math.PI)
  ctx.fillStyle = 'white'
  ctx.fill()
  ctx.strokeStyle = 'red'
  ctx.lineWidth = 1 / scale
  ctx.stroke()
}

export function drawSelection(
  ctx: CanvasRenderingContext2D,
  obj: CanvasObject,
  scale: number
): void {
  if (obj.type !== 'arrow') {
    ctx.save()
    ctx.strokeStyle = theme.selectionStrokeColor
    ctx.lineWidth = 2 / scale

    // логика для обычных фигур
    ctx.strokeRect(obj.x, obj.y, obj.width, obj.height)
    ctx.restore()

    // логика отрисовки хэндлеров
    drawHandler(ctx, obj, scale, 'tl')
    drawHandler(ctx, obj, scale, 'tr')
    drawHandler(ctx, obj, scale, 'br')
    drawHandler(ctx, obj, scale, 'bl')
  }
}

export function drawMarquee(ctx: CanvasRenderingContext2D, marquee: any, scale: number) {
  if (!marquee) return
  ctx.save()
  ctx.strokeStyle = theme.selectionStrokeColor
  ctx.fillStyle = theme.selectionSquareColor
  ctx.lineWidth = 1 / scale
  ctx.fillRect(marquee.x, marquee.y, marquee.w, marquee.h)
  ctx.strokeRect(marquee.x, marquee.y, marquee.w, marquee.h)
  ctx.restore()
}
