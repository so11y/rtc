const express = require("express");
const path = require("path");
const { WebSocketServer } = require("ws");
const fs = require("fs");
const app = express();

const webSocket = new WebSocketServer({
  noServer: true,
});

function send(ws, data) {
  return ws.send(JSON.stringify(data));
}

const states = {
  create: {
    ws: null,
    offer: null,
    data: null,
    remoteDescription: null,
    candidate: [],
  },
  join: {
    ws: null,
    offer: null,
    data: null,
    candidate: [],
  },
};

webSocket.on("connection", (ws) => {
  ws.on("message", (message) => {
    message = JSON.parse(message);
    const { type, id, name } = message;
    if (type === "offer") {
      states.create.offer = message.description;
      states.create.ws = ws;
    } else if (type === "remoteDescription") {
      states.create.remoteDescription = id;
    } else if (type === "join") {
      send(ws, {
        type: "eat",
        id,
        data: states.create.offer,
      });
    } else if (type === "localDescription") {
      send(states.create.ws, {
        type: "eat",
        id: states.create.remoteDescription,
        data: message.description,
      });
    } else if (type === "candidate") {
      const current = states[name];
      current.candidate.push(message.candidate);
    } else if (type === "remoteCandidate") {
      webSocket.clients.forEach((currentWs) => {
        if (currentWs !== ws) {
          send(currentWs, {
            type: "remoteCandidate",
          });
        }
      });
    } else if (type === "localCandidate") {
      webSocket.clients.forEach((currentWs) => {
        if (currentWs !== ws) {
          send(currentWs, {
            type: "localCandidate",
            ices: message.ices,
          });
        }
      });
    }

    if (message.pass) {
      send(ws, {
        type: "eat",
        id,
      });
    }
  });
});
app.use(express.static(path.join(__dirname, "static")));

app.get("/", (req, res) => {
  return res.sendDate("./index.html");
});

const port = 3008; //process.env.PORT || 3008;

const server = app.listen(port, () => {
  console.log(`http://localhost:${port}`);
  console.log(`Server started on port ${port}`);
});

server.on("upgrade", (req, socket, head) => {
  webSocket.handleUpgrade(req, socket, head, (ws) => {
    webSocket.emit("connection", ws, req);
  });
});
