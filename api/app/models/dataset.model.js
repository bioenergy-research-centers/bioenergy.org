module.exports = (sequelize, Sequelize) => {
  const Dataset = sequelize.define("dataset", {
    title: {
      type: Sequelize.STRING
    },
    description: {
      type: Sequelize.STRING
    },
    published: {
      type: Sequelize.BOOLEAN
    }
  });

  return Dataset;
};