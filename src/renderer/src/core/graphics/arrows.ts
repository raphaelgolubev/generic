import type { ArrowHead, ArrowObject } from '../../types'

export function drawArrow(ctx: CanvasRenderingContext2D, arrow: ArrowObject, scale: number) {
  const { start, end, color, mode } = arrow
  ctx.beginPath()
  ctx.strokeStyle = color
  ctx.lineWidth = 2 / scale
  ctx.lineJoin = 'round'

  let lastAngle = 0 // Угол последнего сегмента

  if (mode === 'straight') {
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    lastAngle = Math.atan2(end.y - start.y, end.x - start.x)
  } else if (mode === 'orthogonal') {
    // Убедимся, что offset всегда число
    const offset = arrow.orthogonalOffset || 0
    const midY = start.y + (end.y - start.y) / 2 + offset

    ctx.moveTo(start.x, start.y)
    ctx.lineTo(start.x, midY)
    ctx.lineTo(end.x, midY)
    ctx.lineTo(end.x, end.y)

    // расчет угла для наконечника
    // если конец стрелки выше или ниже перекладины — она вертикальная
    if (Math.abs(end.y - midY) > 0.5) {
      lastAngle = end.y > midY ? Math.PI / 2 : -Math.PI / 2
    } else {
      // если на одном уровне — горизонтальная
      lastAngle = end.x > start.x ? 0 : Math.PI
    }
  } else if (mode === 'bezier') {
    const cpY = start.y + (end.y - start.y) * 0.5 // Упрощенная точка изгиба
    ctx.moveTo(start.x, start.y)
    ctx.quadraticCurveTo(start.x, end.y, end.x, end.y)
    lastAngle = Math.atan2(0, end.x - start.x) // Для горизонтального входа
  }

  ctx.stroke()
  drawArrowHead(ctx, end.x, end.y, lastAngle, arrow.endHead, scale)
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
