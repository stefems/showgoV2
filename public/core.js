 var app = angular.module('showgo', []);

function check_for_logged_in() {
	let params = (new URL(document.location)).searchParams;
	if (localStorage.getItem("showgo_user")) {

		let code = localStorage.getItem("showgo_user");
		//send code to backend to find this user
		$http({
			method: "GET",
			url: "/api/spotify_login/get_spotify_access_token",
			params: { code: code}
		})
	    .then(function(response) {
	        console.log(response);
	    });
		//set the state for this user
	}
}
