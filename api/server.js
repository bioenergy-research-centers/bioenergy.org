const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
require("dotenv").config( {path: ['.env','../.env'] } );
const datasetRoutes = require('./app/routes/dataset.routes');
const messageRoutes = require('./app/routes/message.routes');

const app = express();

var corsOptions = {
  origin: [process.env.BIOENERGY_ORG_CLIENT_URI, "https://api.bioenergy.org", "http://localhost:3000", "http://localhost:8081", "http://localhost:8080", "https://bioenergy.org", "https://www.bioenergy.org"]
};

// Apply global middleware for all routes first
app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// use sequelize
const db = require("./app/models");
// TODO: replace/update with migrations
//db.sequelize.sync();
db.sequelize.sync({ alter: { drop: false } });
// For development
// db.sequelize.sync({ force: true }).then(() => {
//   console.log("Drop and re-sync db.");
// });

// register routes after global middleware
// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to bioenergy.org." });
});

// https://expressjs.com/en/guide/routing.html#express-router
app.use('/api/datasets', datasetRoutes);
app.use('/api/messages', messageRoutes);

// Swagger setup

const options = {
  definition: {
    openapi: "3.1.0",
    info: {
      title: "Bioenergy.org API with Swagger",
      version: "0.1.0",
      description:
        "Available API actions are detailed below.",
      contact: {
        name: "Contact us with any questions or suggestions",
        url: "https://bioenergy.org/contact",
      },
    },
    servers: [
      {
        url: process.env.VITE_BIOENERGY_ORG_API_URI,
      },
    ],
  },
  apis: ["./app/routes/*.js"],
};

const specs = swaggerJsdoc(options);
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, { explorer: true })
);

// set port, listen for requests
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
