import type * as Party from "partykit/server";

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  teams = {
    1: [],
    2: [],
    3: [],
    4: [],
  };

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(
      `Connected:
  id: ${conn.id}
  room: ${this.room.id}
  url: ${new URL(ctx.request.url).pathname}`
    );
  }

  onMessage(message: string, sender: Party.Connection) {
    const data = JSON.parse(message);
    switch (data.type) {
      case "getTeams":
        this.broadcastToSingleClient(
          JSON.stringify({ type: "teams", teams: this.teams }),
          sender.id
        );
        break;
      case "joinTeam":
        this.teams[data.teamId].push({ id: sender.id, email: data.email });
        this.room.broadcast(
          JSON.stringify({ type: "playerJoined", teams: this.teams })
        );
        break;
      case "leaveTeam":
        this.teams[data.teamId] = this.teams[data.teamId].filter(
          (player: { id: string }) => player.id !== sender.id
        );
        this.room.broadcast(
          JSON.stringify({ type: "playerLeft", teams: this.teams })
        );
        break;
    }
  }

  broadcastToSingleClient = (message: string, clientId: string) => {
    this.room.broadcast(
      message,
      Array.from(this.room.getConnections())
        .filter((c) => c.id !== clientId)
        .map((c) => c.id)
    );
  };
}

Server satisfies Party.Worker;
