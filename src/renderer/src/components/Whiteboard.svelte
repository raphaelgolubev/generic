<script lang="ts">
  import { onMount } from 'svelte'
  import type { Tool, SceneObject, ShapeType } from '../types'
  import { drawObject } from '../shapes'

  export let activeTool: Tool
  export let activeShape: ShapeType
  export let scale: number
  export let offsetX: number
  export let offsetY: number
  export let MAX_ZOOM: number
  export let MIN_ZOOM: number

  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D

  // состояние камеры
  let isPanning = false
  let isSpacePressed = false // для режима "руки" через пробел
  let draggedObj: SceneObject | null = null

  // objects
  let objects: SceneObject[] = []
  let selectedId: string | null = null
  let isResizing = false

  const GRID_SIZE = 30

  // вспомогательная функция для перевода экранных координат в мировые
  function screenToWorld(clientX: number, clientY: number): { x: number; y: number } {
    return {
      x: (clientX - offsetX) / scale,
      y: (clientY - offsetY) / scale
    }
  }

  function snapToGrid(value: number): number {
    return Math.round(value / GRID_SIZE) * GRID_SIZE
  }

  function handleWheel(e: WheelEvent): void {
    e.preventDefault()

    if (e.ctrlKey) {
      // Pinch-to-zoom
      const zoomSpeed = 0.01
      const delta = -e.deltaY
      const oldScale = scale
      const newScale = Math.min(Math.max(MIN_ZOOM, scale + delta * zoomSpeed), MAX_ZOOM)
      const mouseX = e.clientX
      const mouseY = e.clientY

      offsetX = mouseX - (mouseX - offsetX) * (newScale / oldScale)
      offsetY = mouseY - (mouseY - offsetY) * (newScale / oldScale)
      scale = newScale
    } else {
      // скролл тачпадом или колесиком
      offsetX -= e.deltaX
      offsetY -= e.deltaY
    }
  }

  function handleMouseDown(e: MouseEvent): void {
    // получаем реальные координаты на доске
    const { x, y } = screenToWorld(e.clientX, e.clientY)

    // проверка ресайза если объект уже выбран
    if (selectedId) {
      const obj = objects.find((o) => o.id === selectedId)
      if (obj) {
        const handleSize = 10 / scale
        // Проверяем попадание в правый нижний угол
        if (
          x >= obj.x + obj.width - handleSize &&
          x <= obj.x + obj.width + handleSize &&
          y >= obj.y + obj.height - handleSize &&
          y <= obj.y + obj.height + handleSize
        ) {
          isResizing = true

          obj.preciseWidth = obj.width
          obj.preciseHeight = obj.height
          return
        }
      }
    }

    // сначала проверяем режим панорамирования
    if (activeTool === 'hand' || e.button === 1) {
      isPanning = true
      return
    }

    // аыбор объекта
    const hit = [...objects]
      .reverse()
      .find((obj) => x >= obj.x && x <= obj.x + obj.width && y >= obj.y && y <= obj.y + obj.height)

    if (hit && activeTool === 'select') {
      selectedId = hit.id
      draggedObj = hit

      // сохраняем точные координаты в момент начала движения
      // если их еще нет в объекте, берем текущие
      draggedObj.preciseX = draggedObj.x
      draggedObj.preciseY = draggedObj.y

      return
    }

    // клик по пустому месту
    selectedId = null
    if (activeTool === 'select') isPanning = true

    // создание нового объекта
    if (activeTool === 'shape') {
      const newObj: SceneObject = {
        id: Date.now().toString(),
        type: activeShape,
        x: snapToGrid(x - 50),
        y: snapToGrid(y - 50),
        width: 100,
        height: 100,
        color: activeShape === 'sticky' ? '#fff7d1' : '#e0e0e0',
        text: 'Текст',
        isSelected: false,
        preciseX: 0,
        preciseY: 0,
        preciseWidth: 0,
        preciseHeight: 0
      }
      objects = [...objects, newObj]
      selectedId = newObj.id
      activeTool = 'select'
    }
  }

  function handleMouseMove(e: MouseEvent): void {
    if (isResizing && selectedId) {
      const obj = objects.find((o) => o.id === selectedId)
      if (obj) {
        // накапливаем точное изменение размера
        obj.preciseWidth += e.movementX / scale
        obj.preciseHeight += e.movementX / scale

        // привязываем к сетке
        obj.width = Math.max(GRID_SIZE, snapToGrid(obj.preciseWidth))
        obj.height = Math.max(GRID_SIZE, snapToGrid(obj.preciseHeight))

        objects = [...objects] // обновляем состояние
      }
      return
    }

    if (draggedObj) {
      const s = draggedObj

      // накапливаем точное движение мыши
      s.preciseX += e.movementX / scale
      s.preciseY += e.movementY / scale

      // обновляем видимые координаты с привязкой к сетке
      // теперь объект прыгнет только когда мышь пройдет порог сетки
      draggedObj.x = snapToGrid(s.preciseX)
      draggedObj.y = snapToGrid(s.preciseY)

      objects = [...objects] // триггер обновления в Svelte
    } else if (isPanning) {
      offsetX += e.movementX
      offsetY += e.movementY
    }
  }

  function handleMouseUp(): void {
    isPanning = false
    isResizing = false
    draggedObj = null
    canvas.style.cursor = isSpacePressed || activeTool === 'hand' ? 'grab' : 'crosshair'
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

  function drawSelection(obj: SceneObject): void {
    ctx.strokeStyle = '#18a0fb'
    ctx.lineWidth = 2 / scale
    ctx.strokeRect(obj.x, obj.y, obj.width, obj.height)

    const handleSize = 8 / scale
    ctx.fillStyle = 'white'
    ctx.fillRect(
      obj.x + obj.width - handleSize / 2,
      obj.y + obj.height - handleSize / 2,
      handleSize,
      handleSize
    )
    ctx.strokeRect(
      obj.x + obj.width - handleSize / 2,
      obj.y + obj.height - handleSize / 2,
      handleSize,
      handleSize
    )
  }

  function draw(): void {
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    // сбрасываем к DPR, а не к единице, чтобы сохранить четкость
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.translate(offsetX, offsetY)
    ctx.scale(scale, scale)

    drawGrid()

    // отрисовка всех объектов из массива
    objects.forEach((obj) => {
      const isSelected = obj.id === selectedId
      drawObject(ctx, obj, isSelected, scale)
    })

    // отрисовка рамок и ручек ресайза (только для выбранного)
    const selectedObj = objects.find((o) => o.id === selectedId)
    if (selectedObj) {
      drawSelection(selectedObj)
    }

    requestAnimationFrame(draw)
  }

  function drawGrid(): void {
    ctx.fillStyle = '#e0e0e0'
    const dotSize = 2 / scale
    const left = -offsetX / scale
    const top = -offsetY / scale
    const right = left + canvas.width / scale
    const bottom = top + canvas.height / scale

    for (let x = Math.floor(left / GRID_SIZE) * GRID_SIZE; x < right; x += GRID_SIZE) {
      for (let y = Math.floor(top / GRID_SIZE) * GRID_SIZE; y < bottom; y += GRID_SIZE) {
        ctx.beginPath()
        ctx.arc(x, y, dotSize, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  function deleteObject(id: string): void {
    objects = objects.filter((o) => o.id !== id)
    selectedId = null
  }

  // -----EDITING TEXT

  let editingId: string | null = null
  let editX = 0
  let editY = 0
  let editW = 0
  let editH = 0
  let textareaRef: HTMLTextAreaElement

  function startEditing(obj: SceneObject): void {
    editingId = obj.id
    // Фиксируем координаты на момент начала редактирования
    editX = obj.x
    editY = obj.y
    editW = obj.width
    editH = obj.height

    // Фокусируемся на textarea после того, как Svelte его отрисует
    setTimeout(() => textareaRef?.focus(), 0)
  }

  function stopEditing(): void {
    editingId = null
  }

  function handleDblClick(e: MouseEvent): void {
    const { x, y } = screenToWorld(e.clientX, e.clientY)

    // Ищем, по какому объекту кликнули
    const hit = [...objects]
      .reverse()
      .find((obj) => x >= obj.x && x <= obj.x + obj.width && y >= obj.y && y <= obj.y + obj.height)

    if (hit) {
      startEditing(hit)
    }
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
    draw()
  })
</script>

<!-- добавляем слушатели на окно для клавиатуры -->
<svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp} />

<div class="canvas-container">
  <canvas
    bind:this={canvas}
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    on:mouseleave={handleMouseUp}
    on:wheel|preventDefault={handleWheel}
    on:dblclick={handleDblClick}
  ></canvas>

  {#if editingId}
    {@const obj = objects.find((o) => o.id === editingId)}
    {#if obj}
      <div
        class="floating-editor"
        style="
        left: {obj.x * scale + offsetX}px; 
        top: {(obj.y + obj.height) * scale + offsetY + 10}px; 
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

  {#if selectedId}
    {@const obj = objects.find((o) => o.id === selectedId)}
    {#if obj}
      <div
        class="object-popup"
        style="
          left: {obj.x * scale + offsetX}px; 
          top: {obj.y * scale + offsetY - 50}px;
          transform: scale({scale < 0.5 ? 0.8 : 1});
        "
      >
        <input type="color" bind:value={obj.color} />
        <button on:click={() => deleteObject(obj.id)}>🗑️</button>
        <select bind:value={obj.type}>
          <option value="sticky">Sticky</option>
          <option value="rect">Square</option>
        </select>
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
    /* Центрируем относительно объекта по горизонтали, если нужно */
    transform: translateX(0);
  }

  .floating-editor textarea {
    width: 240px;
    height: 120px;
    padding: 12px;
    background: white;
    border: 2px solid #18a0fb; /* Цвет Figma */
    border-radius: 8px;
    outline: none;
    resize: vertical; /* Разрешаем менять высоту только вручную */
    font-family: sans-serif;
    font-size: 14px;
    line-height: 1.4;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }

  /* Маленький треугольник-указатель сверху */
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
