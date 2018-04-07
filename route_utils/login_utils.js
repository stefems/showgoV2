//Node Utils_______________________
const request = require('request');
var querystring = require('querystring');
var env;
require("../env_util.js").then( (env_to_use) => {
	env = env_to_use;
});
var firebase_utils = require("../route_utils/firebase_utils.js");

module.exports = {

	get_spotify_user: function(token_pairs, resolve, refresh) {
		if (token_pairs.length > 0) {
			var authOptions = {
				url: 'https://api.spotify.com/v1/me',
				headers: {
				'Authorization': "Bearer " + token_pairs[0].access_token
			},
				json: true
			};
			request.get(authOptions, (error, response, body) => {
				if (!error && response.statusCode === 200) {
					body.spotify_access_token = token_pairs[0].access_token;
					body.spotify_refresh_token = token_pairs[0].refresh_token;
					resolve(body);
				}
				else if (!error && response.statusCode === 401) {
					refresh(token_pairs[0].refresh_token);
				}
				else {
					token_pairs.splice(0, 1);

					this.get_spotify_user(token_pairs, resolve);
				}

			});
		}
		else {
			resolve(null);
		}
	},

	use_refresh_token: function(token, res_callback) {
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
	},

	get_spotify_access_token: function(code, res) {
		console.log("get_spotify_access_token()");

		var authOptions = {
		  url: 'https://accounts.spotify.com/api/token',
		  form: {
		    code: code,
		    redirect_uri: 'http://' + env.api_domain + '/api/spotify_login/spotify_redirect',
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
				let url = 'http://' + env.front_end_domain + '?' + querystring.stringify({
		            access_token: access_token,
					refresh_token: refresh_token
				});
				res.redirect(url);
			}
			else {
				console.log("error: " + error);
				res.redirect("http://" + env.front_end_domain + "?error=spotify_access_token_request_failed");
			}
		});
	}
};