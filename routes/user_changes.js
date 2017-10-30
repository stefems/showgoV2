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
var firebase_utils = require("../route_utils/firebase_utils.js");

router.post('/update_location', function(req, res) {
	let access_token = req.body.access_token;
	let lat_long = req.body.location;
	let url = "http://api.songkick.com/api/3.0/search/locations.json?location=geo:{lat,lng}&apikey={your_api_key}";
	
	request(url, (error, response, body) => {
		if (!error && response.statusCode === 200) {
			if (JSON.parse(body).resultsPage.totalResults > 0) {
				let songkick_id = JSON.parse(body).resultsPage.results.location[0].metroArea.id;

			}
		}
	});
});

module.exports = router;