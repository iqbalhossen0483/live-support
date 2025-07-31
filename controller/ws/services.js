const { QueryDocument } = require("../../config/database");

function currentDate() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

async function init(activeUsers, parsedData, ws) {
  try {
    let userId = parsedData.data?.userId || Date.now();
    let adminId = parsedData.data?.adminId || null;
    let conversationId = parsedData.data?.conversationId || null;
    const isAdmin = parsedData.data?.isAdmin || false;

    // remove previous socket for same user
    if (activeUsers.has(userId)) {
      activeUsers.delete(userId);
    }

    //Store userId on the ws instance
    ws.userId = userId;
    ws.adminId = adminId;
    ws.isAdmin = isAdmin;
    ws.conversationId = conversationId;

    if (isAdmin) {
      activeUsers.set(adminId, ws);
    } else {
      activeUsers.set(userId, ws);
    }

    ws.send(
      JSON.stringify({
        type: "init",
        data: { userId, adminId, conversationId },
      })
    );

    // save user online status
    const isExistQuery = `SELECT * FROM live_support_online_users WHERE user_id = ${
      isAdmin ? adminId : userId
    }`;
    const result = await QueryDocument(isExistQuery);

    if (result.length === 0) {
      const insertQuery = `INSERT INTO live_support_online_users (user_id, is_online) VALUES (${
        isAdmin ? adminId : userId
      }, true)`;
      await QueryDocument(insertQuery);
    } else {
      const updateQuery = `UPDATE live_support_online_users SET is_online = true WHERE user_id = ${
        isAdmin ? adminId : userId
      }`;
      await QueryDocument(updateQuery);
    }

    console.log(
      `${isAdmin ? "Admin" : "User"} connected:`,
      isAdmin ? adminId : userId
    );
  } catch (error) {
    console.log(error);
  }
}

async function broadcastMessage(activeUsers, parsedData, ws) {
  try {
    const { message_id, conversation_id, admin_id, user_id } =
      parsedData.data || {};
    const payload = {
      message_id,
      status: "send",
      conversation_id,
      admin_id,
      user_id,
    };

    // get or craeate  conversation or set Admin if not exist
    if (!payload.conversation_id) {
      const addMessageReqQuery = `INSERT INTO live_support_message_request (user_id, status) VALUES (${parsedData.data?.sender_id}, 'waiting')`;
      const result = await QueryDocument(addMessageReqQuery);
      payload.conversation_id = result.insertId;
    } else {
      const getConversationQuery = `SELECT * FROM live_support_message_request WHERE id = ${payload.conversation_id}`;
      const result = await QueryDocument(getConversationQuery);
      payload.conversation_id = result[0]?.id;
      const hasAdmin = result[0]?.admin_id;
      if (hasAdmin) {
        payload.admin_id = hasAdmin;
      }

      if (payload.admin_id && !hasAdmin) {
        const updateConversationQuery = `UPDATE live_support_message_request SET admin_id = ${payload.admin_id} WHERE id = ${payload.conversation_id}`;
        await QueryDocument(updateConversationQuery);
      }
    }

    const addMessageQuery = `INSERT INTO live_support_conversations`;
    const data = {
      message_id: payload.message_id,
      status: payload.status,
      sender_type: parsedData.data?.sender_type,
      sender_id: parsedData.data?.sender_id,
      message_type: parsedData.data?.message_type,
      message: parsedData.data?.message,
      conversation_id: payload.conversation_id,
      created_at: currentDate(),
    };

    await QueryDocument(addMessageQuery, data);

    ws.send(JSON.stringify({ type: "message-update", data: payload }));

    // send message to user or admin
    if (
      data.sender_type === "admin" &&
      payload.user_id &&
      activeUsers.has(payload.user_id)
    ) {
      console.log("send message to user");
      activeUsers
        .get(payload.user_id)
        .send(JSON.stringify({ type: "message", data: data }));
    } else if (
      data.sender_type === "user" &&
      payload.admin_id &&
      activeUsers.has(payload.admin_id)
    ) {
      console.log("send message to admin");
      activeUsers
        .get(payload.admin_id)
        .send(JSON.stringify({ type: "message", data: data }));
    }
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  init,
  broadcastMessage,
};
