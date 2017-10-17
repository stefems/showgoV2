//Node Utils_______________________
const request = require('request');
const jsdom = require('jsdom');
var querystring = require('querystring');
const { JSDOM } = jsdom;
const fs = require('fs');
const express = require('express');
const router = express.Router();
var env;
// TODO: move the client id and secret for the spotify application into env
// TODO: make the domain depend on the env
fs.stat("../.env/.env.js", function(err, stat) {
  if(err == null) {
    env = require("../.env/.env.js");
  } 
  else if(err.code == 'ENOENT') {
    env = {
      facebookAppId: process.env.facebookAppId,
      facebookAppSecret: process.env.facebookAppSecret,
      googleKey: process.env.googleKey,
      googleId: process.env.googleId,
      soundcloudSecret: process.env.soundcloudSecret
    };
  }
});

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
	  client_id: "a8e34050570947dfb788ed4bfd87616d",
	  scope: scope,
	  redirect_uri: 'http://45.55.156.114:3000/api/spotify_login/spotify_redirect',
	  state: state
	}));
});

router.get('/spotify_redirect', function(req, res) {
	console.log("/spotify_redirect");
	if (!req.error && req.query.code) {
		get_spotify_access_token(req.query.code, res);
	}
	else {
		res.redirect("http://45.55.156.114:3000" +
			querystring.stringify({
        	error: 'login failed'
		}));
	}
});

router.get("/get_spotify_access_token", function(req, res) {
	console.log("/get_spotify_access_token");
	let code = req.query.code;
	get_spotify_access_token(code, res);
});

router.get('/spotify_check_token/:token', function(req, res) {
	console.log("/spotify_check_token");
	let token = req.params.token;
	var authOptions = {
      url: 'https://api.spotify.com/v1/me',
      headers: {
        'Authorization': "Bearer " + token
      },
      json: true
    };

	request.get(authOptions, function(error, response, body) {
		if (!error && response.statusCode === 200) {
			// console.log(body);
			res.json("true");
		}
		else {
			// console.log(error || body);
			res.json("false");
		}

	});
});

function get_spotify_access_token(code, res) {
	var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: 'http://45.55.156.114:3000/api/spotify_login/spotify_redirect',
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer("a8e34050570947dfb788ed4bfd87616d" + ':' + "6b9cd1a845e74fbd8e2a0dbecb2f2e52").toString('base64'))
      },
      json: true
    };

	request.post(authOptions, function(error, response, body) {
 		if (!error && response.statusCode === 200) {
 			var access_token = body.access_token;
 			var refresh_token = body.refresh_token;
 			let url = 'http://45.55.156.114:3000?' + querystring.stringify({
	            access_token: access_token,
				refresh_token: refresh_token
	        });
	        
			res.redirect(url);
			// TODO --> use this access/refresh token to get the user and log them
			//          into showgo.
		}
		else {
			console.log(error);
			res.redirect("http://45.55.156.114:3000" +
				querystring.stringify({
            	error: 'invalid_token'
			}));
		}
	});
}


module.exports = router;