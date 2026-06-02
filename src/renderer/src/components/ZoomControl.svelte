<script lang="ts">
  import { scale, offsetX, offsetY, isAnyBarHovered } from '../core/state'

  export let MAX_ZOOM: number
  export let MIN_ZOOM: number

  function resetView(): void {
    $scale = 3
    $offsetX = 0
    $offsetY = 0
  }

  // функция плавного изменения зума с фиксацией центра экрана
  function applyZoom(newScale: number): void {
    const oldScale = $scale
    // Ограничиваем масштаб по заданным рамкам
    const clampedScale = Math.min(Math.max(MIN_ZOOM, newScale), MAX_ZOOM)

    if (clampedScale === oldScale) return

    // Вычисляем точку, относительно которой зумим (строго центр экрана)
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2

    // Корректируем смещение холста, чтобы центр не улетал
    $offsetX = centerX - (centerX - $offsetX) * (clampedScale / oldScale)
    $offsetY = centerY - (centerY - $offsetY) * (clampedScale / oldScale)
    $scale = clampedScale
  }

  // обработчик для ползунка input range
  function handleRangeInput(e: Event): void {
    const target = e.target as HTMLInputElement
    applyZoom(parseFloat(target.value))
  }

  function zoomIn(): void {
    applyZoom($scale * 1.25)
  }
  function zoomOut(): void {
    applyZoom($scale / 1.25)
  }

  // рассчитываем процент для отображения
  $: zoomPercent = Math.round($scale * 100)
</script>

<div
  class="zoom-control"
  role="slider"
  aria-valuenow="3"
  tabindex="-1"
  on:mouseenter={() => isAnyBarHovered.set(true)}
  on:mouseleave={() => isAnyBarHovered.set(false)}
>
  <button class="percent-btn" on:click={resetView} title="Reset view">
    {zoomPercent}%
  </button>

  <div class="controls">
    <button on:click={zoomOut} title="Zoom Out">−</button>

    <input
      type="range"
      min={MIN_ZOOM}
      max={MAX_ZOOM}
      step="0.01"
      value={$scale}
      on:input={handleRangeInput}
      style="--progress: {(($scale - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100}%;"
    />

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
    /* Убираем дефолтные стили браузера */
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
  }

  /* 1. СТИЛИЗАЦИЯ БЕГУНКА (Кругляшок) */
  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    margin-top: -5px; /* Центрируем относительно дорожки ( (14px - 4px) / 2 ) */
    height: 14px;
    width: 14px;
    border-radius: 50%;
    background: var(--accent-color); /* Твой цвет из темы */
    transition: transform 0.1s ease;
  }

  input[type='range']::-webkit-slider-thumb:hover {
    transform: scale(1.2); /* Легкий интерактив при наведении */
  }

  /* 2. СТИЛИЗАЦИЯ ДОРОЖКИ (Полоса) */
  input[type='range']::-webkit-slider-runnable-track {
    width: 100%;
    height: 4px;
    /* Градиент рисует оранжевый цвет от 0% до ползунка, а дальше оставляет светло-серый */
    background: linear-gradient(
      to right,
      var(--accent-color) 0%,
      var(--accent-color) var(--progress),
      #e0e0e0 var(--progress),
      #e0e0e0 100%
    );
    border-radius: 2px;
  }

  /* За фокус состояния */
  input[type='range']:focus {
    outline: none;
  }
</style>
