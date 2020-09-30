// Setting env variable to test
process.env.NODE_ENV = "test"
const db = require("../models");
const User = db.users;

//dev dependencies
const chai = require('chai');
var expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
var should = require('should');
const supertest = require("supertest");
const server = supertest.agent("http://localhost:8080");
const app = require('../../server');
var userAuth = require('../services/authentication');
var route = require('../routes/userRoute');

//  ********** POST  **********
describe('/POST user', () => {
    it('Creting new user with status code 201', (done) => {
        const user = {
            first_name: " Jane new 8",
            last_name: "Doe1 new 8",
            password: "Csyenetworks@6225",
            email_address: "janenew8.doe@example.com"
        };
        server
        .post('/v1/user')
        .send(user)
        .expect("Content-type",/json/)
        .end((err, res) => {
            expect(res.body).to.contain.property('id');
            expect(res.body).to.contain.property('first_name');
            expect(res.body).to.contain.property('last_name');
            expect(res.body).to.contain.property('email_address');
            expect(res.body).to.contain.property('account_created');
            expect(res.body).to.contain.property('account_updated');
            res.status.should.equal(201);
            done();
        });
    });
    
    it('Invalid User entry test with status code 400',(done) => {
        const user = {
            first_name: " Jane new 7",
            last_name: "Doe1 new 7",
            password: "Csyenetworks@6225",
            email_address: "janenew7.doe.example.com"
        };
        server.post('/v1/user')
        .send(user)
        .expect("Content-type",/json/)
        .end((err,res)=>{
            res.status.should.equal(400);
            done();
        });
    });
});

//  ********** GET  **********

describe('/GET user', function() {
    it('User unauthorized test - 401', function(done) {
        const user = {
            username: "janenew6.doe@example.com",
            password: "Csyenetworks@6225"
        }
        server.get('/v1/user/self')
        .send(user)
        .expect("Content-type",/json/)
        .expect(401)
        .end((err, res) => {
            expect(res.body.message).to.equal('Unauthorized');
            done();
        });
    });

    it("Invalid API request with first name in request",function(done){
        server
        .get('/v1/user/self/Jane new 6')
        .expect("Content-type",/json/)
        .expect(404)
        .end(function(err,res){
            done();
        });
    });

});


//  ********** PUT  **********

describe('/PUT user', () => {
    it("Invalid input to update- status code 400", (done) => {
        server
         .put('/v1/user/self', userAuth.basicAuth)
         .expect("Content-type",/json/)
        .expect(400)
        .end(function(err,res){
            expect(res.body.message).to.equal('Bad Request');
            done();
        });
    });

    it('User Unauthorized error - 401 ',(done) => {
        const user = {
            password: "Csyenetworks@6225",
            email_address: "janenew6.doe.example.com"
        }
        server.put('/v1/user/self',userAuth.basicAuth)
        .send(user)    
        .expect("Content-type",/json/)
        .expect(401)
        .end(function(err,res){
            expect(res.body.message).to.equal('Unauthorized');
            done();
        });
    });

});