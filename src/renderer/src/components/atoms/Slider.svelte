<script lang="ts">
  import { objects, selectedIds } from '../../core/state'
  import { calculateAutoTextDimensions } from '../../core/maths'
  import type { CanvasObject, SceneObject } from '../../types'

  export let obj: CanvasObject
  export let title: string
  export let propertyName: keyof SceneObject

  // Диапазон значений ползунка
  export let min = 1
  export let max = 100
  export let step = 1
  export let defaultValue = 16

  // Создаем типизированную ссылку на объект, если это SceneObject
  $: sceneObj = obj.type !== 'arrow' ? (obj as SceneObject) : null
</script>

<div class="slider-wrapper" {title}>
  <span class="slider-label">{title}:</span>

  <input
    type="range"
    {min}
    {max}
    {step}
    /* Строка 25: Безопасно считываем значение без any */
    value={sceneObj ? (sceneObj[propertyName] ?? defaultValue) : defaultValue}
    on:input={(e) => {
      const value = parseInt(e.currentTarget.value, 10)

      objects.update((objs) =>
        objs.map((o) => {
          if ($selectedIds.includes(o.id)) {
            // Строка 33: Создаем новый объект, расширяя текущий, без as any
            const updated: CanvasObject = { ...o, [propertyName]: value }

            // Строка 40: Проверяем авторесайз через безопасное приведение к SceneObject
            if (propertyName === 'fontSize' && o.type !== 'arrow' && 'text' in o && o.text) {
              const canvas = document.querySelector('canvas')
              const canvasCtx = canvas?.getContext('2d')
              if (canvasCtx) {
                const currentText = (o as SceneObject).text || ''
                const dims = calculateAutoTextDimensions(canvasCtx, currentText, value)

                // Перезаписываем габариты в рамках того же типа
                const target = updated as SceneObject
                target.width = dims.width
                target.height = dims.height
              }
            }
            return updated
          }
          return o
        })
      )
    }}
  />

  <span class="slider-value">
    {sceneObj ? (sceneObj[propertyName] ?? defaultValue) : defaultValue}px
  </span>
</div>

<style>
  .slider-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 4px;
    height: 28px;
    font-family: sans-serif;
    user-select: none;
  }

  .slider-label {
    font-size: 11px;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }

  .slider-value {
    font-size: 12px;
    font-weight: 500;
    color: #333;
    min-width: 36px;
    text-align: right;
  }

  /* Стилизация самого ползунка под минималистичный стиль доски */
  input[type='range'] {
    /* -webkit-appearance: none; */
    width: 100px;
    height: 4px;
    background: #e0e0e0;
    border-radius: 2px;
    outline: none;
    cursor: pointer;
  }

  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #0b84fe; /* Цвет вашей основной темы */
    transition: transform 0.1s;
  }

  input[type='range']::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }
</style>
