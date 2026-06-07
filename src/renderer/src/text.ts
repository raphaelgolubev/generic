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
  // ИСПРАВЛЕНИЕ: Жесткая защита от отрицательной или слишком маленькой высоты контейнера
  if (maxWidth <= 10 || maxHeight < lineHeight || lineHeight <= 0) return []
  // if (maxWidth <= 10 || maxHeight <= 10 || lineHeight <= 0) return []

  const paragraphs = text.split('\n')
  const lines: string[] = []
  const maxLines = Math.floor(maxHeight / lineHeight)

  if (maxLines <= 0) return []

  // флаг для контроля реального обрезания текста
  let isTruncated = false

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    if (lines.length >= maxLines) {
      isTruncated = true
      break
    }

    const paragraph = paragraphs[pIdx]
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
          if (lines.length >= maxLines) {
            // Проверяем: остались ли еще слова в этом абзаце ИЛИ есть ли следующие абзацы?
            if (i < words.length - 1 || pIdx < paragraphs.length - 1) {
              isTruncated = true
            }
            break
          }

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

    // Сброс недописанной строки в конце абзаца
    if (lines.length < maxLines && currentLine) {
      lines.push(currentLine)
    } else if (lines.length >= maxLines && currentLine) {
      // Если лимит забит, но остался необработанный «хвост» текущего абзаца
      isTruncated = true
    }
  }

  // ПОСТ-ОБРАБОТКА: Добавляем многоточие ТОЛЬКО если флаг урезания взведен в true
  if (isTruncated && lines.length > 0) {
    const lastIdx = lines.length - 1
    const lastLine = lines[lastIdx]

    if (!lastLine.endsWith('...')) {
      lines[lastIdx] = truncateWithEllipsis(ctx, lastLine, maxWidth)
    }
  }

  return lines
}
