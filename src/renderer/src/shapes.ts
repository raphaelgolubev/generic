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
  ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
  ctx.shadowBlur = 10 / scale
  ctx.shadowOffsetY = 4 / scale

  ctx.fillStyle = obj.color
  ctx.strokeStyle = '#18a0fb' // цвет выделения
  ctx.lineWidth = 2 / scale

  if (obj.type === 'sticky' || obj.type === 'rect') {
    const radius = obj.type === 'sticky' ? 0 : 8
    const path = createRoundedRectPath(obj.x, obj.y, obj.width, obj.height, radius)

    ctx.fill(path)
    if (isSelected) {
      ctx.shadowColor = 'transparent' // убираем тень для обводки
      ctx.stroke(path)
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
    if (isSelected) {
      ctx.shadowColor = 'transparent'
      ctx.stroke()
    }
  }

  // отрисовка текста
  if (obj.text) {
    ctx.save()
    ctx.shadowColor = 'transparent'
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'

    const fontSize = 14
    ctx.font = `500 ${fontSize}px sans-serif`
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
