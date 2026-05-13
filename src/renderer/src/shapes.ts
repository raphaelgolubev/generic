import { wrapText } from './text'
import type { SceneObject } from './types'

// создает путь для стикера или прямоугольника со скруглениями
export function createRoundedRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number = 12
): Path2D {
  const path = new Path2D()
  path.moveTo(x + r, y)
  path.arcTo(x + w, y, x + w, y + h, r)
  path.arcTo(x + w, y + h, x, y + h, r)
  path.arcTo(x, y + h, x, y, r)
  path.arcTo(x, y, x + w, y, r)
  path.closePath()
  return path
}

export function drawObject(
  ctx: CanvasRenderingContext2D,
  obj: SceneObject,
  isSelected: boolean,
  scale: number
): void {
  ctx.save()

  // общие настройки тени
  // ctx.shadowColor = 'rgba(23, 209, 159, 0.76)'
  // ctx.shadowBlur = 10 / scale
  // ctx.shadowOffsetY = 4 / scale

  ctx.fillStyle = obj.color
  ctx.strokeStyle = '#666666' // цвет выделения
  ctx.lineWidth = 3

  const radius = obj.type === 'sticky' ? 0 : 8
  const path = createRoundedRectPath(obj.x, obj.y, obj.width, obj.height, radius)

  if (obj.type === 'sticky' || obj.type === 'rect') {
    ctx.fill(path)
    ctx.stroke(path)
    if (isSelected) {
      ctx.shadowColor = 'transparent' // убираем тень для обводки
    }
  } else if (obj.type === 'circle') {
    ctx.beginPath()
    ctx.ellipse(
      obj.x + obj.width / 2,
      obj.y + obj.height / 2,
      obj.width / 2,
      obj.height / 2,
      0,
      0,
      Math.PI * 2
    )
    ctx.fill()
    ctx.stroke()
    if (isSelected) {
      ctx.shadowColor = 'transparent'
    }
  }

  // отрисовка текста
  if (obj.text) {
    ctx.save()
    ctx.shadowColor = 'transparent'
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'

    const fontSize = 12
    // ctx.font = `500 ${fontSize}px sans-serif`
    ctx.font = `500 ${fontSize}px "Inter", "Segoe UI", Roboto, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const padding = 15
    const maxWidth = Math.max(10, obj.width - padding * 2)
    const maxHeight = obj.height - padding // доступная высота
    const lineHeight = fontSize * 1.2 // расстояние между строками

    // получаем массив строк
    let lines = wrapText(ctx, obj.text, maxWidth, maxHeight, lineHeight)

    // вычисляем начальную координату Y, чтобы весь блок текста был по центру
    const totalHeight = lines.length * lineHeight
    let startY = obj.y + (obj.height - totalHeight) / 2 + lineHeight / 2

    lines.forEach((line) => {
      // доп проверка
      if (startY < obj.y + obj.height - padding / 2) {
        ctx.fillText(line, obj.x + obj.width / 2, startY)
        startY += lineHeight
      }
    })

    ctx.restore()
  }

  ctx.restore()
}
