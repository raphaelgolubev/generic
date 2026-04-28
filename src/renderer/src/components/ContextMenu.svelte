<script lang="ts">
  import { sceneActions } from '../store'
  import { fade } from 'svelte/transition'

  export let x: number
  export let y: number
  export let close: () => void
</script>

<div
  class="context-menu"
  role="menu"
  tabindex="-1"
  style="left: {x}px; top: {y}px;"
  transition:fade={{ duration: 100 }}
  on:contextmenu|preventDefault
>
  <button
    role="menuitem"
    on:click={() => {
      sceneActions.moveSelected('front')
      close()
    }}
  >
    На передний план
  </button>
  <button
    role="menuitem"
    on:click={() => {
      sceneActions.moveSelected('back')
      close()
    }}
  >
    На задний план
  </button>
  <hr />
  <button
    role="menuitem"
    class="delete"
    on:click={() => {
      sceneActions.deleteSelected()
      close()
    }}
  >
    Удалить
  </button>
</div>

<style>
  .context-menu {
    position: fixed;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 4px;
    min-width: 160px;
    z-index: 2000;
  }
  button {
    width: 100%;
    text-align: left;
    padding: 8px 12px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 13px;
    border-radius: 4px;
  }
  button:hover {
    background: #f0f0f0;
  }
  button.delete {
    color: #f44336;
  }
  hr {
    border: none;
    border-top: 1px solid #eee;
    margin: 4px 0;
  }
</style>
