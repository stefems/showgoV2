//Node Utils_______________________
const request = require('request');
const jsdom = require('jsdom');
var querystring = require('querystring');
const { JSDOM } = jsdom;
const fs = require('fs');
const express = require('express');
const router = express.Router();
var env;
require("../env_util.js").then( (env_to_use) => {
	env = env_to_use;
});
var login_utils = require("../route_utils/login_utils.js");
var firebase_utils = require("../route_utils/firebase_utils.js");

router.get('/artists/random', function(req, res) {
	console.log("/artists/random");
	res.json("test");
});