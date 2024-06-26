import { writable, type Readable, type Writable } from "svelte/store";
import {
  getDifficultyConfig,
  type DifficultyConfig,
  StateInterface,
} from "tunescape07-shared";
import { songs } from "tunescape07-data";
import { HeartbeatWebSocket } from "./HeartbeatWebSocket";

let transportSingleton: StateInterface.Transport | undefined = undefined;
function closeOldTransport() {
  transportSingleton?.close(1000);
  transportSingleton = undefined;
}

function connectToPrivateGame(gameId: string): StateInterface.Transport {
  const prod = document.location.host.includes("tunescape07");
  const transport = prod
    ? new HeartbeatWebSocket(`wss://api.tunescape07.com/join?game=${gameId}`)
    : new HeartbeatWebSocket(`ws://localhost:4433/join?game=${gameId}`);
  listenToTransport(transport);
  return transport;
}

function connectToPublicGame(): StateInterface.Transport {
  const prod = document.location.host.includes("tunescape07");
  const transport = prod
    ? new HeartbeatWebSocket(`wss://api.tunescape07.com/public`)
    : new HeartbeatWebSocket(`ws://localhost:4433/public`);
  listenToTransport(transport);
  return transport;
}

function connectToLocalServer(): StateInterface.Transport {
  let clientMessageListeners: Array<
    (ev: StateInterface.TransportMessage) => void
  > = [];
  let serverMessageListeners: Array<
    (ev: StateInterface.TransportMessage) => void
  > = [];

  let clientCloseListeners: Array<(ev: StateInterface.TransportClose) => void> =
    [];
  let serverCloseListeners: Array<(ev: StateInterface.TransportClose) => void> =
    [];

  let open = true;

  const clientSide: StateInterface.Transport = {
    send: (msg: string): void => {
      serverMessageListeners.forEach((listener) => listener({ data: msg }));
    },
    close: (code: number) => {
      if (open) {
        open = false;
        clientCloseListeners.forEach((listener) => listener({ code }));
        serverCloseListeners.forEach((listener) => listener({ code }));
      }
    },
    addEventListener: (
      type: "message" | "close",
      cb:
        | ((ev: StateInterface.TransportMessage) => void)
        | ((ev: StateInterface.TransportClose) => void)
    ): void => {
      if (type === "message") {
        clientMessageListeners.push(cb as any);
      } else {
        clientCloseListeners.push(cb as any);
      }
    },
    removeEventListener: (
      type: "message" | "close",
      cb:
        | ((ev: StateInterface.TransportMessage) => void)
        | ((ev: StateInterface.TransportClose) => void)
    ): void => {
      if (type === "message") {
        clientMessageListeners = clientMessageListeners.filter(
          (listener) => listener !== cb
        );
      } else {
        clientCloseListeners = clientCloseListeners.filter(
          (listener) => listener !== cb
        );
      }
    },
  };
  listenToTransport(clientSide);

  const serverSide: StateInterface.Transport = {
    send: (msg: string): void => {
      clientMessageListeners.forEach((listener) => listener({ data: msg }));
    },
    close: (code: number) => {
      if (open) {
        open = false;
        serverCloseListeners.forEach((listener) => listener({ code }));
        clientCloseListeners.forEach((listener) => listener({ code }));
      }
    },
    addEventListener: (
      type: "message" | "close",
      cb:
        | ((ev: StateInterface.TransportMessage) => void)
        | ((ev: StateInterface.TransportClose) => void)
    ): void => {
      if (type === "message") {
        serverMessageListeners.push(cb as any);
      } else {
        serverCloseListeners.push(cb as any);
      }
    },
    removeEventListener: (
      type: "message" | "close",
      cb:
        | ((ev: StateInterface.TransportMessage) => void)
        | ((ev: StateInterface.TransportClose) => void)
    ): void => {
      if (type === "message") {
        serverMessageListeners = serverMessageListeners.filter(
          (listener) => listener !== cb
        );
      } else {
        serverCloseListeners = serverCloseListeners.filter(
          (listener) => listener !== cb
        );
      }
    },
  };

  const gameId = "Single Player";
  const store = new StateInterface.StateStore(gameId, Object.values(songs));
  store.state = new StateInterface.Lobby(store, {
    game: {
      id: gameId,
      owner: "None",
      type: "singleplayer",
      difficulty: "normal",
      firstUserJoined: new Date(),
      timerStarted: undefined,
      timerDuration: undefined,
      timerId: undefined,
    },
    users: {},
    spectators: {},
  });
  store.join(serverSide);

  return clientSide;
}

function listenToTransport(transport: StateInterface.Transport) {
  const onCloseHandler = () => {
    // Prevent multiple WS being open at once
    closeOldTransport();
    internalStateStore.set(new InactiveState());
  };

  closeOldTransport();
  transportSingleton = transport;

  const onMessageHandler = (ev: StateInterface.TransportMessage) => {
    const data = ev.data.toString("utf8");
    if (data.startsWith("{")) {
      const message: StateInterface.ServerActions = JSON.parse(data);
      if (message.action === "error") {
        cleanup();
        transport.close(1011);
      }
      if (message.action === "state") {
        internalStateStore.set(new ActiveState(message.data, transport));
      } else if (message.action === "stateDiff") {
        internalStateStore.update((oldState) => {
          if (oldState.isActive) {
            const oldIdx = oldState.stateIndex;
            const newIdx = message.data.stateIndex;
            if (newIdx === oldIdx + 1) {
              const data = StateInterface.applyDiff(
                oldState.data,
                message.data
              );
              return new ActiveState(data, transport);
            }
          }

          const msg: StateInterface.ClientActions = {
            action: "getState",
          };
          transport.send(JSON.stringify(msg));
          return oldState;
        });
      }
    }
  };
  const cleanup = () => {
    transport.removeEventListener("close", onCloseHandler);
    transport.removeEventListener("message", onMessageHandler);
  };
  transport.addEventListener("close", onCloseHandler);
  transport.addEventListener("message", onMessageHandler);
}

export class InactiveState {
  public readonly isActive = false;

  singlePlayer() {
    connectToLocalServer();
  }

  publicMultiplayer() {
    connectToPublicGame();
  }

  privateMultiplayer(gameId: string) {
    connectToPrivateGame(gameId);
  }

  public isAny(..._: string[]): false {
    return false;
  }
}

export class ActiveState<Name extends keyof StateInterface.ServerStates> {
  public readonly isActive = true;

  public get stateName() {
    return this.data.stateName;
  }

  public get stateIndex() {
    return this.data.stateIndex;
  }

  public get serverTime() {
    return this.data.serverTime;
  }

  public get game() {
    return this.data.game;
  }

  public get users() {
    return this.data.users;
  }

  public get spectators() {
    return this.data.spectators;
  }

  public get me() {
    return this.data.me;
  }

  public get myName() {
    return this.me.name;
  }

  public get myLobby() {
    return this.game.owner === this.myName;
  }

  constructor(
    public readonly data: StateInterface.ClientStateData<Name>,
    private readonly transport: StateInterface.Transport
  ) {}

  public get difficultyConfig(): DifficultyConfig {
    return getDifficultyConfig(
      this.game.difficulty,
      this.game.type === "singleplayer"
    );
  }

  disconnect() {
    this.transport.close(1000);
  }

  send(action: StateInterface.ClientActions) {
    this.transport.send(JSON.stringify(action));
  }

  public isAny<Names extends keyof StateInterface.ServerStates>(
    ...names: Names[]
  ): this is ActiveState<Names> {
    return (names as string[]).includes(this.stateName);
  }
}

type ClientState = InactiveState | ActiveState<any>;
const internalStateStore: Writable<ClientState> = writable(new InactiveState());
export const stateStore: Readable<ClientState> = {
  subscribe: internalStateStore.subscribe,
};
