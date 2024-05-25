<script lang="ts">
  import { onMount } from "svelte";
  import { type ActiveState } from "../../lib/clientState";
  import HealthLeaderboard from "./HealthLeaderboard.svelte";
  import LargeAvatarDamage from "./LargeAvatarDamage.svelte";
  import WikiDisplay from "./WikiDisplay.svelte";
  import Button from "../shared/Button.svelte";

  export let state: ActiveState<"RoundOver">;
  $: owner = state.data.me.avatar.name === state.data.game.owner;

  let render = false;
  let alive = state.data.me.type === "user";
  let showAll: boolean = !alive;

  $: remainingUsers = Object.values(state.data.users).filter(
    (user) => user.health > 0
  ).length;
  $: gameOver =
    (!state.data.game.singlePlayer && remainingUsers <= 1) ||
    remainingUsers === 0;

  onMount(() => {
    const timeout = setTimeout(() => {
      render = true;
    }, 600);
    return () => clearTimeout(timeout);
  });

  let largeAvatar: string | undefined = alive
    ? state.data.me.avatar.name
    : undefined;
  function clickedAvatar(ev: CustomEvent<{ name: string }>) {
    largeAvatar = ev.detail.name;
  }

  function nextRound() {
    state.send({ action: "nextRound" });
  }
</script>

{#if render}
  <WikiDisplay {state} />

  {#if largeAvatar}
    {#key largeAvatar}
      <LargeAvatarDamage
        {state}
        user={largeAvatar}
        on:animationDone={() => {
          largeAvatar = undefined;
          showAll = true;
        }}
      />
    {/key}
  {/if}

  {#if showAll}
    <HealthLeaderboard {state} on:clickAvatar={clickedAvatar} />
  {/if}

  {#if owner}
    {#if gameOver}
      <Button style="grid-column: 2; grid-row: 4;" on:click={nextRound}
        >Show&nbsp;Results</Button
      >
    {:else}
      <Button style="grid-column: 2; grid-row: 4;" on:click={nextRound}
        >Next&nbsp;Round</Button
      >
    {/if}
  {/if}
{/if}