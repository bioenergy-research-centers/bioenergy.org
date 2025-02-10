const messages = require("../controllers/message.controller.js");
const express = require('express');
const router = express.Router();

// POST /api/messages -> create message
router.post("/", messages.create);

module.exports = router;