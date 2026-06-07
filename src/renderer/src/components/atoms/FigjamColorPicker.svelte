<script lang="ts">
  import { objects, selectedIds } from '../../core/state'
  import { FIGJAM_PALETTE } from '../../core/constants'
  import type { CanvasObject, SceneObject, ArrowObject, TextObject } from '../../types'
  import { hexToRgba } from '../../core/maths'

  export let obj: CanvasObject
  export let title: string
  // Исправлено: убрали any, заменили на строгое объединение доступных ключей
  export let propertyName: keyof SceneObject | keyof ArrowObject | keyof TextObject
  export let preview: 'color' | 'stroke'

  let isOpen = false
  let hiddenInputRef: HTMLInputElement

  // Безопасно проверяем strokeWidth у прямоугольных объектов
  const currentStrokeWidth =
    obj.type !== 'arrow' && 'strokeWidth' in obj ? (obj.strokeWidth ?? 3) : 3
  let currentFillMode = currentStrokeWidth === 0 ? 'no-fill' : 'fill'

  const selectColor = (color: string): void => {
    let targetColor = color
    if (propertyName === 'color') {
      if (currentFillMode === 'transparent') {
        targetColor = hexToRgba(color, 0.15)
      } else if (currentFillMode === 'no-fill') {
        currentFillMode = 'fill'
      }
    }

    objects.update((objs) =>
      objs.map((o) => {
        if ($selectedIds.includes(o.id)) {
          // Если мы меняем цвет заливки и выбран режим "No fill",
          // возвращаем обводку, при условии, что это не стрелка
          if (propertyName === 'color' && currentFillMode === 'fill' && o.type !== 'arrow') {
            return {
              ...o,
              [propertyName]: targetColor,
              strokeWidth: 3
            } as CanvasObject
          }

          // В обычном случае просто обновляем динамическое свойство без использования as any
          return {
            ...o,
            [propertyName]: targetColor
          } as CanvasObject
        }
        return o
      })
    )
  }

  const setFillMode = (mode: 'fill' | 'transparent' | 'no-fill'): void => {
    currentFillMode = mode
    objects.update((objs) =>
      objs.map((o) => {
        if ($selectedIds.includes(o.id) && o.type !== 'arrow') {
          // Вытаскиваем текущий чистый HEX базового цвета (или берем дефолтный)
          // Если текущий цвет уже rgba, можно вырезать первые 7 символов или хранить hex в объекте
          const baseColor = o.color.startsWith('#') ? o.color : '#F14E32'

          if (mode === 'fill') {
            return { ...o, color: baseColor, strokeWidth: 3 } as CanvasObject
          }
          if (mode === 'transparent') {
            return { ...o, color: hexToRgba(baseColor, 0.15), strokeWidth: 3 } as CanvasObject
          }
          if (mode === 'no-fill') {
            return { ...o, color: 'transparent', strokeWidth: 3 } as CanvasObject
          }
        }
        return o
      })
    )
  }

  // Добавлен возвращаемый тип : void
  function handleWindowMouseDown(e: MouseEvent): void {
    if (isOpen && !(e.target as HTMLElement).closest('.figjam-color-picker-container')) {
      isOpen = false
    }
  }
</script>

<svelte:window on:mousedown={handleWindowMouseDown} />

<div class="figjam-color-picker-container">
  <button
    class="picker-trigger {preview}"
    style={preview === 'color'
      ? `background-color: ${String(obj[propertyName as keyof CanvasObject] || 'transparent')}`
      : `border-color: ${String(obj[propertyName as keyof CanvasObject] || '#000')}`}
    on:mousedown|stopPropagation={() => (isOpen = !isOpen)}
    {title}
  >
  </button>

  {#if isOpen}
    <div class="figjam-dropdown" role="presentation" on:mousedown|stopPropagation>
      {#if propertyName === 'color' && obj.type !== 'arrow'}
        <div class="fill-modes">
          <button
            class:active={currentFillMode === 'fill'}
            on:mousedown={() => setFillMode('fill')}
          >
            <span class="mode-icon fill"></span> Fill
          </button>
          <button
            class:active={currentFillMode === 'transparent'}
            on:mousedown={() => setFillMode('transparent')}
          >
            <span class="mode-icon transparent"></span> Transparent
          </button>
          <button
            class:active={currentFillMode === 'no-fill'}
            on:mousedown={() => setFillMode('no-fill')}
          >
            <span class="mode-icon no-fill"></span> No fill
          </button>
        </div>
        <div class="menu-divider"></div>
      {/if}

      <div class="color-grid">
        {#each FIGJAM_PALETTE as color (color)}
          {@const currentObjColor = String(obj[propertyName as keyof CanvasObject])}
          <!-- Считаем точку выбранной, если совпадает чистый HEX ИЛИ если rgba-цвет включает в себя этот оттенок -->
          {@const isSelectedColor =
            currentObjColor === color ||
            (currentObjColor.startsWith('rgba') &&
              currentObjColor.includes(hexToRgba(color, 0.15).slice(0, -5)))}

          <button
            class="color-dot"
            style="background-color: {color};"
            class:selected={isSelectedColor}
            on:mousedown={() => selectColor(color)}
            aria-label="Select color {color}"
          >
          </button>
        {/each}

        <button
          class="custom-rainbow"
          on:mousedown={() => hiddenInputRef.click()}
          aria-label="Custom color picker"
        >
          <input
            type="color"
            bind:this={hiddenInputRef}
            value={String(obj[propertyName as keyof CanvasObject] || '#000000')}
            on:input={(e) => selectColor(e.currentTarget.value)}
          />
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Стили остаются без изменений */
  .figjam-color-picker-container {
    position: relative;
    display: inline-flex;
  }
  .picker-trigger {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid transparent;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
    transition: transform 0.1s;
    padding: 0;
  }
  .picker-trigger.stroke {
    background: transparent;
    border-width: 3px;
  }
  .picker-trigger:hover {
    transform: scale(1.1);
  }
  .figjam-dropdown {
    position: absolute;
    bottom: 34px;
    left: 50%;
    transform: translateX(-50%);
    background: #1e1e1e;
    border-radius: 12px;
    padding: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    gap: 12px;
    z-index: 3000;
    /* width: 250px; */
  }
  .fill-modes {
    display: flex;
    gap: 4px;
  }
  .fill-modes button {
    background: transparent;
    border: none;
    color: #b3b3b3;
    font-size: 11px;
    font-weight: 500;
    padding: 6px 10px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }
  .fill-modes button:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
  .fill-modes button.active {
    background: #2c2c2c;
    color: #fff;
  }
  .mode-icon {
    width: 10px;
    height: 10px;
    border: 1px solid #fff;
    display: inline-block;
  }
  .mode-icon.fill {
    background: #fff;
  }
  .mode-icon.transparent {
    background: rgba(255, 255, 255, 0.2);
    border-style: dashed;
  }
  .mode-icon.no-fill {
    background: transparent;
    position: relative;
  }
  .mode-icon.no-fill::before {
    content: '';
    position: absolute;
    top: 4px;
    left: -1px;
    width: 10px;
    height: 1px;
    background: red;
    transform: rotate(45deg);
  }
  .menu-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
    margin: 2px 0;
  }
  .color-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 8px;
    width: 100%;
  }
  .color-dot {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
    position: relative;
    padding: 0;
    transition: transform 0.1s;
  }
  .color-dot:hover {
    transform: scale(1.15);
  }
  .color-dot.selected::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 6px;
    height: 6px;
    background: #000;
    border-radius: 50%;
  }
  .color-dot[style*='background-color: #444444'].selected::after,
  .color-dot[style*='background-color: #7F7F7F'].selected::after {
    background: #fff;
  }
  .custom-rainbow {
    background:
      radial-gradient(50% 50% at 50% 50%, #ffffff 0%, transparent 100%),
      conic-gradient(
        from 0deg at 50% 50%,
        red,
        #ffa800 47.73deg,
        #ff0 79.56deg,
        #0f0 121.33deg,
        #0ff 180.99deg,
        #00f 238.67deg,
        #f0f 294.36deg,
        red 360deg
      ),
      #c4c4c4;
    /* border: 1px solid rgba(255, 255, 255, 0.2); */
    position: relative;
    border-radius: 50%;
    border: none;
  }
  /* Скрываем системный инпут, сохраняя его кликабельность */
  .custom-rainbow input[type='color'] {
    position: absolute;
    top: 0;
    left: 0;
    width: 10%;
    height: 10%;
    opacity: 0; /* Полная прозрачность — системный квадрат исчезнет */
    cursor: pointer;
    padding: 0;
    border: none;
  }
</style>
