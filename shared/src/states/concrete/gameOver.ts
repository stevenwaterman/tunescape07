import { Avatar } from "../../avatars.js";
import { mapValues, pick } from "../../util.js";
import { StateStore } from "../store/store.js";
import { ClientActions, Transport } from "../store/transport.js";
import { Lobby } from "./lobby.js";
import { BaseState } from "../baseState.js";
import { AbstractCfg, abstractKeys } from "../config.js";

type Cfg = AbstractCfg<"postLobby">;
const keys = abstractKeys.postLobby();

export class GameOver extends BaseState<
  GameOver,
  "GameOver",
  Cfg,
  typeof keys
> {
  constructor(store: StateStore, data: GameOver["data"]) {
    if (data.game.type === "public") {
      setTimeout(() => {
        if (store.state?.name === "GameOver") {
          store.state.playAgain();
        }
      }, 10_000);
    }

    super({
      name: "GameOver",
      store,
      data,
      keys,
    });
  }

  public playAgain() {
    this.store.state = new Lobby(this.store, {
      game: {
        ...pick(this.game, "id", "owner", "type", "difficulty"),
        firstUserJoined: undefined,
        timerStarted: undefined,
        timerDuration: undefined,
        timerId: undefined,
      },
      users: {},
      spectators: {
        ...this.spectators,
        ...mapValues(this.users, (user) => ({
          avatar: user.avatar,
          transport: user.transport,
          spectator: true,
        })),
      },
    });
  }

  public onMessage(userName: string, message: ClientActions): void {
    if (userName === this.game.owner && message.action === "playAgain") {
      this.playAgain();
    }
  }

  public recreate(data: GameOver["data"]) {
    return new GameOver(this.store, data);
  }

  public createSpectator(
    avatar: Avatar,
    transport: Transport
  ): GameOver["spectators"][string] {
    return { avatar, transport, roundHistory: {} };
  }
}
