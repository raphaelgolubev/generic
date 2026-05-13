<script lang="ts">
  import { mouse } from '../store'
</script>

<div class="panel">
  <div>
    <span>X: {$mouse.mouseX} </span>
    <span>Y: {$mouse.mouseY} </span>
  </div>

  <div>
    <span>wX: {$mouse.worldMouseX.toFixed(1)} </span>
    <span>wY: {$mouse.worldMouseY.toFixed(1)} </span>
  </div>
</div>

<style>
  .panel {
    position: fixed;
    bottom: 24px;
    left: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    border: 1px solid #e0e0e0;
    z-index: 10;
    user-select: none;
    color: black;
    max-width: 30vw;
  }
</style>
