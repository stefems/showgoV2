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
	console.log("/send_to_spotify_for_login");
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
	console.log("/spotify_redirect");
	if (!req.error && req.query.code) {
		get_spotify_access_token(req.query.code, res);
	}
	else {
		res.redirect("http://" + env.domain + "?error=spotify_failed_to_redirect_to_us_with_data");
	}
});

router.get("/get_spotify_access_token", function(req, res) {
	console.log("/get_spotify_access_token");
	let code = req.query.code;
	get_spotify_access_token(code, res);
});

router.get('/spotify_check_token', function(req, res) {
	console.log("/spotify_check_token");
	let token_pairs = req.query.token_pairs;
	
	let token_promise = new Promise( (resolve, refresh) => {
		get_spotify_user(token_pairs, resolve, refresh);
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
		use_refresh_token(refresh_token_to_use).then( (access_token) => {
			let token_promise = new Promise( (resolve, refresh) => {
				get_spotify_user([{access_token: access_token}], resolve, refresh);
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
	
	function get_spotify_user(token_pairs, resolve, refresh) {
		if (token_pairs.length > 0) {
			var authOptions = {
				url: 'https://api.spotify.com/v1/me',
				headers: {
				'Authorization': "Bearer " + token_pairs[0].access_token
			},
				json: true
			};
			request.get(authOptions, function(error, response, body) {
				if (!error && response.statusCode === 200) {
					body.spotify_access_token = token_pairs[0].access_token;
					body.spotify_refresh_token = token_pairs[0].refresh_token;
					resolve(body);
				}
				else if (!error && response.statusCode === 401) {
					refresh(token_pairs[0].refresh_token);
				}
				else {
					token_pairs.splice(0, 1)
					get_spotify_user(token_pairs, resolve);
				}

			});
		}
		else {
			console.log("no more token_pairs to check");
			resolve(null);
		}
	}

});

function use_refresh_token(token, res_callback) {
	let refresh_token_promise = new Promise ( (resolve) => {
		var authOptions = {
	      url: 'https://accounts.spotify.com/api/token',
	      form: {
	      	grant_type: 'refresh_token',
	        refresh_token: token
	      },
	      headers: {
	        'Authorization': 'Basic ' + (new Buffer(env.spotify_app_id + ':' + env.spotify_app_secret).toString('base64'))
	      },
	      json: true
	    };
		request.post(authOptions, function(error, response, body) {
	 		if (!error && response.statusCode === 200 && response.statusCode != 400) {
	 			resolve(body.access_token);
			}
			else {
				console.log("error: " + error);

			}
		});
	});

	return refresh_token_promise;
}

function get_spotify_access_token(code, res) {
	console.log("get_spotify_access_token()");

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