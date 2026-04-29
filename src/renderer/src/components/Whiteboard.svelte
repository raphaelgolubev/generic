<script lang="ts">
  import { onMount } from 'svelte'
  import type { Tool, CanvasObject, ShapeType } from '../types'
  import { renderScene } from '../canvasUtils'
  import { inputHandler } from '../inputHandler'
  import { objects, selectedIds, scale, offsetX, offsetY, sceneActions, GRID_SIZE } from '../store'
  import ContextMenu from './ContextMenu.svelte'

  export let activeTool: Tool
  export let activeShape: ShapeType
  export let MAX_ZOOM: number
  export let MIN_ZOOM: number

  let menuPos = { x: 0, y: 0 }
  let showMenu = false

  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D
  // состояние камеры
  let isSpacePressed = false // для режима "руки" через пробел
  // textarea
  let textareaRef: HTMLTextAreaElement
  let editingId: string | null = null

  // реактивный курсор
  $: if (canvas) {
    if (isSpacePressed || activeTool === 'hand') canvas.style.cursor = 'grab'
    else canvas.style.cursor = 'crosshair'
  }

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
    inputHandler.handleMouseDown(e, activeTool, activeShape, isSpacePressed)

    // если мы только что создали объект (инструмент был shape),
    // переключаем на select для удобства
    if (activeTool === 'shape') {
      activeTool = 'select'
    }
  }
  // управление через пробел
  function handleKeyDown(e: KeyboardEvent): void {
    if (e.code === 'Space') {
      isSpacePressed = true
      canvas.style.cursor = 'grab'
    }
  }
  function handleKeyUp(e: KeyboardEvent): void {
    if (e.code === 'Space') {
      isSpacePressed = false
      canvas.style.cursor = 'crosshair'
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
    on:mousedown={handleMouseDown}
    on:mousemove={(e) => inputHandler.handleMouseMove(e)}
    on:mouseup={() => inputHandler.handleMouseUp()}
    on:mouseleave={() => inputHandler.handleMouseUp()}
    on:wheel|preventDefault={(e) => inputHandler.handleWheel(e, MIN_ZOOM, MAX_ZOOM)}
    on:dblclick={handleDblClick}
    on:contextmenu={handleContextMenu}
  ></canvas>

  {#if showMenu}
    <ContextMenu x={menuPos.x} y={menuPos.y} close={() => (showMenu = false)} />
  {/if}

  {#if editingId}
    {@const obj = $objects.find((o) => o.id === editingId)}
    {#if obj && obj.type != 'arrow'}
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

  {#if $selectedIds.length > 0 && !editingId}
    {@const obj = $objects.find((o) => o.id === $selectedIds[$selectedIds.length - 1])}
    {#if obj}
      <div
        class="object-popup"
        style="
        left: {(obj.type === 'arrow' ? obj.end.x : obj.x) * $scale + $offsetX}px; 
        top: {(obj.type === 'arrow' ? obj.end.y : obj.y) * $scale + $offsetY - 60}px;
        transform: scale({$scale < 0.5 ? 0.8 : 1});
      "
      >
        {#if obj.type === 'arrow'}
          <!-- ИНТЕРФЕЙС ДЛЯ СТРЕЛКИ -->
          <select bind:value={obj.mode} on:change={() => objects.update((objs) => objs)}>
            <option value="straight">Straight</option>
            <option value="orthogonal">Step</option>
            <option value="bezier">Bezier</option>
          </select>

          <div class="divider"></div>

          <!-- Наконечник начала -->
          <select bind:value={obj.startHead} on:change={() => objects.update((objs) => objs)}>
            <option value="none">Start: None</option>
            <option value="arrow">Start: Arrow</option>
            <option value="triangle">Start: Triangle</option>
          </select>

          <!-- Наконечник конца -->
          <select bind:value={obj.endHead} on:change={() => objects.update((objs) => objs)}>
            <option value="none">End: None</option>
            <option value="arrow">End: Arrow</option>
            <option value="triangle">End: Triangle</option>
          </select>
        {:else}
          <!-- ИНТЕРФЕЙС ДЛЯ ФИГУР -->
          <input
            type="color"
            value={obj.color}
            on:input={(e) => {
              const newColor = e.currentTarget.value
              objects.update((objs) =>
                objs.map((o) => ($selectedIds.includes(o.id) ? { ...o, color: newColor } : o))
              )
            }}
          />
          <select
            value={obj.type}
            on:change={(e) => {
              const newType = e.currentTarget.value as ShapeType
              objects.update((objs) =>
                objs.map((o) => {
                  // меняем тип только если ID совпадает И это не стрелка
                  if ($selectedIds.includes(o.id) && o.type !== 'arrow') {
                    return { ...o, type: newType }
                  }
                  return o
                })
              )
            }}
          >
            <option value="sticky">Sticky</option>
            <option value="rect">Square</option>
            <option value="circle">Circle</option>
          </select>
        {/if}

        <div class="divider"></div>
        <button on:click={() => sceneActions.deleteSelected()} title="Delete">🗑️</button>
      </div>
    {/if}
  {/if}
</div>

<style>
  canvas {
    display: block;
    width: 100vw;
    height: 100vh;
    background: #fbfbfb;
  }

  .canvas-container {
    position: relative;
    width: 100vw;
    height: 100vh;
  }

  .object-popup {
    position: absolute;
    display: flex;
    gap: 8px;
    padding: 6px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    pointer-events: all;
    z-index: 100;
  }
  .object-popup select {
    border: none;
    background: #f0f0f0;
    border-radius: 4px;
    padding: 2px 4px;
    font-size: 12px;
    cursor: pointer;
  }
  .object-popup select:hover {
    background: #e0e0e0;
  }

  .divider {
    width: 1px;
    height: 20px;
    background: #eee;
    margin: 0 4px;
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
