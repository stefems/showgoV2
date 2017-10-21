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
	// console.log("/send_to_spotify_for_login");
	var state = generateRandomString(16);
	res.cookie(stateKey, state);
	//application requests authorization
	var scope = 'user-read-private user-read-email';
	res.redirect('https://accounts.spotify.com/authorize?' +
	querystring.stringify({
	  response_type: 'code',
	  client_id: env.spotify_app_id,
	  scope: scope,
	  redirect_uri: 'http://' + env.domain + '/api/spotify_login/spotify_redirect',
	  state: state
	}));
});

router.get('/spotify_redirect', function(req, res) {
	// console.log("/spotify_redirect");
	if (!req.error && req.query.code) {
		get_spotify_access_token(req.query.code, res);
	}
	else {
		res.redirect("http://" + env.domain + "?error=spotify_failed_to_redirect_to_us_with_data");
	}
});

router.get("/get_spotify_access_token", function(req, res) {
	// console.log("/get_spotify_access_token");
	let code = req.query.code;
	get_spotify_access_token(code, res);
});

router.get('/spotify_check_token', function(req, res) {
	console.log("/spotify_check_token");
	let tokens = req.query.tokens;
	
	let token_promise = new Promise( (resolve) => {
		get_spotify_user(tokens, resolve);
	});

	token_promise.then( (user_from_spotify) => {		
		firebase_utils.get_user(user_from_spotify).then( (user) => {
			res.json(user);
		});
	});
	
	function get_spotify_user(tokens, resolve) {
		if (tokens.length > 0) {
			console.log("attempting with token: " + tokens[0]);
			var authOptions = {
				url: 'https://api.spotify.com/v1/me',
				headers: {
				'Authorization': "Bearer " + tokens[0]
			},
				json: true
			};

			request.get(authOptions, function(error, response, body) {
				if (!error && response.statusCode === 200) {
					body.spotify_access_token = tokens[0];
					resolve(body);
				}
				else {
					tokens.splice(0, 1)
					get_spotify_user(tokens, resolve);
				}

			});
		}
		else {
			console.log("no more tokens to check");
			resolve(null);
		}
	}

});

function get_spotify_access_token(code, res) {
	// console.log("get_spotify_access_token()");
	var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: 'http://' + env.domain + '/api/spotify_login/spotify_redirect',
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(env.spotify_app_id + ':' + env.spotify_app_secret).toString('base64'))
      },
      json: true
    };
	request.post(authOptions, function(error, response, body) {
 		if (!error && response.statusCode === 200 && response.statusCode != 400) {
 			var access_token = body.access_token;
 			var refresh_token = body.refresh_token;
 			let url = 'http://' + env.domain + '?' + querystring.stringify({
	            access_token: access_token,
				refresh_token: refresh_token
	        });
			res.redirect(url);
		}
		else {
			console.log("error: " + error);
			res.redirect("http://" + env.domain + "?error=spotify_access_token_request_failed");
		}
	});
}


module.exports = router;