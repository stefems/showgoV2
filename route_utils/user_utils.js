//Node Utils_______________________
const request = require('request');
var querystring = require('querystring');
var env;
require("../env_util.js").then( (env_to_use) => {
	env = env_to_use;
});

let export_me = {
	
	update_user_artists: function(user, resolve) {
		user.lastUpdated = Date.now();
		
		var artist_promise_array = [this.get_saved_tracks_artists(user), this.get_saved_albums_artists(user), 
									this.get_following_artists(user), this.get_top_artists(user),
									this.get_recent_artists(user), this.get_artists_from_playlists(user)];

		Promise.all(artist_promise_array).then((artist_groupings) => {
			let artists_from_playlists = {};
			artist_groupings[5].forEach( (playlist) => {
				Object.assign(artists_from_playlists, playlist);
			});
			user.top_artists = artist_groupings[3];
			if (user.artists === '') {
				user.artists = {};
			}
			Object.assign(user.artists, artist_groupings[0], 
					   artist_groupings[1], artist_groupings[2], 
					   artist_groupings[3], artist_groupings[4],
					   artists_from_playlists);
			var firebase_utils = require("./firebase_utils.js");
			firebase_utils.save_user(user).then( (save_result) => {
				resolve(user);
			});			
		});
	},

	get_saved_tracks_artists: function (user) {

		function recursively_get_artists_from_saved_tracks(artists, resolve, next) {
			var authOptions = {
				url: next || 'https://api.spotify.com/v1/me/tracks?limit=50',
				headers: {
					'Authorization': "Bearer " + user.spotify_access_token
				},
				json: true
			};
			request.get(authOptions, function(error, response, body) {
				if (!error && response.statusCode === 200) {
					//PERFORMANCE: so this approach goes through all of their saved tracks. 
					// We'll already have a history of their saved tracks... 
					// we'll filter these out later but it'd save time to remove these now
					// to reduce time used for sending out these requests
					body.items.forEach( (song) => {
						song.track.artists.forEach( (artist) => {
							if (artist.id){
							artists[artist.id] = artist.name;
						}
						});
					});
					if (body.next) {
						recursively_get_artists_from_saved_tracks(artists, resolve, body.next);
					}
					else {
						resolve(artists);
					}
				}
				else {
					console.log(error || response);
					resolve(artists || null);
				}
			});
		}

		let get_saved_tracks_artists_promise = new Promise( (resolve) => {
			let artists = {};
			recursively_get_artists_from_saved_tracks(artists, resolve);
		});

		return get_saved_tracks_artists_promise;
	},
	
	get_saved_albums_artists: function(user) {

		function recursively_get_artists_from_saved_albums(artists, resolve, next) {
			var authOptions = {
				url: next || 'https://api.spotify.com/v1/me/albums?limit=50',
				headers: {
					'Authorization': "Bearer " + user.spotify_access_token
				},
				json: true
			};
			request.get(authOptions, function(error, response, body) {
				if (!error && response.statusCode === 200) {
					//PERFORMANCE: so this approach goes through all of their saved tracks. 
					// We'll already have a history of their saved tracks... 
					// we'll filter these out later but it'd save time to remove these now
					// to reduce time used for sending out these requests
					body.items.forEach( (album) => {
						album.album.artists.forEach( (artist) => {
							if (artist.id){
							artists[artist.id] = artist.name;
						}
						});
					});
					if (body.next) {
						recursively_get_artists_from_saved_albums(artists, resolve, body.next);
					}
					else {
						resolve(artists);
					}
				}
				else {
					console.log(error || response);
					resolve(artists || null);
				}
			});
		}


		let get_saved_albums_artists_promise = new Promise( (resolve) => {
			let artists = {};
			recursively_get_artists_from_saved_albums(artists, resolve);
		});

		return get_saved_albums_artists_promise;
	},
	
	get_following_artists: function(user) {
		function recursively_get_artists_from_following(artists, resolve, next) {
			var authOptions = {
				url: next || 'https://api.spotify.com/v1/me/following?limit=50&type=artist',
				headers: {
					'Authorization': "Bearer " + user.spotify_access_token
				},
				json: true
			};
			request.get(authOptions, function(error, response, body) {
				if (!error && response.statusCode === 200) {
					//PERFORMANCE: so this approach goes through all of their saved tracks. 
					// We'll already have a history of their saved tracks... 
					// we'll filter these out later but it'd save time to remove these now
					// to reduce time used for sending out these requests
					body.artists.items.forEach( (artist) => {
						if (artist.id){
							artists[artist.id] = artist.name;
						}
					});
					if (body.next) {
						recursively_get_artists_from_following(artists, resolve, body.next);
					}
					else {
						resolve(artists);
					}
				}
				else {
					console.log(error || response);
					resolve(artists || null);
				}
			});
		}


		let get_following_artists_promise = new Promise( (resolve) => {
			let artists = {};
			recursively_get_artists_from_following(artists, resolve);
		});

		return get_following_artists_promise;
	},
	
	get_playlists: function(user) {
		function recursively_get_playlists(playlist_urls, resolve, next) {
			var authOptions = {
				url: next || 'https://api.spotify.com/v1/me/playlists?limit=50',
				headers: {
					'Authorization': "Bearer " + user.spotify_access_token
				},
				json: true
			};
			request.get(authOptions, function(error, response, body) {
				if (!error && response.statusCode === 200) {
					//PERFORMANCE: so this approach goes through all of their saved tracks. 
					// We'll already have a history of their saved tracks... 
					// we'll filter these out later but it'd save time to remove these now
					// to reduce time used for sending out these requests
					body.items.forEach( (playlist) => {
						playlist_urls.push(playlist.tracks.href);
					});
					if (body.next) {
						recursively_get_playlists(playlist_urls, resolve, body.next);
					}
					else {
						resolve(playlist_urls);
					}
				}
				else {
					console.log(error || response);
					resolve(playlist_urls || null);
				}
			});
		}

		let get_playlists_promise = new Promise( (resolve) => {
			let playlist_urls = [];
			recursively_get_playlists(playlist_urls, resolve);
		});

		return get_playlists_promise;	
	},

	get_artists_from_playlists: function(user) {
		let artists_from_all_playlists_promise = new Promise( (resolve) => {
			this.get_playlists(user).then( (playlist_urls) => {
				let playlist_promises = [];
				playlist_urls.forEach( (url) => {
					let playlist_url = url;
					let playlist_artists_promise = new Promise( (send_artists) => {
						//recursive shit to get tracks and then artists
						this.get_artists_from_playlist(user, playlist_url).then( (artists) => {
							send_artists(artists);
						});
					});

					playlist_promises.push(playlist_artists_promise);
				});
				let artists_from_all_playlists = Promise.all(playlist_promises);
				resolve(artists_from_all_playlists);
			});
		});

		return artists_from_all_playlists_promise
	},
		
	get_artists_from_playlist: function(user, playlist_url) {
		function recursively_get_artists_from_playlist(artists, resolve, next) {
			var authOptions = {
				url: next || playlist_url,
				headers: {
					'Authorization': "Bearer " + user.spotify_access_token
				},
				json: true
			};
			request.get(authOptions, function(error, response, body) {
				if (!error && response.statusCode === 200) {
					//PERFORMANCE: so this approach goes through all of their saved tracks. 
					// We'll already have a history of their saved tracks... 
					// we'll filter these out later but it'd save time to remove these now
					// to reduce time used for sending out these requests
					body.items.forEach( (song) => {
						song.track.artists.forEach( (artist) => {
							if (artist.id){
								artists[artist.id] = artist.name;
							}
						});
					});
					if (body.next) {
						recursively_get_artists_from_playlist(artists, resolve, body.next);
					}
					else {
						resolve(artists);
					}
				}
				else {
					console.log(error || response);
					resolve(artists || null);
				}
			});
		}


		let get_artists_from_playlist_promise = new Promise( (resolve) => {
			let artists = {};
			recursively_get_artists_from_playlist(artists, resolve);
		});

		return get_artists_from_playlist_promise;	
	},

	get_top_artists: function(user) {
		function recursively_get_artists_from_top_artists(artists, resolve, next) {
			var authOptions = {
				url: next || 'https://api.spotify.com/v1/me/top/artists?limit=50',
				headers: {
					'Authorization': "Bearer " + user.spotify_access_token
				},
				json: true
			};
			request.get(authOptions, function(error, response, body) {
				if (!error && response.statusCode === 200) {
					//PERFORMANCE: so this approach goes through all of their saved tracks. 
					// We'll already have a history of their saved tracks... 
					// we'll filter these out later but it'd save time to remove these now
					// to reduce time used for sending out these requests
					body.items.forEach( (artist) => {
						if (artist.id){
								artists[artist.id] = artist.name;
							}
					});
					if (body.next) {
						recursively_get_artists_from_top_artists(artists, resolve, body.next);
					}
					else {
						resolve(artists);
					}
				}
				else {
					console.log(error || response);
					resolve(artists || null);
				}
			});
		}


		let get_top_artists_promise = new Promise( (resolve) => {
			let artists = {};
			recursively_get_artists_from_top_artists(artists, resolve);
		});

		return get_top_artists_promise;
	},
	
	get_recent_artists: function(user) {
		function recursively_get_recent_artists(artists, resolve, next) {
			var authOptions = {
				url: next || 'https://api.spotify.com/v1/me/player/recently-played?limit=50',
				headers: {
					'Authorization': "Bearer " + user.spotify_access_token
				},
				json: true
			};
			request.get(authOptions, function(error, response, body) {
				if (!error && response.statusCode === 200) {
					//PERFORMANCE: so this approach goes through all of their saved tracks. 
					// We'll already have a history of their saved tracks... 
					// we'll filter these out later but it'd save time to remove these now
					// to reduce time used for sending out these requests
					body.items.forEach( (song) => {
						song.track.artists.forEach( (artist) => {
							if (artist.id){
							artists[artist.id] = artist.name;
						}
						});
					});
					if (body.next) {
						recursively_get_artists_from_recents(artists, resolve, body.next);
					}
					else {
						resolve(artists);
					}
				}
				else {
					console.log(error || response);
					resolve(artists || null);
				}
			});
		}


		let get_recent_artists_promise = new Promise( (resolve) => {
			let artists = {};
			recursively_get_recent_artists(artists, resolve);
		});

		return get_recent_artists_promise;
	},

	needs_artist_update: function(user) {
		// return true;
		if (!user.lastUpdated) {
			return true;
		}
		else if (Math.floor((user.lastUpdated - Date.now()) / (1000*60*60*24)) < -1) {
			return true;
		}
	},

	check_user_artist_update: function(user) {
		let check_user_artist_update_promise = new Promise( (resolve) => {
			if (this.needs_artist_update(user)) {
				console.log("  User needs artist update.");
				this.update_user_artists(user, resolve);
			}
			else {
				console.log("  User doesn't need artist update.");
				resolve(user);
			}
		});

		return check_user_artist_update_promise;
	}

};

module.exports = export_me;