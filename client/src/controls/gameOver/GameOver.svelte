<script lang="ts">
  import { scale } from "svelte/transition";
  import { type ActiveState } from "../../lib/clientState";
  import Button from "../shared/Button.svelte";

  export let state: ActiveState<"GameOver">;

  function playAgain() {
    state.send({ action: "playAgain" });
  }
</script>

<div class="container">
  <p class="title">Game Over</p>
  <p class="title">Survived {state.data.game.round - 1} rounds</p>
  <!-- TODO starting health, scores, guess times -->
  {#if state.data.game.owner === state.data.me.avatar.name}
    <Button on:click={() => playAgain()}>Play Again</Button>
  {/if}
  <Button on:click={() => state.disconnect()}>Main Menu</Button>
</div>

<style>
  .container {
    grid-column-start: 1;
    grid-column-end: 4;
    grid-row-start: 1;
    grid-row-end: 4;
    font-size: 2rem;
    background-color: var(--semi-transparent-black);
    justify-self: center;
    align-self: center;
    padding: 2rem;
    border-radius: 0.5em;
    pointer-events: initial;
  }
</style>