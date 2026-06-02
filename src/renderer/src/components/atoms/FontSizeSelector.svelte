<script lang="ts">
  import { objects, selectedIds } from '../../core/state'
  import type { CanvasObject, SceneObject, TextObject } from '../../types'

  export let obj: CanvasObject
  export let title = 'Font size'
  export let propertyName: keyof SceneObject | keyof TextObject = 'fontSize'

  const sizeOptions = [
    { label: 'S', value: 12 },
    { label: 'M', value: 16 },
    { label: 'L', value: 24 },
    { label: 'XL', value: 32 },
    { label: 'XXL', value: 48 }
  ]
</script>

<div class="select-wrapper size-select" {title}>
  <select
    value={obj[propertyName] || 16}
    on:change={(e) => {
      const size = parseInt(e.currentTarget.value, 10)
      objects.update((objs) =>
        objs.map((o) => ($selectedIds.includes(o.id) ? { ...o, [propertyName]: size } : o))
      )
    }}
  >
    <!-- Добавляем уникальный ключ (option.value) для каждой итерации -->
    {#each sizeOptions as option (option.value)}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>

  <svg class="select-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none">
    <path
      d="M1 1L5 5L9 1"
      stroke="#666"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</div>

<style>
  .select-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    background: #f5f5f5;
    border-radius: 6px;
    padding: 0 8px;
    height: 28px;
  }
  select {
    border: none;
    background: transparent;
    outline: none;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    padding-right: 14px;
    appearance: none;
    color: #333;
  }
  .select-arrow {
    position: absolute;
    right: 8px;
    pointer-events: none;
  }
</style>
