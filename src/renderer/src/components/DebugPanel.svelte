<script lang="ts">
  import { mouse, isAnyBarHovered } from '../core/state'

  // добавляем небольшое смещение, чтобы панель не перекрывалась самим курсором
  const OFFSET_X = 16
  const OFFSET_Y = 16
</script>

{#if !$isAnyBarHovered}
  <!-- Привязываем позицию панели напрямую к экранным координатам мыши -->
  <div class="panel" style="left: {$mouse.mouseX + OFFSET_X}px; top: {$mouse.mouseY + OFFSET_Y}px;">
    <div class="coord-row">
      <span class="label">SCR:</span>
      <span class="value">X: {$mouse.mouseX}</span>
      <span class="value">Y: {$mouse.mouseY}</span>
    </div>

    <div class="coord-row">
      <span class="label">WRLD:</span>
      <!-- Округляем до 1 знака после запятой, чтобы текст не прыгал -->
      <span class="value">X: {$mouse.worldMouseX.toFixed(1)}</span>
      <span class="value">Y: {$mouse.worldMouseY.toFixed(1)}</span>
    </div>
  </div>
{/if}

<style>
  .panel {
    position: fixed;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 6px 10px;
    background: rgba(30, 30, 30, 0.85); /* Темный стильный полупрозрачный фон */
    backdrop-filter: blur(4px); /* Легкое размытие заднего плана в духе macOS */
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 9999; /* Поверх абсолютно всех элементов, включая попапы */
    pointer-events: none; /* Клик проходит сквозь дебаг-панель на холст */
    user-select: none;
    font-family: monospace; /* Моноширинный шрифт идеален для цифр */
    font-size: 11px;
    color: #fff;
    white-space: nowrap;
  }

  .coord-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .label {
    color: #888;
    font-weight: bold;
    min-width: 35px;
  }

  .value {
    min-width: 55px;
  }
</style>
