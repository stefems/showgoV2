// server.js

// set up ========================
var express  = require('express');
var app      = express();                               
var mongoose = require('mongoose');
var bodyParser = require('body-parser');                     
var spotify_login = require('./routes/spotify_login');

// configuration =================

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/showgo');

app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json


app.use('/api/spotify_login', spotify_login);

app.get('*', function(req, res) {
    res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
});

app.listen(3000);
console.log("App listening on port 3000");



