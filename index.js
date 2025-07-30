const { config } = require("./config/config");
const express = require("express");
const cors = require("cors");
const { app, server, wss } = require("./app");
require("./config/database");
require("./controller/ws/index");

// middleware
app.use(express.static("public"));
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    allowedHeaders: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// api prefix
const apiPrefix = config.api_prefix;
const wsPrefix = config.ws_prefix;
console.log("API Prefix:", apiPrefix);
console.log("WS Prefix:", wsPrefix);

// routes
app.use(apiPrefix, require("./routes/index"));

app.get("/", (_req, res) => {
  res.send("Server is running");
});

// ws route
server.on("upgrade", (request, socket, head) => {
  const { pathname } = new URL(request.url, `http://${request.headers.host}`);
  console.log({ pathname, wsPrefix, isquery: pathname === wsPrefix });
  if (pathname === wsPrefix) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

// error handler
app.use((error, _req, res, _next) => {
  if (config.node_env === "development") {
    console.log(error);
  } else {
    console.log(error.message);
  }

  res.status(error.status || 500).send({
    success: false,
    message: error.message,
  });
});

const port = config.port;
server.listen(port, () => {
  console.log("=".repeat(50));
  console.info(`Server is running on http://localhost:${port}`);
  console.info(`WebSocket available at ws://localhost:${port}${wsPrefix}`);
  console.log("=".repeat(50));
});
