//Node Utils_______________________
const request = require('request');
var querystring = require('querystring');
const express = require('express');
const router = express.Router();
var env;
require("../env_util.js").then( (env_to_use) => {
	env = env_to_use;
});
var firebase_utils = require("../route_utils/firebase_utils.js");
var login_utils = require("../route_utils/login_utils.js");
var user_utils = require("../route_utils/user_utils.js");


var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

router.get('/send_to_spotify_for_login', function(req, res) {
	console.log("/send_to_spotify_for_login");
	var state = generateRandomString(16);
	res.cookie(stateKey, state);
	//application requests authorization
	var scope = 'user-read-playback-state streaming user-read-private playlist-read-collaborative user-read-email user-library-read user-read-recently-played user-top-read user-follow-read';
	res.redirect('https://accounts.spotify.com/authorize?' +
	querystring.stringify({
	  response_type: 'code',
	  client_id: env.spotify_app_id,
	  scope: scope,
	  redirect_uri: 'http://localhost:3000/api/spotify_login/spotify_redirect',
	  state: state
	}));
});

router.get('/spotify_redirect', function(req, res) {
	console.log("/spotify_redirect");
	if (!req.error && req.query.code) {
		login_utils.get_spotify_access_token(req.query.code, res);
	}
	else {
		res.redirect("http://" + env.front_end_domain + "?error=spotify_failed_to_redirect_to_us_with_data");
	}
});

router.get("/get_spotify_access_token", function(req, res) {
	console.log("/get_spotify_access_token");
	let code = req.query.code;
	login_utils.get_spotify_access_token(code, res);
});

router.get('/spotify_check_token', function(req, res) {
	console.log('/spotify_check_token');
	let token_pairs = req.query.access_refresh_pairs;
	
	let token_promise = new Promise( (resolve, refresh) => {
		login_utils.get_spotify_user(token_pairs, resolve, refresh);
	});

	token_promise.then( (user_from_spotify) => {
		if (user_from_spotify) {
			firebase_utils.get_user(user_from_spotify).then( (user) => {
				res.json(user);
			});
		}
		else {
			res.json(null);
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
						res.json(user);
					});
				}
				else {
					res.json(null);
				}
			});
		});
	});
});

module.exports = router;