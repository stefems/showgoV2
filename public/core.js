let user = null;

check_for_logged_in();

function check_for_logged_in() {
	// console.log("check_for_logged_in()");
	let params = (new URL(document.location)).searchParams;
	let token_pairs = [];
	if ( params.get("access_token") && params.get("refresh_token") ) {
		token_pairs.push({ access_token: params.get("access_token"), refresh_token: params.get("refresh_token")});
	}
	if (localStorage.getItem("showgo_user") !== "undefined" && localStorage.getItem("showgo_user") !== null) {
		token_pairs.push({ access_token: JSON.parse(localStorage.getItem("showgo_user")).access_token, refresh_token: JSON.parse(localStorage.getItem("showgo_user")).refresh_token});
	}
	if (token_pairs.length !== 0) {
		$.ajax({
			url: "/api/spotify_login/spotify_check_token",
			data: {token_pairs: token_pairs},
			success: function(response) {
				if (response) {
					// console.log("logged in.");
					localStorage.setItem("showgo_user", JSON.stringify({access_token: response.spotify_access_token, refresh_token: response.spotify_refresh_token}));
					logged_in(response);
				}
				else {
					// console.log("not logged in.");
					localStorage.removeItem("showgo_user");
					splash();
				}
			},
			error: function(error) {
				console.log(error);
				splash();
			}
		});
	}
	else {
		// console.log("not logged in.");
		splash();
	}
}

function logged_in(user_passed_in) {
	user = user_passed_in;
	history.pushState(null, "", location.href.split("?")[0]);
	if (user.songkick_home_location_id === "") {
		update_user_location(user.spotify_access_token);
	}
	else {
		load_feed();
	}
}

function load_feed() {
	$(document).ready( () => {
		$(".loading").css("display", "none");
		$(".logged_in").css("display", "block");
		$(".logged_in").html(user.display_name);
	});
}

function splash() {
	user = null;
	$(document).ready( () => {
		$(".loading").css("display", "none");
		$(".splash").css("display", "block");
	});
}


function update_user_location(token) {
	if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition( (position) => {
        	let lat_long = { lat: position.coords.latitude, long: position.coords.longitude };
        	$.ajax({
				url: "/api/user_changes/update_location",
				type: "POST",
				data: {location: lat_long, access_token: token},
				success: function(response) {
					if (response) {
						console.log(response);
						load_feed();
					}
					else {
						console.log("failed to post the locaiton.");
						splash();
					}
				},
				error: function(error) {
					console.log(error);
					splash();
				}
			});
        });
    }
    else {
        x.innerHTML = "Geolocation is not supported by this browser.";
    }
}
/*

var app = angular.module('myApp', []);

app.controller('myCtrl', function($scope, $http) {



});
*/