import { Song } from "../../songTypes.js";
import { mapValues, pick, shuffle } from "../../util.js";
import { StateStore } from "../store/store.js";
import { ClientActions, Transport } from "../store/transport.js";
import { GameOver } from "./gameOver.js";
import { RoundActive } from "./roundActive.js";
import { BaseState } from "../baseState.js";
import { AbstractCfg, abstractKeys } from "../config.js";

type Cfg = AbstractCfg<
  "active",
  {
    game: {
      song: Song;
    };
  }
>;
const keys = abstractKeys.active({
  publicGame: ["song"],
} as const);
const a = keys.publicGame;

export class RoundOver extends BaseState<
  RoundOver,
  "RoundOver",
  Cfg,
  typeof keys
> {
  constructor(store: StateStore, data: RoundOver["data"]) {
    super({
      name: "RoundOver",
      store,
      data,
      keys,
    });

    if (data.game.type === "public") {
      setTimeout(() => {
        if (this.store.state instanceof RoundOver) {
          this.store.state.next();
        }
      }, 10_000);
    }
  }

  private next() {
    const newUsers: RoundActive["users"] = {};
    const newSpectators: RoundActive["spectators"] = { ...this.spectators };
    for (const userName in this.users) {
      const user = this.users[userName];
      if (user.health <= 0) {
        newSpectators[userName] = this.convertUserToSpectator(user);
      } else {
        newUsers[userName] = {
          ...pick(user, "name", "transport", "health"),
          guessed: false,
          guess: undefined,
          guessTime: undefined,
        };
      }
    }

    const newUserCount = Object.keys(newUsers).length;

    // If single player has died or only 1 person left alive in multiplayer
    if (
      (this.game.type === "singleplayer" && newUserCount <= 0) ||
      (this.game.type !== "singleplayer" && newUserCount <= 1)
    ) {
      this.store.state = new GameOver(this.store, {
        game: pick(
          this.game,
          "id",
          "owner",
          "type",
          "difficulty",
          "songs",
          "round",
          "roundHistory"
        ),
        users: mapValues(newUsers, user => pick(user, "name", "transport")),
        spectators: newSpectators,
      });
    } else {
      // Handle shuffling songs if you manage to play like 600 rounds
      const round = this.game.round + 1;
      const songIdx = round % this.game.songs.length;
      let songs = this.game.songs;
      if (songIdx === 0) {
        songs = shuffle([...songs]);
      }
      const song = songs[songIdx];
      const maxSongStartFraction = this.difficultyConfig.songRandomStart ? 0.9 : 0;

      this.store.state = new RoundActive(this.store, {
        game: {
          ...pick(
            this.game,
            "id",
            "owner",
            "type",
            "difficulty",
            "roundHistory"
          ),
          songs,
          round,
          songUrl: song.audioUrl,
          songStartFraction: maxSongStartFraction * Math.random(),
          roundStarted: new Date(),
          timerStarted: undefined,
          timerDuration: undefined,
          timerId: undefined,
        },
        users: newUsers,
        spectators: newSpectators,
      });
    }
  }

  public onMessage(userName: string, message: ClientActions): void {
    if (message.action === "nextRound" && this.game.owner === userName) {
      this.next();
    }
  }

  public recreate(data: RoundOver["data"]) {
    return new RoundOver(this.store, data);
  }

  public createSpectator(name: string, transport: Transport) {
    return { name, transport, roundHistory: {} };
  }
}
