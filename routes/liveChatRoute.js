const express = require("express");
const { QueryDocument } = require("../config/database");
const router = express.Router();

router.get("/online-users", async (req, res) => {
  try {
    const isOnline = req.query.isOnline || true;
    const onlineUserQuery = `SELECT * FROM live_support_online_users WHERE is_online = ${isOnline}`;
    const users = await QueryDocument(onlineUserQuery);

    res.send({ status: "success", data: users });
  } catch (error) {
    throw error;
  }
});

router.get("/conversations", async (_req, res) => {
  try {
    const { page = 1, limit = 30, status, user_id } = _req.query;

    let conversationsQuery =
      "SELECT users.name AS user_name, users.profile_image AS user_image, admin.name AS admin_name, admin.profile_image AS admin_image, online_users.is_online AS user_online, lsm.* FROM live_support_message_request AS lsm INNER JOIN users ON users.id = lsm.user_id LEFT JOIN users AS admin ON admin.id = lsm.admin_id LEFT JOIN live_support_online_users AS online_users ON online_users.user_id = lsm.user_id";

    if (status && user_id) {
      conversationsQuery += ` WHERE lsm.status = '${status}' AND lsm.user_id = ${user_id}`;
    } else if (status && !user_id) {
      conversationsQuery += ` WHERE lsm.status = '${status}'`;
    } else if (!status && user_id) {
      conversationsQuery += ` WHERE lsm.user_id = ${user_id}`;
    }

    conversationsQuery += ` LIMIT ${limit} OFFSET ${(page - 1) * limit}`;

    const conversations = await QueryDocument(conversationsQuery);

    //count total document
    const totalQuery =
      "SELECT COUNT(*) AS total FROM live_support_message_request";
    const total = await QueryDocument(totalQuery);
    const totalPage = Math.ceil(total[0].total / limit);

    res.send({ status: "success", totalPage, data: conversations });
  } catch (error) {
    throw error;
  }
});

router.get("/conversations/:id", async (req, res) => {
  try {
    const id = req.params.id;
    let conversationsQuery = `SELECT * from live_support_message_request WHERE id = ${id}`;
    const conversations = await QueryDocument(conversationsQuery);
    let messages = [];
    if (conversations.length > 0) {
      const messageQuery = `SELECT * from live_support_conversations WHERE conversation_id = ${conversations[0].id} ORDER BY created_at ASC`;
      messages = await QueryDocument(messageQuery);
    }
    const data = {
      ...conversations[0],
      messages: messages,
    };
    res.send({ status: "success", data: data });
  } catch (error) {
    throw error;
  }
});
router.get("/conversation_by_user_id/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    let conversationsQuery = `SELECT * from live_support_message_request WHERE user_id = ${userId} AND status != 'closed' ORDER BY created_at DESC LIMIT 1`;
    const conversations = await QueryDocument(conversationsQuery);
    let messages = [];
    if (conversations.length > 0) {
      const messageQuery = `SELECT * from live_support_conversations WHERE conversation_id = ${conversations[0].id} ORDER BY created_at ASC`;
      messages = await QueryDocument(messageQuery);
    }
    const data = {
      ...conversations[0],
      messages: messages,
    };
    res.send({ status: "success", data: data });
  } catch (error) {
    throw error;
  }
});

module.exports = router;
