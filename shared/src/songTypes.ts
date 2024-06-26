import { Polygon } from "./coordinates.js";
import { SongName } from "./songNames.js";

export type SongTags = {
  modAsh: boolean;
  modEd: boolean;
};

export type Song = {
  name: SongName;
  audioUrl: string;
  wikiUrl: string;
  description: readonly string[];
  duration: number;
  location: Polygon;
  tags: SongTags;
  difficulty: "easy" | "normal" | "hard" | "extreme";
};
