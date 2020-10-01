# CSYE 6225 - Fall 2020

### Technologies

1. Nodejs
2. Express.js
3. MySQL
4. Sequelize ORM
5. Mocha, Chai and Postman for testing

### Build Instructions

1. Pre-requisites - Install Node.js, MySQL and npm
2. Using git clone, download the repository to your directory.
```bash
git clone git@github.com:vangam-fall2020/webapp.git
```

3. Navigate to folder webapp and run the below command to start server
```bash
npm run start
```

4. Access the server at http://localhost:8080/

5. API calls in Postman:

..* GET request: localhost:8080/v1/user/self
..* POST request: localhost:8080/v1/user
..* PUT request: localhost:8080/v1/user/self

### Running Tests

Run below command to executes test cases

```bash
npm test webapp/test/user.test.js
```

### License
[MIT](https://choosealicense.com/licenses/mit/)