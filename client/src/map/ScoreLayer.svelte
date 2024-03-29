<script lang="ts">
  import L, { LatLngBounds } from "leaflet";
  import { songs } from "tunescape07-data";
  import { greenIcon } from "../lib/icons";
  import type { State } from "../lib/clientState";
  import { onMount } from "svelte";
  import { convertLeaflet } from "../lib/convertLeaflet";

  export let state: State[
    | "SinglePlayer_RevealingAnswer"
    | "SinglePlayer_EndOfRound"
    | "SinglePlayer_EndOfFinalRound"];
  export let map: L.Map;

  onMount(() => {
    const { song, guess, closest, score } = state.data.result;
    const layer = new L.LayerGroup();
    layer.addTo(map);

    const guessLatLng = convertLeaflet.coordinate.to(guess);
    const closestLatLng = convertLeaflet.coordinate.to(closest);

    const guessMarker = new L.Marker(guessLatLng);
    guessMarker.addTo(layer);

    const lineToClosest = new L.Polyline([guessLatLng, closestLatLng]);

    const answerPolygons = songs[song].locations.map((poly) => {
      const leafletPoly = convertLeaflet.polygon.to(poly);
      leafletPoly.setStyle({
        color: "#00FF00",
        fillColor: "#00FF00",
        fillOpacity: 0.3,
        opacity: 0.6,
      });
      return leafletPoly;
    });

    const durationMs = 3500 - score / 2;
    map.setView(guessLatLng, 5, { animate: true });

    setTimeout(() => {
      map.flyTo(convertLeaflet.coordinate.to(closest), 3, {
        animate: true,
        duration: durationMs / 1000,
      });
    }, 750);

    setTimeout(() => {
      answerPolygons.forEach((poly) => poly.addTo(layer));
      const answerMarkers =
        answerPolygons.map(
          (polygon) => new L.Marker(polygon.getCenter(), { icon: greenIcon })
        ) ?? null;
      answerMarkers.forEach((marker) => marker.addTo(layer));
      lineToClosest.addTo(layer);
    }, durationMs + 1000);

    setTimeout(() => {
      const bounds = answerPolygons.reduce(
        (acc, elem) => acc.extend(elem.getBounds()),
        new LatLngBounds(guessMarker.getLatLng(), guessMarker.getLatLng())
      );
      map.fitBounds(bounds, { animate: true, padding: [100, 100] });
    }, durationMs + 1500);

    return () => {
      layer.remove();
    };
  });
</script>
