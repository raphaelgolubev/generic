<script lang="ts">
  import { fade } from 'svelte/transition'
  import type { ShapeType, Tool } from '../types'
  export let activeTool: Tool
  export let activeShape: ShapeType

  let showShapeMenu = false

  // функция для смены инструмента, которая прокидывает событие наверх
  const setTool = (tool: Tool): void => {
    activeTool = tool
  }

  function mouseEnterOnShapeTool(): void {
    showShapeMenu = true
  }
  function mouseLeaveFromShapeTool(): void {
    if (activeTool !== 'shape') {
      showShapeMenu = false
    }
  }
</script>

<div class="toolbar">
  <button
    class:active={activeTool === 'hand'}
    on:click={() => setTool('hand')}
    title="Hand (Space)"
  >
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      ><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" /><path
        d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"
      /><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" /><path
        d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"
      /></svg
    >
  </button>

  <button
    class:active={activeTool === 'select'}
    on:click={() => setTool('select')}
    title="Select (V)"
  >
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /></svg
    >
  </button>

  <!-- контейнер для инструмента фигур -->
  <div
    class="tool-container"
    role="presentation"
    on:mouseenter={mouseEnterOnShapeTool}
    on:mouseleave={mouseLeaveFromShapeTool}
  >
    {#if showShapeMenu}
      <div class="submenu" role="menu" transition:fade={{ duration: 150 }}>
        <button
          role="menuitem"
          aria-label="Стикер"
          on:click={() => {
            activeShape = 'sticky'
            activeTool = 'shape'
            showShapeMenu = false
          }}
          ><svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8.5L15.5 3z" /><path
              d="M15 3v6h6"
            />
          </svg></button
        >
        <button
          role="menuitem"
          aria-label="Квадрат"
          on:click={() => {
            activeShape = 'rect'
            activeTool = 'shape'
            showShapeMenu = false
          }}
          ><svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg></button
        >
        <button
          role="menuitem"
          aria-label="Круг"
          on:click={() => {
            activeShape = 'circle'
            activeTool = 'shape'
            showShapeMenu = false
          }}
          ><svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="9" />
          </svg></button
        >
      </div>
    {/if}

    <button class:active={activeTool === 'shape'} on:click={() => (activeTool = 'shape')}>
      <!-- иконка меняется в зависимости от выбранной фигуры -->
      {#if activeShape === 'sticky'}
        <!-- Иконка стикера -->
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8.5L15.5 3z" /><path
            d="M15 3v6h6"
          />
        </svg>
      {:else if activeShape === 'rect'}
        <!-- иконка квадрата -->
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      {:else if activeShape === 'circle'}
        <!-- иконка круга -->
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="9" />
        </svg>
      {/if}
    </button>
  </div>

  <button
    class:active={activeTool === 'eraser'}
    on:click={() => setTool('eraser')}
    title="Eraser (E)"
  >
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      ><path d="M20 20H7L3 16C2 15 2 13 3 12L13 2L22 11L20 20Z" /><path d="M17 17L7 7" /></svg
    >
  </button>
</div>

<style>
  .toolbar {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
    padding: 8px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    border: 1px solid #e0e0e0;
    z-index: 10; /* Чтобы быть поверх Canvas */
  }

  .tool-container {
    position: relative;
  }

  .submenu {
    position: absolute;
    bottom: 50px; /* Над панелью */
    /* left: 50%; */
    transform: translateX(-50%);
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: row;
    padding: 10px;
    gap: 16px;
    border: 1px solid #eee;
  }

  .submenu button {
    width: auto;
    height: 32px;
    padding: 0 12px;
    font-size: 12px;
    white-space: nowrap;
  }

  button {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    color: #444;
    transition: all 0.2s;
  }

  button:hover {
    background: #f0f0f0;
  }

  button.active {
    background: #e3f2fd;
    color: #1976d2;
  }
</style>
