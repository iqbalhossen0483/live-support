const { wss } = require("../../app");
const { QueryDocument } = require("../../config/database");
const { init, broadcastMessage, unreadMessageHandler } = require("./services");
require("../../config/config");

const users = new Map();

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    try {
      const parsed = JSON.parse(message.toString());

      switch (parsed.type) {
        case "init":
          init(users, parsed, ws);
          break;
        case "message":
          broadcastMessage(users, parsed, ws);
          break;
        case "unread_messages":
          unreadMessageHandler(users, parsed);
        default:
          break;
      }
    } catch (error) {
      console.log(error);
    }
  });

  ws.on("close", async () => {
    try {
      if (ws.isAdmin && ws.adminId && users.has(ws.adminId)) {
        users.delete(ws.adminId);
        // save user online status
        const updateQuery = `UPDATE live_support_online_users SET is_online = false WHERE user_id = ${ws.adminId}`;
        await QueryDocument(updateQuery);
        console.log(`Admin disconnected: ${ws.adminId}`);
      } else if (ws.userId && users.has(ws.userId)) {
        users.delete(ws.userId);
        // save user online status
        const updateQuery = `UPDATE live_support_online_users SET is_online = false WHERE user_id = ${ws.userId}`;
        await QueryDocument(updateQuery);
        console.log(`User disconnected: ${ws.userId}`);
      }
    } catch (error) {
      console.log(error);
    }
  });
});
