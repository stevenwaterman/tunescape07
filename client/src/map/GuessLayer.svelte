<script lang="ts">
  import L from "leaflet";
  import { type State } from "../lib/clientState";
  import { onMount } from "svelte";
  import { convertLeaflet } from "../lib/convertLeaflet";

  export let state: State[
    | "SinglePlayer_NoGuess"
    | "SinglePlayer_UnconfirmedGuess"
    | "SinglePlayer_RevealingAnswer"
    | "SinglePlayer_EndOfRound"
    | "SinglePlayer_EndOfFinalRound"];
  export let map: L.Map;

  $: map.on("click", (click) => {
    if (state.isAny("SinglePlayer_NoGuess", "SinglePlayer_UnconfirmedGuess")) {
      const coord = convertLeaflet.coordinate.from(click.latlng);
      state.placeGuess(coord);
    }
  });

  let marker: L.Marker = new L.Marker(new L.LatLng(0, 0));

  function getGuess(
    state: State[
      | "SinglePlayer_NoGuess"
      | "SinglePlayer_UnconfirmedGuess"
      | "SinglePlayer_RevealingAnswer"
      | "SinglePlayer_EndOfRound"
      | "SinglePlayer_EndOfFinalRound"]
  ) {
    if (state.name === "SinglePlayer_NoGuess") {
      return null;
    } else if (state.name === "SinglePlayer_UnconfirmedGuess") {
      return state.data.guess;
    } else {
      return state.data.result.guess;
    }
  }

  $: guess = getGuess(state);
  $: if (guess) {
    marker.setLatLng(convertLeaflet.coordinate.to(guess));
    marker.setOpacity(1);
  } else {
    marker.setOpacity(0);
  }

  onMount(() => {
    marker.addTo(map);

    return () => {
      marker.remove();
    };
  });
</script>
