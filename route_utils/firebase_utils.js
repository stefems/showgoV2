var firebase = require("firebase");
const fs = require('fs');

var env, database;
require("../env_util.js").then( (env_to_use) => {
	env = env_to_use;
	init_firebase();
});

// TODO: move the client id and secret for the spotify application into env
// TODO: make the domain depend on the env

function init_firebase() {
	var config = {
	    apiKey: env.firebase_key,
	    authDomain: env.firebase_domain,
	    databaseURL: env.firebase_url,
	    projectId: env.firebase_project_id,
	    storageBucket: env.firebase_bucket,
	    messagingSenderId: env.firebase_messaging_id
	};
	firebase.initializeApp(config);
	database = firebase.database();
	firebase.auth().signInWithEmailAndPassword(env.firebase_user, env.firebase_pwd).catch(function(error) {
		// Handle Errors here.
		console.log(error.code);
		console.log(error.message);
	});
}

function get_user(spotify_user) {
	var get_user_promise = new Promise( (resolve) => {
		let dbRef = "users/" + spotify_user.id;
		database.ref(dbRef).once("value", function(snapshot) {
			if (snapshot.val()) {
				console.log("user exists");
				resolve(snapshot.val());
			}
			else {
				// NEXT --> We just added error messages for the db shit, figure
				//  out why the user isn't being created. Last log message was
				//  below.
				console.log("user does not exist.");
				create_user(spotify_user).then( (created_successfully) => {
					if (created_successfully) {
						get_user(spotify_user).then( (user) => {
							resolve(user);
						});
					}
					else {
						console.log("creation of user failed");
						resolve(null);
					}
				})
				.catch( (error) => {
					console.log("error creating the user in the db");
					console.log(error);
					resolve(null)
				});
				
			}
		}).catch ( (error) => {
			console.log("error looking in the db for the user");
			console.log(error);
			resolve(null);
		});
	});
	return get_user_promise;	
}

function create_user(spotify_user) {
	let create_user_promise = new Promise( (resolve) => {
		spotify_user.songkick_home_location_id = "";
		spotify_user.shows_saved = [];
		let dbRef = "users/" + spotify_user.id;
		database.ref(dbRef).set(spotify_user, (error) => {
			if (error) {
				console.log("failed to set the user in the db.");
				console.log(error);
				resolve(false);
			}
			else {
				resolve(true);
			}
		})
	});

	return create_user_promise;
}

module.exports = {
	get_user: get_user
};