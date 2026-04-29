import type { ArrowHead, ArrowObject } from './types'

export function drawArrow(ctx: CanvasRenderingContext2D, arrow: ArrowObject, scale: number) {
  const { start, end, color, startHead, endHead } = arrow

  ctx.beginPath()
  ctx.strokeStyle = color
  ctx.lineWidth = 2 / scale
  ctx.moveTo(start.x, start.y)
  ctx.lineTo(end.x, end.y)
  ctx.stroke()

  // Рисуем наконечники
  drawArrowHead(ctx, end.x, end.y, Math.atan2(end.y - start.y, end.x - start.x), endHead, scale)
  drawArrowHead(
    ctx,
    start.x,
    start.y,
    Math.atan2(start.y - end.y, start.x - end.x),
    startHead,
    scale
  )
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  type: ArrowHead,
  scale: number
) {
  if (type === 'none') return

  const size = 10 / scale
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)

  ctx.beginPath()
  if (type === 'arrow') {
    ctx.moveTo(-size, -size / 1.5)
    ctx.lineTo(0, 0)
    ctx.lineTo(-size, size / 1.5)
  } else if (type === 'triangle') {
    ctx.moveTo(-size, -size)
    ctx.lineTo(0, 0)
    ctx.lineTo(-size, size)
    ctx.closePath()
    ctx.fill()
  }
  ctx.stroke()
  ctx.restore()
}
