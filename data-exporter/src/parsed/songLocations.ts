import { songPolygons } from "../raw/songPolygons.js";
import { Face, Polygon, SongName, mapValues } from "tunescape07-shared";

function removeDuplicateStartEnd(face: Face): Face {
  const [x1, y1] = face[0];
  const [x2, y2] = face[face.length - 1];
  const duplicate = x1 === x2 && y1 === y2;
  return duplicate ? face.slice(1) : face;
}

export const songLocations: Record<SongName, Polygon> = mapValues(
  songPolygons,
  (poly) => poly.map((face) => removeDuplicateStartEnd(face))
);
