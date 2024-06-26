import { toMap, Song, SongName, songNames } from "tunescape07-shared";
import { audioUrls } from "./parsed/audioUrls.js";
import { songLocations } from "./parsed/songLocations.js";
import { wikiPageUrls } from "./parsed/wikiPageUrls.js";
import { songDescriptions } from "./raw/wikiDescriptions.js";
import { songTags } from "./parsed/songTags.js";
import { songDurations } from "./raw/songDurations.js";
import { songDifficulties } from "./raw/songDifficulties.js";

export const songsAtRuntime: Record<SongName, Song> = toMap(
  songNames
    .map((name) => [
      name,
      {
        name,
        audioUrl: audioUrls[name],
        wikiUrl: wikiPageUrls[name],
        description: songDescriptions[name],
        duration: songDurations[name],
        location: songLocations[name],
        tags: songTags[name],
        difficulty: songDifficulties[name],
      },
    ])
);
