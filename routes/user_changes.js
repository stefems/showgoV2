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


router.get('/user', function(req, res) {
	console.log("GET /user");
	let token_pairs = JSON.parse(req.query.access_refresh_pairs);

	let user_promise = new Promise( (resolve, refresh) => {
		console.log("  Getting user from Spotify login.");
		login_utils.get_spotify_user(token_pairs, resolve, refresh);
	});

	user_promise.then( (user_from_spotify) => {
		if (user_from_spotify) {
			console.log("  Spotify gave us a user.");
			firebase_utils.get_user(user_from_spotify).then( (user) => {
				console.log("  Sending user.\n\n");
				res.json(user);
			});
		}
		else {
			console.log("  Sending error.\n\n");
			res.status(500).send({ error: "  We failed to retrieve the user." });
		}		
		
	})
	.catch( (refresh_token_to_use) => {
		login_utils.use_refresh_token(refresh_token_to_use).then( (access_token) => {
			let token_promise = new Promise( (resolve, refresh) => {
				login_utils.get_spotify_user([{access_token: access_token}], resolve, refresh);
			});

			token_promise.then( (user_from_spotify) => {
				if (user_from_spotify) {
					firebase_utils.get_user(user_from_spotify).then( (user) => {
						console.log("  Sending user.\n\n");
						res.json(user);
					});
				}
				else {
					console.log("  Sending error.\n\n");
					res.status(500).send({ error: "we failed to retrieve the user." });
				}
			});
		});
	});
});

router.put('/user/artist')

module.exports = router;

/*
	GET 	user/artists			list artists
	GET 	user/artists/{id}		get artist
	GET 	user/artists/random		get random artist
	DELETE	user/artists/{id}		remove artist
	POST 	user/artists			add to artists
	GET 	user/artists/roots 		get root artists
	PUT 	user/artists			update artist list

	utils:
		update user artists 



	artist { spotify_id: '', tags/genres: [], root: true/false }
	user   {name: '', artists: [], last_spotify_update}
*/