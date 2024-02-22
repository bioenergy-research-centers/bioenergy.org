const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
require("dotenv").config( {path: ['.env','../.env'] } );

const app = express();

var corsOptions = {
  origin: ["http://localhost:3000", "http://localhost:8081", "http://localhost:8080", "https://bioenergy.org", "https://www.bioenergy.org"]
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// use sequelize
const db = require("./app/models");
// TODO: replace/update with migrations
db.sequelize.sync();
// For development
// db.sequelize.sync({ force: true }).then(() => {
//   console.log("Drop and re-sync db.");
// });

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to bioenergy.org." });
});

// set port, listen for requests
const PORT = process.env.PORT || 8080;

// import route
require("./app/routes/dataset.routes")(app);
// https://expressjs.com/en/guide/routing.html
// alternate setup option. if we export dataset.routes without passing app or calling app.use
// const datasets = require(./app/routes/dataset.routes)
// app.use('/datasets', datasets)


// Swagger setup

const options = {
  definition: {
    openapi: "3.1.0",
    info: {
      title: "Bioenergy.org API with Swagger",
      version: "0.1.0",
      description:
        "This is a simple CRUD API application made with Express and documented with Swagger",
      contact: {
        name: "Nathan Hillson",
        url: "https://www.bioenergy.org",
        email: "njhillson@lbl.gov",
      },
    },
    servers: [
      {
        url: "http://localhost:8080",
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
