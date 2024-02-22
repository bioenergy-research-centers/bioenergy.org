const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config( {path: ['.env','../.env'] } );

const app = express();

var corsOptions = {
  origin: "http://localhost:8081"
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


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
