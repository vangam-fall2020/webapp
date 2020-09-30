const validator = require('password-validator');

var schema = new validator();

schema.is().min(8);
schema.is().max(20);
schema.has().uppercase();
schema.has().lowercase();
schema.has().digits(1);
schema.has().not().spaces();
schema.has().symbols();
schema.is().not().oneOf(['Passw0rd', 'Password123']);

module.exports = schema;