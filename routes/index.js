const express = require("express");
const router = express.Router();

router.use("/live-chat", require("./liveChatRoute"));

module.exports = router;
