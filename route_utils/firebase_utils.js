// var firebase = require("firebase");
var admin = require("firebase-admin");
var serviceAccount = require("../showgov2-firebase-adminsdk-aw55x-749dcb4123.json");

const fs = require('fs');
const request = require('request');


var env, database;
var user_utils = require("../route_utils/user_utils.js");

// require("../env_util.js").then( (env_to_use) => {
// 	env = env_to_use;
// 	init_firebase();
// });

init_firebase();

function init_firebase() {
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
		databaseURL: "https://showgov2.firebaseio.com"
	  });
}

function store_artists(artist_list_object) {
	console.log("\nUpdating Artist Info")
	let new_artists = get_new_artists(artist_list_object);
	Promise.all(new_artists).then( (artists) => {
		get_spotify_info(artists);
	});

	function get_new_artists(artist_list_object) {
		let all_promises = [];

		Object.keys(artist_list_object).forEach(function(key, index) {
		    let dbRef = "artists/" + key;
		    let artist_promise = new Promise ( (resolve) => {
	    	    database.ref(dbRef).once("value", function(snapshot) {
	    			if (!snapshot.val()) {
	    				let artist = {};
	    				artist.id = key;
	    				artist.name = artist_list_object[key];
	    				resolve(artist);
	    			}
	    			else {
	    				resolve();
	    			}
	    		});
		    });
		    all_promises.push(artist_promise);
		});
		return all_promises;
	}
	
	/*
		for each
			if 50, send a request with the string, reset the counter, incremement the delay, reset the sent bool
	*/
	function get_spotify_info(new_artists) {
		let fifty_counter = 0;
		let artist_string = '';
		let delay_time = 100;
		new_artists.forEach( (artist) => {
			if (fifty_counter === 50) {
				get_spotify_info_from_artists(artist_string, delay_time);
				delay_time += 100;
				artist_string = '';
				fifty_counter = 0;
			}
			else {
				if (fifty_counter !== 0) {
					artist_string += ',' + artist.id;
				}
				else {
					artist_string = "?ids=" + artist.id;
				}
				fifty_counter++;
			}
		});

		function get_spotify_info_from_artists(artist_string, delay_time) {
			setTimeout(() => {
				var authOptions = {
			      url: 'https://accounts.spotify.com/api/artists' + artist_string,
			      headers: {
			        'Authorization': 'Basic ' + (new Buffer(env.spotify_app_id + ':' + env.spotify_app_secret).toString('base64'))
			      },
			      json: true
			    };
				request.get(authOptions, function(error, response, body) {
			 		if (!error && response.statusCode === 200 && response.statusCode != 400) {
			 			console.log(body);
			 			console.log('\n');
			 		}
			 		else {
			 			console.log(error);
			 			console.log('\n');
			 		}
			 	});
			 }, delay_time);
		}

	}
	
		

	//we need information about the artists in new_artists before saving it in our db, we'll get that info from spotify
	//what is the route for getting that information
	

	// //counter to 50
	// //for each id
	// 	//increment counter
	// 	//if 50, send away and reset counter

	// 	//spotify lookup
	
		 			
	// 	//last fm lookup
	// 	//save to firebase
	// });
}

function save_user(user) {
	let save_user_promise = new Promise( (resolve) => {
		let dbRef = "users/" + user.id;
		database.ref(dbRef).set(user, (error) => {
			if (error) {
				console.log("  Failed to save the user in the db.");
				console.log(error);
				resolve(false);
			}
			else {
				console.log("  Saved " + user.display_name + ".");
				setTimeout( () => {store_artists(user.artists)}, 100);
				resolve(true);				
			}
		});
	});

	return save_user_promise;
}

function get_user(spotify_user) {
	var get_user_promise = new Promise( (resolve) => {
		let dbRef = "users/" + spotify_user.id;
		database.ref().child(dbRef).once("value", function(snapshot) {
			if (snapshot.val()) {
				console.log("  User found.");
				database.ref().child(dbRef).update({spotify_access_token: spotify_user.spotify_access_token}).then( () => {
					console.log("  Updated user's token.");
					let user = snapshot.val();
					user.spotify_access_token = spotify_user.spotify_access_token;
					user_utils.check_user_artist_update(user).then( (updated_user) => {
						resolve(updated_user);
					});
				})
				.catch( (error) => {
					console.log("  Error when getting user snapshot.");
					resolve(null);
				});
							
			}
			else {
				console.log("  User not found.");
				create_user(spotify_user).then( (created_successfully) => {
					if (created_successfully) {
						get_user(spotify_user).then( (user) => {
							resolve(user);
						});
					}
					else {
						console.log("  Creation of user failed.");
						resolve(null);
					}
				})
				.catch( (error) => {
					console.log("  Error creating the user in the db.");
					console.log(error);
					resolve(null)
				});
			}
		})
	});
	return get_user_promise;	
}

function update_user_access_token(user) {

}

function create_user(spotify_user) {
	let create_user_promise = new Promise( (resolve) => {
		spotify_user.songkick_home_location_id = "";
		spotify_user.artists = '';
		spotify_user.top_artists = '';
		//spotify_user.shows_saved = [];
		let dbRef = "users/" + spotify_user.id;
		database.ref(dbRef).set(spotify_user, (error) => {
			if (error) {
				console.log("  Failed to create new user.");
				console.log(error);
				resolve(false);
			}
			else {
				console.log("  Created new user.");
				resolve(true);
			}
		});
	});

	return create_user_promise;
}

module.exports = {
	get_user: get_user,
	save_user: save_user
};