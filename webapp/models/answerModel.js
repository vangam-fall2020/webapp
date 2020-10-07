const db = require("../models");

module.exports = (sequelize, Sequelize) => {
  const Answer = sequelize.define("answer", {
    answer_id: {
      type: Sequelize.UUID,
      primaryKey: true,
      autoIncrement: false,
      defaultValue: Sequelize.UUIDV4
    },
    created_timestamp: {
      type: Sequelize.DATE
    },
    updated_timestamp: {
      type: Sequelize.DATE
    },
    user_id: {
      type: Sequelize.UUID,
    },
    answer_text: {
      type: Sequelize.STRING
    }
  }, {
    underscored: true,
    timestamps: false,
  });
  return Answer;
};