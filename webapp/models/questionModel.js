const db = require("../models");

module.exports = (sequelize, Sequelize) => {
  const Question = sequelize.define("question", {
    question_id: {
      type: Sequelize.UUID,
      primaryKey: true,
      autoIncrement: false
    },
    created_timestamp: {
      type: Sequelize.DATE
    },
    updated_timestamp: {
      type: Sequelize.DATE
    },
    user_id: {
      type: Sequelize.UUID
    },
    question_text: {
      type: Sequelize.STRING,
      unique: true
    }
  }, {
    underscored: true,
    timestamps: false,
  });

  return Question;
};