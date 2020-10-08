const db = require("../models");

module.exports = (sequelize, Sequelize) => {
    const questionCategories = sequelize.define("questionCategories", {
        category_id: {
            type: Sequelize.UUID,
            autoIncrement: false
        },
        question_id: {
            type: Sequelize.UUID,
            autoIncrement: false
        }
    }, {
        underscored: true,
        timestamps: false,
    });
    return questionCategories;
};