<script lang="ts">
  import Whiteboard from './components/Whiteboard.svelte'
  import Toolbar from './components/Toolbar.svelte'
  import ZoomControl from './components/ZoomControl.svelte'
  import type { ShapeType, Tool } from './types'

  let activeTool: Tool = 'select'
  let previousTool: Tool = 'select'
  let activeShape: ShapeType = 'sticky'

  const MIN_ZOOM = 0.5
  const MAX_ZOOM = 5.5

  function handleKeyDown(e: KeyboardEvent): void {
    if (e.code === 'Space' && activeTool !== 'hand' && e.target === document.body) {
      previousTool = activeTool
      activeTool = 'hand'
    }
    if (e.key.toLowerCase() === 'v') activeTool = 'select'
    if (e.key.toLowerCase() === 's') activeTool = 'shape'
    if (e.key.toLowerCase() === 'e') activeTool = 'eraser'
    if (e.key.toLowerCase() === 'h') activeTool = 'hand'
    if (e.key.toLowerCase() === 'a') activeTool = 'arrow'
  }

  function handleKeyUp(e: KeyboardEvent): void {
    if (e.code === 'Space' && activeTool === 'hand') {
      activeTool = previousTool
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp} />

<main>
  <!-- передаем активный инструмент в оба компонента -->
  <Whiteboard bind:activeTool bind:activeShape {MAX_ZOOM} {MIN_ZOOM} />
  <Toolbar bind:activeTool bind:activeShape />
  <ZoomControl {MAX_ZOOM} {MIN_ZOOM} />
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
</style>
