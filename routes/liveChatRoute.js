const express = require("express");
const { QueryDocument } = require("../config/database");
const router = express.Router();

router.get("/online-users", async (req, res) => {
  try {
    const isOnline = req.query.isOnline || true;
    const onlineUserQuery = `SELECT * FROM live_support_online_users WHERE is_online = ${isOnline}`;
    const users = await QueryDocument(onlineUserQuery);

    res.send(users);
  } catch (error) {
    throw error;
  }
});

router.get("/conversations", async (_req, res) => {
  try {
    const conversationsQuery = `SELECT * from live_support_message_request`;
    const conversations = await QueryDocument(conversationsQuery);
    res.send(conversations);
  } catch (error) {
    throw error;
  }
});

router.get("/conversations/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const conversationsQuery = `SELECT * from live_support_message_request WHERE id = ${id}`;
    const conversations = await QueryDocument(conversationsQuery);
    const messageQuery = `SELECT * from live_support_conversations WHERE conversation_id = ${id}`;
    const messages = await QueryDocument(messageQuery);
    const data = {
      ...conversations[0],
      messages: messages,
    };
    res.send(data);
  } catch (error) {
    throw error;
  }
});

module.exports = router;
