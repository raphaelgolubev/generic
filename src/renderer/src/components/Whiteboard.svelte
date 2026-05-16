<script lang="ts">
  import { onMount } from 'svelte'
  import type { Tool, CanvasObject, ShapeType } from '../types'
  import { renderScene } from '../canvasUtils'
  import { inputHandler } from '../inputHandler'
  import {
    objects,
    selectedIds,
    scale,
    offsetX,
    offsetY,
    sceneActions,
    GRID_SIZE,
    theme
  } from '../store'
  import ContextMenu from './ContextMenu.svelte'
  import ObjectPopup from './ObjectPopup.svelte'
  import SizeLabel from './SizeLabel.svelte'

  export let activeTool: Tool
  export let activeShape: ShapeType
  export let MAX_ZOOM: number
  export let MIN_ZOOM: number

  let menuPos = { x: 0, y: 0 }
  let showMenu = false

  let isCanvasDragging = false // взводится при panning
  let isLeftMouseButtonBusy = false

  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D
  // состояние камеры
  let isSpacePressed = false // для режима "руки" через пробел
  // textarea
  let textareaRef: HTMLTextAreaElement
  let editingId: string | null = null

  // реактивный курсор
  // Реактивный расчет актуального класса курсора
  $: cursorClass = (() => {
    if (isCanvasDragging) return 'cursor-figjam-grabbing'
    if (isSpacePressed || activeTool === 'hand') return 'cursor-figjam-grab'
    if (activeTool === 'shape' || activeTool === 'arrow') return 'cursor-figjam-crosshair'
    return 'cursor-figjam-select'
  })()

  function animate(): void {
    if (!ctx) return

    renderScene(
      ctx,
      canvas,
      $objects,
      $selectedIds,
      $scale,
      $offsetX,
      $offsetY,
      GRID_SIZE,
      inputHandler.currentMarquee
    )

    requestAnimationFrame(animate)
  }

  function handleContextMenu(e: MouseEvent): void {
    e.preventDefault()
    // Проверяем, кликнули ли мы по объекту (опционально)
    const hit = inputHandler.getHitObject(e.clientX, e.clientY)
    if (hit) {
      // Если кликнули по новому объекту, выбираем его
      if (!$selectedIds.includes(hit.id)) {
        selectedIds.set([hit.id])
      }
      menuPos = { x: e.clientX, y: e.clientY }
      showMenu = true
    } else {
      showMenu = false
    }
  }

  function handleDblClick(e: MouseEvent): void {
    // ищем, по какому объекту кликнули
    const hit = inputHandler.getHitObject(e.clientX, e.clientY)

    if (hit) {
      startEditing(hit)
    }
  }

  function handleMouseDown(e: MouseEvent): void {
    isLeftMouseButtonBusy = true

    // Проверяем, началось ли панорамирование холста (инструмент рука, зажатый пробел или колесико)
    if (activeTool === 'hand' || isSpacePressed || e.button === 1) {
      isCanvasDragging = true
    }

    inputHandler.handleMouseDown(e, activeTool, activeShape, isSpacePressed)

    if (activeTool === 'shape') {
      activeTool = 'select'
    }
  }
  function handleMouseUp(): void {
    isLeftMouseButtonBusy = false
    isCanvasDragging = false // сбрасываем перетаскивание холста
  }
  // управление через пробел
  function handleKeyDown(e: KeyboardEvent): void {
    if (e.code === 'Space') {
      isSpacePressed = true
    }
  }
  function handleKeyUp(e: KeyboardEvent): void {
    if (e.code === 'Space') {
      isSpacePressed = false
    }
  }

  // -----EDITING TEXT
  function startEditing(obj: CanvasObject): void {
    editingId = obj.id

    // фокусируемся на textarea после того, как Svelte его отрисует
    setTimeout(() => textareaRef?.focus(), 0)
  }

  function stopEditing(): void {
    editingId = null
  }
  // ----- EDITING TEXT

  onMount(() => {
    ctx = canvas.getContext('2d')!
    const resize = (): void => {
      const dpr = window.devicePixelRatio || 1

      // устанавливаем размер буфера (сколько пикселей внутри)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr

      // устанавливаем визуальный размер через CSS
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`

      // масштабируем контекст, чтобы нам не пришлось менять
      // координаты во всем остальном коде
      ctx.scale(dpr, dpr)
    }
    window.addEventListener('resize', resize)
    resize()
    animate()
  })
</script>

<!-- добавляем слушатели на окно для клавиатуры -->
<svelte:window
  on:mousedown={() => (showMenu = false)}
  on:wheel={() => (showMenu = false)}
  on:keydown={(e) => {
    handleKeyDown(e)
    // удаляем объект, если он выбран и мы не в режиме редактирования текста
    if ((e.key === 'Delete' || e.key === 'Backspace') && $selectedIds && !editingId) {
      sceneActions.deleteSelected()
    }

    if (e.key === 'Escape') showMenu = false
  }}
  on:keyup={handleKeyUp}
/>

<div class="canvas-container">
  <canvas
    bind:this={canvas}
    class={cursorClass}
    on:mousedown={handleMouseDown}
    on:mouseup={() => {
      handleMouseUp()
      inputHandler.handleMouseUp()
    }}
    on:mousemove={(e) => inputHandler.handleMouseMove(e)}
    on:mouseleave={() => {
      handleMouseUp()
      inputHandler.handleMouseUp()
    }}
    on:wheel|preventDefault={(e) => inputHandler.handleWheel(e, MIN_ZOOM, MAX_ZOOM)}
    on:dblclick={handleDblClick}
    on:contextmenu={handleContextMenu}
    style:--canvas-color={theme.canvasBackgroundColor}
  ></canvas>

  <SizeLabel {scale} {offsetX} {offsetY} />

  {#if showMenu}
    <ContextMenu x={menuPos.x} y={menuPos.y} close={() => (showMenu = false)} />
  {/if}

  <!-- ЗДЕСЬ Popup для редактирования текста -->
  {#if editingId}
    <!-- Ищем объект в массиве идентификатор которого соответствует editingId -->
    <!-- Мы получаем editingId в функции handleDblClick -->
    {@const obj = $objects.find((o) => o.id === editingId)}
    <!-- Если объект в массиве найден и это не стрелка -->
    {#if obj && obj.type != 'arrow'}
      <!-- Создаем Popup -->
      <div
        class="floating-editor"
        style="
        left: {obj.x * $scale + $offsetX}px; 
        top: {(obj.y + obj.height) * $scale + $offsetY + 10}px; 
      "
      >
        <textarea
          bind:this={textareaRef}
          bind:value={obj.text}
          placeholder="Напишите что-нибудь..."
          on:blur={stopEditing}
          on:keydown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              stopEditing()
            }
            if (e.key === 'Escape') stopEditing()
          }}
        ></textarea>
      </div>
    {/if}
  {/if}

  <!-- НАШ НОВЫЙ ВЫНЕСЕННЫЙ КОМПОНЕНТ ПАРАМЕТРОВ -->
  {#if !editingId}
    <ObjectPopup {scale} {offsetX} {offsetY} {isLeftMouseButtonBusy} />
  {/if}
</div>

<style>
  canvas {
    display: block;
    width: 100vw;
    height: 100vh;
    background: var(--canvas-color);
  }

  .canvas-container {
    position: relative;
    width: 100vw;
    height: 100vh;
  }

  textarea {
    width: 100%;
    height: 200px;
    padding: 20px;
    border: none;
    outline: none;
    font-family: sans-serif;
    font-size: 16px;
    line-height: 1.5;
    resize: none;
  }

  .floating-editor {
    position: absolute;
    z-index: 1000;
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
    /* центрируем относительно объекта по горизонтали, если нужно */
    transform: translateX(0);
  }

  .floating-editor textarea {
    width: 240px;
    height: 120px;
    padding: 12px;
    background: white;
    border: 2px solid #18a0fb;
    border-radius: 8px;
    outline: none;
    resize: vertical; /* разрешаем менять высоту только вручную */
    font-family: sans-serif;
    font-size: 14px;
    line-height: 1.4;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }

  /* маленький треугольник-указатель сверху */
  .floating-editor::before {
    content: '';
    position: absolute;
    top: -6px;
    left: 20px;
    width: 12px;
    height: 12px;
    background: white;
    border-left: 2px solid #18a0fb;
    border-top: 2px solid #18a0fb;
    transform: rotate(45deg);
  }
</style>
