<script lang="ts">
  import { onDestroy } from "svelte";
  import type { ActiveState } from "../../lib/clientState";
  import { unconfirmedGuessStore } from "../../lib/stores";
  import Buttons from "../shared/Buttons.svelte";
  import Button from "../shared/Button.svelte";

  export let state: ActiveState<"RoundActive">;

  $: canGuess = state.me.type === "user" && state.me.guess === undefined;

  function confirm() {
    const unconfirmedGuess = $unconfirmedGuessStore;
    if (unconfirmedGuess) {
      state.send({ action: "guess", data: $unconfirmedGuessStore! });
    }
  }

  onDestroy(() => {
    unconfirmedGuessStore.set(undefined);
  });
</script>

<Buttons row="4">
  {#if canGuess && $unconfirmedGuessStore}
    <Button on:clicked={confirm}>Guess</Button>
  {/if}

  {#if state.me.type === "spectator"}
    <h2>Spectating</h2>
  {/if}
</Buttons>
