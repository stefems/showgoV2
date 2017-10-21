check_for_logged_in();

function check_for_logged_in() {
	console.log("check_for_logged_in()");
	let params = (new URL(document.location)).searchParams;
	if ( params.get("access_token") || localStorage.getItem("showgo_user") !== "undefined" ) {
		let tokens = [params.get("access_token"), localStorage.getItem("showgo_user")];
	    $.ajax({
			url: "/api/spotify_login/spotify_check_token",
			data: {tokens: tokens},
			success: function(response) {
				localStorage.setItem("showgo_user", response.spotify_access_token);
				logged_in(response);
			},
			error: function(error) {
				console.log(error);
				splash();
			}
		});
	}
	else {
		splash();
	}
}

function logged_in(user) {
	$(document).ready( () => {
		$(".loading").css("display", "none");
		$(".logged_in").css("display", "block");
		$(".logged_in").html(user.display_name);
	});
}

function splash() {
	$(document).ready( () => {
		splash();
		$(".loading").css("display", "none");
		$(".splash").css("display", "block");
	});
}

/*

var app = angular.module('myApp', []);

app.controller('myCtrl', function($scope, $http) {



});
*/