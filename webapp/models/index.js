const dbConfig = require("../config/config.js");
const log4js = require('log4js');
	log4js.configure({
	  appenders: { logs: { type: 'file', filename: '/home/centos/webapp/logs/webapp.log' } },
	  categories: { default: { appenders: ['logs'], level: 'info' } }
    });
const logger = log4js.getLogger('logs');

const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: false,

  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.users = require("./userModel.js")(sequelize, Sequelize);
db.question = require("./questionModel.js")(sequelize, Sequelize);
db.answer = require("./answerModel.js")(sequelize, Sequelize);
db.category = require("./categoryModel.js")(sequelize, Sequelize);
db.questionCategories = require("./questionCategories.js")(sequelize, Sequelize);
db.file = require('./fileModel.js')(sequelize, Sequelize);

logger.info('Database tables created!');

db.question.belongsToMany(db.category, { through: db.questionCategories, foreignKey: 'question_id' });
db.category.belongsToMany(db.question, { through: db.questionCategories, foreignKey: 'category_id' });

db.question.hasMany(db.answer);
db.answer.belongsTo(db.question, {
  foreignKey: "question_id"
});

db.question.hasMany(db.file);
db.file.belongsTo(db.question, {
  foreignKey: "question_id"
});

db.answer.hasMany(db.file);
db.file.belongsTo(db.answer, {
  foreignKey: "answer_id"
});

sequelize
  .authenticate()
  .then(function (err) {
    logger.info('Connected to database');
    console.log('Connection has been established successfully.');
  })
  .catch(function (err) {
    logger.fatal(err);
    console.log('Unable to connect to the database:', err);
  });

module.exports = db;

