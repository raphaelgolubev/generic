// src/renderer/src/text.ts

/**
 * Безопасно подрезает строку с конца, пока она вместе с многоточием не влезет в maxWidth.
 */
function truncateWithEllipsis(
  ctx: CanvasRenderingContext2D,
  line: string,
  maxWidth: number
): string {
  let text = line
  while (ctx.measureText(text + '...').width > maxWidth && text.length > 0) {
    text = text.substring(0, text.length - 1)
  }
  return text + '...'
}

/**
 * Разбивает текст на строки с учетом ограничений ширины, высоты и переносов.
 * Автоматически добавляет многоточие "...", если текст выходит за рамки maxHeight.
 *
 * @param ctx Контекст отрисовки 2D холста с уже установленным шрифтом.
 * @param text Исходный многострочный текст для форматирования.
 * @param maxWidth Максимально допустимая ширина текстового блока в пикселях.
 * @param maxHeight Максимально допустимая высота текстового блока в пикселях.
 * @param lineHeight Высота одной строки текста.
 * @returns Массив строк, готовых для поочередного вывода через fillText.
 */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxHeight: number,
  lineHeight: number
): string[] {
  if (maxWidth <= 10 || maxHeight <= 10 || lineHeight <= 0) return []

  const paragraphs = text.split('\n')
  const lines: string[] = []
  const maxLines = Math.floor(maxHeight / lineHeight)

  for (const paragraph of paragraphs) {
    if (lines.length >= maxLines) break

    const words = paragraph.split(' ')
    let currentLine = ''

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const testLine = currentLine ? `${currentLine} ${word}` : word

      if (ctx.measureText(testLine).width <= maxWidth) {
        currentLine = testLine
      } else {
        if (currentLine !== '') {
          lines.push(currentLine)
          if (lines.length >= maxLines) break

          currentLine = ''
          i-- // Повторяем итерацию для текущего слова на новой строке
        } else {
          // Слово целиком не помещается в пустую строку
          const isLastLine = lines.length === maxLines - 1
          const suffix = isLastLine ? '...' : ''

          // Оптимизация: Бинарный поиск индекса разрыва длинного слова
          let low = 0
          let high = word.length
          let splitIndex = 0

          while (low <= high) {
            const mid = Math.floor((low + high) / 2)
            const testMeasure = ctx.measureText(word.substring(0, mid) + suffix).width

            if (testMeasure <= maxWidth) {
              splitIndex = mid
              low = mid + 1
            } else {
              high = mid - 1
            }
          }

          if (isLastLine) {
            lines.push(`${word.substring(0, splitIndex)}...`)
            return lines // Достигнут лимит строк, прекращаем расчеты
          } else {
            lines.push(word.substring(0, splitIndex))
            words[i] = word.substring(splitIndex) // Переносим остаток слова на следующую строку
            i--
          }
        }
      }
    }

    if (lines.length < maxLines && currentLine) {
      lines.push(currentLine)
    }
  }

  // Пост-обработка: Добавление многоточия к последней строке, если текст обрезался по высоте
  if (lines.length >= maxLines) {
    const lastIdx = lines.length - 1
    const lastLine = lines[lastIdx]

    if (!lastLine.endsWith('...')) {
      lines[lastIdx] = truncateWithEllipsis(ctx, lastLine, maxWidth)
    }
  }

  return lines
}
