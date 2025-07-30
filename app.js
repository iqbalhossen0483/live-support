const express = require("express");
const http = require("http");
const websocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new websocket.Server({ noServer: true });

module.exports = { server, wss, app };
