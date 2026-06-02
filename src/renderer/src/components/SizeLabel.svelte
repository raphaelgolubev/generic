<script lang="ts">
  import { objects, selectedIds } from '../core/state'
  import type { Writable } from 'svelte/store'

  export let scale: Writable<number>
  export let offsetX: Writable<number>
  export let offsetY: Writable<number>

  $: obj = $objects.find((o) => o.id === $selectedIds[$selectedIds.length - 1])

  // Позиционируем под нижней границей объекта
  // (y + height) * scale + offsetY — это экранная координата низа объекта
  $: style =
    obj && obj.type !== 'arrow'
      ? `left: ${(obj.x + obj.width / 2) * $scale + $offsetX}px; ` +
        `top: ${(obj.y + obj.height) * $scale + $offsetY + 10}px;`
      : ''
</script>

{#if obj && obj.type !== 'arrow'}
  <div class="size-label" {style}>
    {Math.round(obj.width)} × {Math.round(obj.height)}
  </div>
{/if}

<style>
  .size-label {
    position: fixed;
    /* Центрируем по горизонтали, но прижимаем к верху (под объект) */
    transform: translateX(-50%);
    background: var(--accent-color);
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 11px;
    font-weight: 600;
    pointer-events: none;
    z-index: 90;
    white-space: nowrap;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    /* Плавное появление снизу */
    animation: fadeIn 0.1s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translate(-50%, -4px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
</style>
