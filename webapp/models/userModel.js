module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define("users", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        autoIncrement: false,
        defaultValue: Sequelize.UUIDV4
      },
      first_name: {
        type: Sequelize.STRING
      },
      last_name: {
        type: Sequelize.STRING
      },
      password: {
        type: Sequelize.STRING
      },
      email_address:{
        type: Sequelize.STRING,
        unique: true
      },
      account_created: {
        type: Sequelize.DATE
      },
      account_updated:{
        type: Sequelize.DATE
      }
      
    }, {
      underscored: true,
      timestamps: false,
    });
  
    return User;
  };