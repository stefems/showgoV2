//Node Utils_______________________
const request = require('request');
var querystring = require('querystring');
var env;
require("../env_util.js").then( (env_to_use) => {
	env = env_to_use;
});
var firebase_utils = require("../route_utils/firebase_utils.js");

module.exports = {

	
	update_user_artists: function(user, resolve) {
		user.lastUpdated = Date.now();
		//PERFORMANCE: this code will wait for each artist list to be generated and then all of them will
		// 			   be added to the user (with checks to ensure they don't need to be in the list.
		var artist_promise_array = [this.get_saved_tracks_artists(user)];//, get_saved_albums_artists(user), get_recent_artists(user)];

		Promise.all(artist_promise_array).then((artists) => {
			console.log(artists);
			resolve(user);
			// //PERFORMANCE: the artist sources are likely to have duplicates
			// artists.forEach( (artists_source) => {
			// 	artists_source.forEach( (artist) => {
			// 		store_artist(user, artist);
			// 	});
			// });
			//SAVE THAT SHIT
		});


		
			//stop cursoring when added_at
		// /v1/me/albums get saved albums
			//stop cursoring when added_at
		// /v1/me/following get artists following
			//don't see an order to it, might be time-consuming to parse and compare. might want instead during the song selection process to check if they're here.
		// /v1/me/playlists get playlists (created or following)
			//might have lengthy cursoring
		// v1/me/top/artists||tracks get their top artists and tracks
		// /v1/me/player/recently-played get recently played tracks
			//use played_at to stop cursoring
	},
	get_saved_tracks_artists: function (user) {
		let get_saved_tracks_artists_promise = new Promise( (resolve) => {
			var authOptions = {
				url: 'https://api.spotify.com/v1/me/tracks',
				headers: {
					'Authorization': "Bearer " + user.spotify_access_token
				},
				json: true
			};
			request.get(authOptions, function(error, response, body) {
				if (!error && response.statusCode === 200) {
					// 
					resolve(body.items[0].track.artists[0].name);
				}
				else {
					console.log(error || response);
				}
			});
		});

		return get_saved_tracks_artists_promise;
	},
	/*
	get_saved_albums_artists: function(user) {

		return new Promise( (resolve) => {

			var artists = [];
			fetch_saved_albums(true);

			function fetch_saved_albums(continue_cursoring){

				if (continue_cursoring) {

					var authOptions = {
						url: 'https://api.spotify.com/v1/me/albums',
						headers: {
						'Authorization': "Bearer " + user_id.spotify_access_token
					},
						json: true
					};
					request.get(authOptions, function(error, response, body) {
						if (!error && body) {
							var albums = body.albums;
							albums.forEach( (album) => {
								if (album.added_at < user.update_time) {
									var artist = { name: artist_name, id:  album.artist_id, genres: album.artist_genres};
									artists.push(artist);
								}
								else {
									continue_cursoring = false;
									//HOW TO BREAK FROM FOR EACH?
									break;
								}
							});
						}
						else {
							continue_cursoring = false;
						}
						fetch_saved_albums(continue_cursoring);
					});
				}
				else {
					resolve(artists);
				}
			}
		});
	},
	get_followers_artists: function() {
		//RETURN PROMISE
		var authOptions = {
			url: 'https://api.spotify.com/v1/me/tracks',
			headers: {
			'Authorization': "Bearer " + user_id.spotify_access_token
		},
			json: true
		};
		request.get(authOptions, function(error, response, body) {
		});
	},
	get_playlists_artists: function() {
		//RETURN PROMISE
		var authOptions = {
			url: 'https://api.spotify.com/v1/me/tracks',
			headers: {
			'Authorization': "Bearer " + user_id.spotify_access_token
		},
			json: true
		};
		request.get(authOptions, function(error, response, body) {
		});
	},
	get_top_artists: function() {
		//RETURN PROMISE
		var authOptions = {
			url: 'https://api.spotify.com/v1/me/tracks',
			headers: {
			'Authorization': "Bearer " + user_id.spotify_access_token
		},
			json: true
		};
		request.get(authOptions, function(error, response, body) {
		});
	},
	get_recent_artists: function() {
		//RETURN PROMISE
		var authOptions = {
			url: 'https://api.spotify.com/v1/me/tracks',
			headers: {
			'Authorization': "Bearer " + user_id.spotify_access_token
		},
			json: true
		};
		request.get(authOptions, function(error, response, body) {
		});
	},
	store_artist: function(user, artist) {
		//hashing function to find bucket
		//iterate through bucket for artist
		//push if not found
	},
	*/
	needs_artist_update: function(user) {
		return true;

		//return Math.floor((user.lastUpdated - Date.now()) / (1000*60*60*24)) < -1;
	},

	check_user_artist_update: function(user) {
		let check_user_artist_update_promise = new Promise( (resolve) => {
			if (this.needs_artist_update(user)) {
				console.log("user needs artist update");
				this.update_user_artists(user, resolve);
			}
			else {
				console.log("user doesn't need artist update");
				resolve(user);
			}
		});

		return check_user_artist_update_promise;
	}

};