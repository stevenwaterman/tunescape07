<script lang="ts">
  import { onMount } from "svelte";
  import { type ActiveState } from "../../lib/clientState";
  import HealthLeaderboard from "./HealthLeaderboard.svelte";
  import LargeAvatarDamage from "./LargeAvatarDamage.svelte";
  import WikiDisplay from "./RoundOverWikiDisplay.svelte";
  import Button from "../shared/Button.svelte";

  export let state: ActiveState<"RoundOver">;

  let render = false;
  let alive = state.me.type === "user";
  let showAll: boolean = !alive;

  $: remainingUsers = Object.values(state.users).filter(
    (user) => user.health > 0
  ).length;
  $: gameOver =
    (state.game.type !== "singleplayer" && remainingUsers <= 1) ||
    remainingUsers === 0;

  onMount(() => {
    const timeout = setTimeout(() => {
      render = true;
    }, 600);
    return () => clearTimeout(timeout);
  });

  let largeAvatar: string | undefined = alive ? state.myName : undefined;
  function clickedAvatar(ev: CustomEvent<{ name: string }>) {
    largeAvatar = ev.detail.name;
  }

  function nextRound() {
    state.send({ action: "nextRound" });
  }
</script>

<h1>Round {state.game.round + 1}</h1>

{#if render}
  <WikiDisplay {state} />

  {#if largeAvatar}
    {#key largeAvatar}
      <LargeAvatarDamage
        {state}
        name={largeAvatar}
        on:animationDone={() => {
          largeAvatar = undefined;
          showAll = true;
        }}
      />
    {/key}
  {/if}

  {#if showAll}
    <div
      class:largeAvatarShowing={largeAvatar !== undefined}
      class="leaderboardContainer"
    >
      <HealthLeaderboard {state} on:clickAvatar={clickedAvatar} />
    </div>
  {/if}

  {#if state.myLobby}
    {#if gameOver}
      <Button style="grid-column: 2; grid-row: 4;" on:clicked={nextRound}
        >Show&nbsp;Results</Button
      >
    {:else}
      <Button style="grid-column: 2; grid-row: 4;" on:clicked={nextRound}
        >Next&nbsp;Round</Button
      >
    {/if}
  {/if}
{/if}

<style>
  h1 {
    grid-row: 1;
    grid-column: 2;
    z-index: 1;
  }

  .leaderboardContainer {
    display: contents;
  }

  @media only screen and (max-width: 750px) {
    .leaderboardContainer.largeAvatarShowing {
      display: none;
    }
  }
</style>
