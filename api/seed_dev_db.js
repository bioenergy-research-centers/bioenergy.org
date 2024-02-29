const { faker } = require('@faker-js/faker');

require("dotenv").config( {path: ['.env','../.env'] } );

// use sequelize
const db = require("./app/models");
const Dataset = db.datasets;
// TODO: replace/update with migrations
db.sequelize.sync();


// make a function to generate a random dataset
const generateDataset = () => {
  return {
    title: faker.lorem.words(),
    description: faker.lorem.sentence(),
    published: faker.datatype.boolean(),
  };
};
console.log(generateDataset());
// perform a loop 20 times to generate 20 datasets
for (let i = 0; i < 20; i++) {
  Dataset.create(generateDataset());
}