import { get } from 'svelte/store'
import { offsetX, offsetY, scale } from './state'
import type { CanvasObject, ResizeHandle, SceneObject } from '../types'
import { GRID_SIZE } from './constants'

export function screenToWorld(clientX: number, clientY: number): { x: number; y: number } {
  const s = get(scale)
  const ox = get(offsetX)
  const oy = get(offsetY)

  return {
    x: (clientX - ox) / s,
    y: (clientY - oy) / s
  }
}

/**
 * Переводит мировые координаты холста (координаты объекта) в экранные пиксели.
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  scale: number,
  ox: number,
  oy: number
): { x: number; y: number } {
  return {
    x: worldX * scale + ox,
    y: worldY * scale + oy
  }
}

/**
 * Округление значения до ближайшего шага сетки.
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize
}

/**
 * Трансформация (ресайз или перемещение) одиночного объекта сцены.
 */
export function transformSceneObject(
  obj: SceneObject,
  deltaX: number,
  deltaY: number,
  handle: ResizeHandle,
  gridSize: number
): SceneObject {
  const s = obj as any
  // Инициализируем "точные" накопители, если их еще нет
  s.pX = s.pX ?? obj.x
  s.pY = s.pY ?? obj.y
  s.pW = s.pW ?? obj.width
  s.pH = s.pH ?? obj.height

  if (handle) {
    // --- ЛОГИКА РЕЗАЙЗА С ЗАЩИТОЙ ОТ ИНВЕРСИИ ---
    if (handle.includes('t')) {
      const maxDeltaY = s.pH - gridSize
      const clampedDeltaY = Math.min(deltaY, maxDeltaY)
      s.pY += clampedDeltaY
      s.pH -= clampedDeltaY
    }

    if (handle.includes('b')) {
      s.pH += deltaY
      if (s.pH < gridSize) s.pH = gridSize
    }

    if (handle.includes('l')) {
      const maxDeltaX = s.pW - gridSize
      const clampedDeltaX = Math.min(deltaX, maxDeltaX)
      s.pX += clampedDeltaX
      s.pW -= clampedDeltaX
    }

    if (handle.includes('r')) {
      s.pW += deltaX
      if (s.pW < gridSize) s.pW = gridSize
    }

    return {
      ...obj,
      x: snapToGrid(s.pX, gridSize),
      y: snapToGrid(s.pY, gridSize),
      width: Math.max(gridSize, snapToGrid(s.pW, gridSize)),
      height: Math.max(gridSize, snapToGrid(s.pH, gridSize))
    } as SceneObject
  } else {
    // --- ЛОГИКА ПЕРЕМЕЩЕНИЯ ---
    s.pX += deltaX
    s.pY += deltaY

    return {
      ...obj,
      x: snapToGrid(s.pX, gridSize),
      y: snapToGrid(s.pY, gridSize)
    } as SceneObject
  }
}

/**
 * Проверяет попадание точки в прямоугольный объект сцены.
 */
export function isPointInObject(x: number, y: number, obj: CanvasObject): boolean {
  if (obj.type === 'arrow') return false // Поведение по вашей текущей логике
  return x >= obj.x && x <= obj.x + obj.width && y >= obj.y && y <= obj.y + obj.height
}

/**
 * Определяет, по какому маркеру изменения размера кликнул пользователь.
 */
export function getResizeHandleAtPosition(
  x: number,
  y: number,
  obj: CanvasObject,
  scale: number
): ResizeHandle {
  if (obj.type === 'arrow') return null

  const handleSize = 15 / scale

  if (Math.abs(x - obj.x) < handleSize && Math.abs(y - obj.y) < handleSize) return 'tl'
  if (Math.abs(x - (obj.x + obj.width)) < handleSize && Math.abs(y - obj.y) < handleSize)
    return 'tr'
  if (Math.abs(x - obj.x) < handleSize && Math.abs(y - (obj.y + obj.height)) < handleSize)
    return 'bl'
  if (
    Math.abs(x - (obj.x + obj.width)) < handleSize &&
    Math.abs(y - (obj.y + obj.height)) < handleSize
  )
    return 'br'

  return null
}

/**
 * Проверяет, пересекается ли прямоугольный объект с рамкой выделения (marquee).
 */
export function isObjectInMarquee(
  obj: CanvasObject,
  marquee: { x: number; y: number; w: number; h: number }
): boolean {
  if (obj.type === 'arrow') return false
  return (
    obj.x < marquee.x + marquee.w &&
    obj.x + obj.width > marquee.x &&
    obj.y < marquee.y + marquee.h &&
    obj.y + obj.height > marquee.y
  )
}

/**
 * Вычисляет новые смещения холста (offsetX, offsetY) с учетом точки зума под курсором мыши.
 */
export function calculateZoomOffsets(
  oldScale: number,
  newScale: number,
  mouseX: number,
  mouseY: number,
  ox: number,
  oy: number
): { ox: number; oy: number } {
  const ratio = newScale / oldScale
  return {
    ox: mouseX - (mouseX - ox) * ratio,
    oy: mouseY - (mouseY - oy) * ratio
  }
}

/**
 * Преобразует HEX-цвет (#RRGGBB) в RGBA формат с заданной прозрачностью.
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// src/core/maths.ts

/**
 * Рассчитывает идеальные размеры (ширину и высоту) для текстового блока на основе содержимого.
 * @param ctx Контекст Canvas для измерения ширины букв.
 * @param text Введенный текст.
 * @param fontSize Текущий размер шрифта.
 * @param padding Внутренние отступы блока.
 * @param maxAutoWidth Максимальная ширина, после которой текст начинает переноситься на новую строку.
 */
export function calculateAutoTextDimensions(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  padding = 15,
  maxAutoWidth = 350
): { width: number; height: number } {
  ctx.save()
  // Устанавливаем актуальный шрифт холста для точного замера пикселей
  ctx.font = `500 ${fontSize}px "Inter", "Segoe UI", Roboto, sans-serif`

  const lineHeight = fontSize * 1.2
  const paragraphs = text.split('\n')

  let maxLineWidth = 0
  let totalLinesCount = 0

  for (const paragraph of paragraphs) {
    const words = paragraph.split(' ')
    let currentLine = ''
    let paragraphLinesCount = 0

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const testWidth = ctx.measureText(testLine).width

      // Если строка с новым словом влезает в лимит maxAutoWidth
      if (testWidth <= maxAutoWidth) {
        currentLine = testLine
        maxLineWidth = Math.max(maxLineWidth, testWidth)
      } else {
        // Если в текущей строке уже что-то было, переносим слово на следующую
        if (currentLine !== '') {
          paragraphLinesCount++
          currentLine = ''
          i-- // Пробуем это же слово на новой строке
        } else {
          // Одиночное слово длиннее, чем maxAutoWidth — растягиваем блок под это слово
          maxLineWidth = Math.max(maxLineWidth, testWidth)
          paragraphLinesCount++
          currentLine = ''
        }
      }
    }

    // Учитываем последнюю (или единственную) строку абзаца
    if (currentLine) {
      paragraphLinesCount++
      maxLineWidth = Math.max(maxLineWidth, ctx.measureText(currentLine).width)
    }

    // Если абзац был пустой (двойной Enter), он всё равно занимает одну строку по высоте
    totalLinesCount += Math.max(1, paragraphLinesCount)
  }

  ctx.restore()

  // Вычисляем чистые размеры
  const rawWidth = Math.ceil(maxLineWidth + padding * 2)
  const rawHeight = Math.ceil(totalLinesCount * lineHeight + padding)

  // ИСПРАВЛЕНИЕ: Округляем до ближайшего шага сетки (GRID_SIZE = 10)
  // Используем Math.max(GRID_SIZE, ...), чтобы пустой текст не схлопнулся в 0
  // return {
  //   width: Math.max(GRID_SIZE, snapToGrid(rawWidth, GRID_SIZE)),
  //   height: Math.max(GRID_SIZE, snapToGrid(rawHeight, GRID_SIZE))
  // }

  return {
    width: rawWidth,
    height: rawHeight
  }
}
