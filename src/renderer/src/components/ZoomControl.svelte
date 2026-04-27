<script lang="ts">
  import { scale, offsetX, offsetY } from '../store'

  export let MAX_ZOOM: number
  export let MIN_ZOOM: number

  function resetView(): void {
    $scale = 1
    $offsetX = 0
    $offsetY = 0
  }

  function setScale(value: number): void {
    $scale = Math.min(Math.max(MIN_ZOOM, value), MAX_ZOOM)
  }

  function zoomIn(): void {
    setScale($scale + 0.1)
  }
  function zoomOut(): void {
    setScale($scale - 0.1)
  }

  // рассчитываем процент для отображения
  $: zoomPercent = Math.round($scale * 100)
</script>

<div class="zoom-control">
  <button class="percent-btn" on:click={resetView} title="Reset view">
    {zoomPercent}%
  </button>

  <div class="controls">
    <button on:click={zoomOut} title="Zoom Out">−</button>

    <input type="range" min={MIN_ZOOM} max={MAX_ZOOM} step="0.01" bind:value={$scale} />

    <button on:click={zoomIn} title="Zoom In">+</button>
  </div>
</div>

<style>
  .percent-btn {
    background: none;
    border: none;
    color: #666;
    padding: 4px 8px;
    cursor: pointer;
    border-radius: 4px;
    min-width: 55px;

    font-family: sans-serif;
    font-size: 14px;
    font-weight: 600;
  }
  .percent-btn:hover {
    background: #f0f0f0;
    color: #000;
  }
  .controls {
    display: flex;
    align-items: center;
    gap: 8px;
    border-left: 1px solid #eee;
    padding-left: 12px;
  }

  .zoom-control {
    position: fixed;
    bottom: 24px;
    right: 24px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    border: 1px solid #e0e0e0;
    z-index: 10;
    user-select: none;
  }

  button {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: #f0f0f0;
    border-radius: 6px;
    cursor: pointer;
    font-size: 18px;
    color: #444;
  }

  button:hover {
    background: #e0e0e0;
  }

  input[type='range'] {
    width: 100px;
    cursor: pointer;
  }
</style>
