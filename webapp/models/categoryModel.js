const db = require("../models");
const question = db.question;
const answer = db.answer;

module.exports = (sequelize, Sequelize) => {
  const Category = sequelize.define("category", {
    category_id: {
      type: Sequelize.UUID,
      primaryKey: true,
      autoIncrement: false
    },
    category: {
      type: Sequelize.STRING,
      unique: true
    }
  }, {
    underscored: true,
    timestamps: false,
  });
  return Category;
};