<script lang="ts">
  import { objects, selectedIds } from '../../core/state'
  import type { CanvasObject, SceneObject, ArrowObject, TextObject } from '../../types'

  export let obj: CanvasObject
  export let title: string
  // Строгая типизация ключа: propertyName может быть только существующим свойством объекта
  export let propertyName: keyof SceneObject | keyof ArrowObject | keyof TextObject
  export let preview: 'color' | 'stroke'
</script>

<label class="color-picker-wrapper" {title}>
  <input
    type="color"
    value={String(obj[propertyName] || '#000000')}
    on:input={(e) => {
      const newColor = e.currentTarget.value
      objects.update((objs) =>
        objs.map((o) => ($selectedIds.includes(o.id) ? { ...o, [propertyName]: newColor } : o))
      )
    }}
  />

  {#if preview === 'color'}
    <span class="color-preview" style="background-color: {obj[propertyName] || 'transparent'}"
    ></span>
  {/if}

  {#if preview === 'stroke'}
    <!-- Динамически красим рамку в зависимости от переданного propertyName -->
    <span class="stroke-preview" style="border-color: {obj[propertyName] || '#000000'}"></span>
  {/if}
</label>

<style>
  .color-picker-wrapper {
    position: relative;
    width: 28px;
    height: 28px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
  }
  .color-picker-wrapper:hover {
    background: #f5f5f5;
  }
  .color-picker-wrapper input[type='color'] {
    position: absolute;
    opacity: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }
  .color-preview {
    width: 18px;
    height: 18px;
    border-radius: 4px;
    border: 1px solid rgba(0, 0, 0, 0.08);
  }
  .stroke-preview {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    border: 2px solid #000;
    background: transparent;
  }
</style>
