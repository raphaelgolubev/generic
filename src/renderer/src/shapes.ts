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
    const lineHeight = fontSize * 1.2 // расстояние между строками

    // получаем массив строк
    const lines = wrapText(ctx, obj.text, maxWidth)

    // вычисляем начальную координату Y, чтобы весь блок текста был по центру
    const totalHeight = lines.length * lineHeight
    let startY = obj.y + (obj.height - totalHeight) / 2 + lineHeight / 2

    lines.forEach((line) => {
      ctx.fillText(line, obj.x + obj.width / 2, startY)
      startY += lineHeight
    })

    ctx.restore()
  }

  ctx.restore()
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = text.split('\n')
  const lines: string[] = []

  paragraphs.forEach((paragraph) => {
    const words = paragraph.split(' ')
    let currentLine = ''

    for (let i = 0; i < words.length; i++) {
      let word = words[i]
      let testLine = currentLine ? currentLine + ' ' + word : word
      let metrics = ctx.measureText(testLine)

      // если слово целиком влезает в текущую строку
      if (metrics.width <= maxWidth) {
        currentLine = testLine
      }
      // если слово не влезает, но это НЕ первое слово в строке — переносим слово целиком на новую
      else if (currentLine !== '') {
        lines.push(currentLine)
        currentLine = ''
        i-- // повторяем итерацию для этого же слова, но уже в новой строке
      }
      // если ОДНО слово шире всей строки — режем его посимвольно
      else {
        let tempWord = ''
        for (let j = 0; j < word.length; j++) {
          const char = word[j]
          if (ctx.measureText(tempWord + char).width <= maxWidth) {
            tempWord += char
          } else {
            lines.push(tempWord)
            tempWord = char
          }
        }
        currentLine = tempWord
      }
    }
    if (currentLine) lines.push(currentLine)
  })

  return lines
}
