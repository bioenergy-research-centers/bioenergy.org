const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

function createApp() {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.get("/", (req, res) => {
    res.json({ message: "Welcome to bioenergy.org." });
  });

  return app;
}

module.exports = { createApp };
