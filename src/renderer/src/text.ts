export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxHeight: number,
  lineHeight: number
): string[] {
  const paragraphs = text.split('\n')
  const lines: string[] = []
  const maxLines = Math.floor(maxHeight / lineHeight)

  for (const paragraph of paragraphs) {
    // выходим из цикла если строк больше чем нужно для отрисовки
    if (lines.length >= maxLines) break

    // разбиваем строку на пробелы
    const words = paragraph.split(' ')
    let currentLine = ''

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      // если currentLine пуста ('') тогда ставим word
      // если в строке уже что-то есть мы добавляем word с пробелом вначале
      const testLine = currentLine ? currentLine + ' ' + word : word

      // если длина строки меньше или равна максимально допустимой
      if (ctx.measureText(testLine).width <= maxWidth) {
        currentLine = testLine
        // если длина строки выше максимально допустимой
      } else {
        // если currentLine не пустая строка
        if (currentLine !== '') {
          // кладем строку в массив
          lines.push(currentLine)
          // если кол-во строк массива превышает максимально допустимую
          // тогда выходим из цикла
          if (lines.length >= maxLines) break
          // если в массиве еще есть место
          // очищаем переменную
          currentLine = ''
          i-- // пробуем это же слово в новой строке
          // если в currentLine все-таки что-то есть
        } else {
          const isLastLine = lines.length === maxLines - 1 // проверяем, не последняя ли это строка
          const suffix = isLastLine ? '...' : '' // если последняя — резервируем место под точки

          // если ОДНО слово не влезает в строку — используем бинарный поиск вместо цикла по буквам
          let low = 0
          let high = word.length
          let splitIndex = 0

          while (low <= high) {
            let mid = Math.floor((low + high) / 2)
            // мерим ширину куска текста СРАЗУ с суффиксом
            const testMeasure = ctx.measureText(word.substring(0, mid) + suffix).width

            if (testMeasure <= maxWidth) {
              splitIndex = mid
              low = mid + 1
            } else {
              high = mid - 1
            }
          }

          // если это была последняя строка, добавляем точки и выходим
          if (isLastLine) {
            lines.push(word.substring(0, splitIndex) + '...')
            return lines // дальше считать нет смысла — место кончилось
          } else {
            lines.push(word.substring(0, splitIndex))
            words[i] = word.substring(splitIndex) // остаток слова в следующую итерацию
            i--
          }
        }
      }
    }
    if (lines.length < maxLines && currentLine) {
      lines.push(currentLine)
    }
  }

  // проверяем нужно ли добавить "..." к обычной (не разрезанной бинарным поиском) последней строке
  if (lines.length >= maxLines) {
    const lastIdx = lines.length - 1
    const lastLine = lines[lastIdx]

    // если в последней строке еще нет многоточия значит она не была обработана бинарным поиском
    if (!lastLine.endsWith('...')) {
      let line = lastLine
      // Используем тот же безопасный метод подрезки
      while (ctx.measureText(line + '...').width > maxWidth && line.length > 0) {
        line = line.substring(0, line.length - 1)
      }
      lines[lastIdx] = line + '...'
    }
  }

  return lines
}
