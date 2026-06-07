<script lang="ts">
  import { objects, selectedIds } from '../../core/state'
  import type { CanvasObject, SceneObject, TextObject } from '../../types'

  export let obj: CanvasObject
  export let title: string
  export let propertyName: keyof SceneObject | keyof TextObject

  // Диапазон значений ползунка (пропсы с дефолтными значениями)
  export let min = 1
  export let max = 100
  export let step = 1
  export let defaultValue = 16
</script>

<div class="slider-wrapper" {title}>
  <span class="slider-label">{title}:</span>

  <input
    type="range"
    {min}
    {max}
    {step}
    /* Считываем текущее значение свойства из объекта */
    value={obj[propertyName] ?? defaultValue}
    /* Изменяем стейт в реальном времени при движении мыши */
    on:input={(e) => {
      const value = parseInt(e.currentTarget.value, 10)
      objects.update((objs) =>
        objs.map((o) => ($selectedIds.includes(o.id) ? { ...o, [propertyName]: value } : o))
      )
    }}
  />

  <!-- Отображаем текущее числовое значение справа от ползунка -->
  <span class="slider-value">{obj[propertyName] ?? defaultValue}px</span>
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
