<script lang="ts">
  import { objects, selectedIds, isAnyBarHovered } from '../core/state'
  import type { Writable } from 'svelte/store'
  import { sceneActions } from '../scene'
  import { worldToScreen } from '../core/maths'
  import type { ShapeType } from '../types'
  import ColorPicker from './atoms/colorPicker.svelte'
  import FontSizeSelector from './atoms/FontSizeSelector.svelte'

  // Принимаем сторы как пропсы
  export let scale: Writable<number>
  export let offsetX: Writable<number>
  export let offsetY: Writable<number>
  export let isLeftMouseButtonBusy: boolean

  // Находим последний выбранный объект
  $: obj = $objects.find((o) => o.id === $selectedIds[$selectedIds.length - 1])

  // Реактивный расчет стиля позиции поп-апа с использованием core/maths
  $: popupStyle = (() => {
    if (!obj) return ''

    // Определяем мировые координаты опорной точки объекта для привязки поп-апа
    // Если это стрелка — привязываемся к концу, если фигура или текст — к левому верхнему углу
    const worldX = obj.type === 'arrow' ? obj.end.x : obj.x
    const worldY = obj.type === 'arrow' ? obj.end.y : obj.y

    // Переводим мировые координаты в экранные пиксели
    const screenPos = worldToScreen(worldX, worldY, $scale, $offsetX, $offsetY)

    // Позиционируем поп-ап на 60px выше объекта и применяем защитное масштабирование UI
    const scaleFactor = $scale < 0.5 ? 0.8 : 1

    return `left: ${screenPos.x}px; top: ${screenPos.y - 60}px; transform: scale(${scaleFactor});`
  })()

  function updateArrowProperty(id: string, property: string, value: string): void {
    objects.update((objs) => objs.map((o) => (o.id === id ? { ...o, [property]: value } : o)))
  }
</script>

{#if obj && !isLeftMouseButtonBusy}
  <div
    class="object-popup"
    style={popupStyle}
    role="toolbar"
    tabindex="-1"
    on:mouseenter={() => isAnyBarHovered.set(true)}
    on:mouseleave={() => isAnyBarHovered.set(false)}
  >
    <!-- ИНТЕРФЕЙС ДЛЯ СТРЕЛОК -->
    {#if obj.type === 'arrow'}
      <div class="select-wrapper">
        <select
          value={obj.mode}
          on:change={(e) => updateArrowProperty(obj.id, 'mode', e.currentTarget.value)}
        >
          <option value="straight">Прямая</option>
          <option value="orthogonal">Ломанная</option>
          <option value="bezier">Дуговая</option>
        </select>
        <svg class="select-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none"
          ><path
            d="M1 1L5 5L9 1"
            stroke="#666"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          /></svg
        >
      </div>

      <div class="divider"></div>

      <div class="select-wrapper">
        <select
          value={obj.startHead}
          on:change={(e) => updateArrowProperty(obj.id, 'startHead', e.currentTarget.value)}
        >
          <option value="none">Начало</option>
          <option value="arrow">Начало: стрелка</option>
          <option value="triangle">Начало: треугольник</option>
        </select>
        <svg class="select-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none"
          ><path
            d="M1 1L5 5L9 1"
            stroke="#666"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          /></svg
        >
      </div>

      <div class="select-wrapper">
        <select
          value={obj.endHead}
          on:change={(e) => updateArrowProperty(obj.id, 'endHead', e.currentTarget.value)}
        >
          <option value="none">Конец</option>
          <option value="arrow">Конец: стрелка</option>
          <option value="triangle">Конец: треугольник</option>
        </select>
        <svg class="select-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none"
          ><path
            d="M1 1L5 5L9 1"
            stroke="#666"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          /></svg
        >
      </div>
    {/if}

    <!-- ИНТЕРФЕЙС ДЛЯ ФИГУР -->
    {#if obj.type === 'circle' || obj.type === 'rect' || obj.type === 'roundRect'}
      <!-- Выбор цвета заливки -->
      <ColorPicker {obj} title="Цвет заливки" propertyName="color" preview="color" />

      <div class="divider"></div>

      <!-- Выбор цвета рамки -->
      <ColorPicker {obj} title="Цвет обводки" propertyName="strokeColor" preview="stroke" />

      <!-- Выбор толщины рамки -->
      <div class="select-wrapper width-select">
        <select
          value={obj.strokeWidth?.toString() || '3'}
          on:change={(e) => {
            const width = parseInt(e.currentTarget.value)
            objects.update((objs) =>
              objs.map((o) => ($selectedIds.includes(o.id) ? { ...o, strokeWidth: width } : o))
            )
          }}
        >
          <option value="0">Без рамки</option>
          <option value="3">Тонкая</option>
          <option value="6">Средняя</option>
          <option value="9">Толстая</option>
        </select>
        <svg class="select-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none"
          ><path
            d="M1 1L5 5L9 1"
            stroke="#666"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          /></svg
        >
      </div>

      <!-- Выбор фигуры -->
      <div class="select-wrapper">
        <select
          value={obj.type}
          on:change={(e) => {
            const newType = e.currentTarget.value as ShapeType
            objects.update((objs) =>
              objs.map((o) => {
                if ($selectedIds.includes(o.id) && o.type !== 'arrow') {
                  return { ...o, type: newType }
                }
                return o
              })
            )
          }}
        >
          <option value="rect">Квадрат</option>
          <option value="roundRect">Скругленный</option>
          <option value="circle">Круг</option>
        </select>
        <svg class="select-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none"
          ><path
            d="M1 1L5 5L9 1"
            stroke="#666"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          /></svg
        >
      </div>

      <div class="divider"></div>

      <ColorPicker {obj} title="Цвет текста" propertyName="textColor" preview="color" />
      <FontSizeSelector {obj} title="Font Size" propertyName="fontSize" />
    {/if}

    <!-- ИНТЕРФЕЙС ДЛЯ ТЕКСТА -->
    {#if obj.type === 'text'}
      <ColorPicker {obj} title="Цвет текста" propertyName="color" preview="color" />
      <FontSizeSelector {obj} title="Font Size" propertyName="fontSize" />
    {/if}

    <div class="divider"></div>

    <button class="delete-btn" on:click={() => sceneActions.deleteSelected()} title="Удалить">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><path
          d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"
        /></svg
      >
    </button>
  </div>
{/if}

<style>
  .object-popup {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px;
    background: white;
    border-radius: 12px;
    box-shadow:
      0 6px 24px rgba(0, 0, 0, 0.08),
      0 2px 8px rgba(0, 0, 0, 0.04);
    border: 1px solid #e5e5e5;
    pointer-events: all;
    z-index: 100;
    user-select: none;
    transition: transform 0.1s ease;
    transform-origin: bottom left;
  }

  .width-select select {
    padding-right: 20px !important;
    width: 85px;
    min-width: 85px;
  }

  .select-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  .object-popup select {
    -webkit-appearance: none;
    appearance: none;
    border: none;
    background: transparent;
    border-radius: 6px;
    padding: 6px 24px 6px 8px;
    font-family: sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #333;
    cursor: pointer;
    outline: none;
    transition: background 0.15s ease;
  }
  .object-popup select:hover {
    background: #f5f5f5;
  }
  .select-arrow {
    position: absolute;
    right: 8px;
    pointer-events: none;
  }

  .divider {
    width: 1px;
    height: 18px;
    background: #e5e5e5;
    margin: 0 4px;
  }

  .object-popup button {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    color: #555;
    transition: all 0.15s ease;
  }
  .object-popup button:hover {
    background: #f5f5f5;
  }
  .object-popup button.delete-btn:hover {
    background: #fff0f0;
    color: #f44336;
  }
</style>
