<script lang="ts">
  import { fade } from "svelte/transition";
  import { songs } from "tunescape07-data";
  import type { State } from "../lib/clientState";

  export let state: State[
    | "SinglePlayer_EndOfRound"
    | "SinglePlayer_EndOfFinalRound"];

  $: songName = state.data.songs[state.data.round - 1];
  $: song = songs[songName];
</script>

<div class="infoBox" transition:fade|global>
  <a class="title" target="_blank" href={song.wikiUrl}>{song.name}</a>
  <div class="info">
    {#each song.description as line}
      <p>{line}</p>
    {/each}
  </div>
</div>

<style>
  .infoBox {
    background-color: var(--semi-transparent-black);
    width: 20rem;

    grid-column-start: 1;
    grid-column-end: 4;
    grid-row: 1;
    align-self: flex-start;
    justify-self: flex-start;

    display: flex;
    flex-direction: column;
    max-height: 100%;
    overflow-y: hidden;
    pointer-events: initial;
  }

  @media only screen and (max-width: 1000px) {
    .infoBox {
      width: fit-content;
      max-width: 100%;
      grid-column: 1;
      grid-row: 2;
      align-self: center;
      justify-self: center;
    }
  }

  .info {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
    overflow-y: scroll;
    max-height: 100%;
    flex-shrink: 1;
    font-size: 1.25rem;
  }

  .title {
    background-color: rgba(255, 255, 255, 0.1);
    text-align: center;
    display: block;
    font-size: 2.5rem;
    font-weight: bold;
    padding: 0.25rem 1rem;
    color: yellow;
  }
</style>
