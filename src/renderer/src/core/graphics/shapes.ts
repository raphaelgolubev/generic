// src/core/graphics/shapes.ts
import { wrapText } from '../../text'
import type { CanvasObject, SceneObject } from '../../types'

/**
 * Создает путь Path2D для прямоугольника со скругленными углами.
 */
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

/**
 * Вспомогательная функция для отрисовки многострочного текста по центру объекта.
 */
function drawObjectText(ctx: CanvasRenderingContext2D, obj: SceneObject): void {
  ctx.save()
  ctx.shadowColor = 'transparent'
  ctx.fillStyle = obj.type === 'text' ? obj.color : obj.textColor //'rgba(0, 0, 0, 0.8)'

  const fontSize = obj.fontSize || 12
  ctx.font = `500 ${fontSize}px "Inter", "Segoe UI", Roboto, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const padding = 15
  const maxWidth = Math.max(10, obj.width - padding * 2)
  const maxHeight = obj.height - padding
  const lineHeight = fontSize * 1.2

  // Разделение текста на строки с учетом границ объекта
  const lines = wrapText(ctx, obj.text || '', maxWidth, maxHeight, lineHeight)

  // Вычисление стартовой позиции по Y для центрирования всего текстового блока
  const totalHeight = lines.length * lineHeight
  let startY = obj.y + (obj.height - totalHeight) / 2 + lineHeight / 2

  lines.forEach((line) => {
    if (startY < obj.y + obj.height - padding / 2) {
      ctx.fillText(line, obj.x + obj.width / 2, startY)
      startY += lineHeight
    }
  })

  ctx.restore()
}

/**
 * Отрисовывает геометрическую фигуру (прямоугольник, круг) на холсте.
 */
export function drawObject(
  ctx: CanvasRenderingContext2D,
  obj: CanvasObject, // Изменили тип для соответствия циклу в render.ts
  isSelected: boolean
): void {
  // Исключаем стрелки на уровне выполнения (двойная защита, так как они рисуются отдельно)
  if (obj.type === 'arrow') return

  // ПЕРЕХВАТЫВАЕМ ТЕКСТОВЫЙ ОБЪЕКТ ДО ОТРИСОВКИ ФИГУР
  if (obj.type === 'text') {
    if (obj.text) {
      drawObjectText(ctx, obj as any) // наша вынесенная функция идеально отрендерит текст
    }
    return // выходим, чтобы под текстом не рисовался задний фон
  }

  const sceneObj = obj as SceneObject

  ctx.save()

  ctx.fillStyle = sceneObj.color
  ctx.strokeStyle = sceneObj.strokeColor || '#666666'
  ctx.lineWidth = sceneObj.strokeWidth || 3

  // Отрисовка геометрии фигур
  if (sceneObj.type === 'rect' || sceneObj.type === 'roundRect') {
    const radius = sceneObj.type === 'rect' ? 0 : 8
    const path = createRoundedRectPath(
      sceneObj.x,
      sceneObj.y,
      sceneObj.width,
      sceneObj.height,
      radius
    )
    ctx.fill(path)
    ctx.stroke(path)
    if (isSelected) {
      ctx.shadowColor = 'transparent'
    }
  } else if (sceneObj.type === 'circle') {
    ctx.beginPath()
    ctx.ellipse(
      sceneObj.x + sceneObj.width / 2,
      sceneObj.y + sceneObj.height / 2,
      sceneObj.width / 2,
      sceneObj.height / 2,
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

  // Отрисовка текстового слоя, если текст присутствует
  if (sceneObj.text) {
    drawObjectText(ctx, sceneObj)
  }

  ctx.restore()
}
