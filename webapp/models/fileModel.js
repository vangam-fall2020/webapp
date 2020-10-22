module.exports = (sequelize, Sequelize) => {
    const File = sequelize.define("file", {
        file_name: {
            type: Sequelize.STRING,
            unique: true
        },
        s3_object_name: {
            type: Sequelize.STRING
        },
        file_id: {
            type: Sequelize.UUID,
            primaryKey: true,
            autoIncrement: false,
            defaultValue: Sequelize.UUIDV4
        },
        created_date: {
            type: Sequelize.DATE
        }

    }, {
        underscored: true,
        timestamps: false,
    });

    return File;
};