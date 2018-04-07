const fs = require('fs');
var env;

var env_promise = new Promise( (success, failure) => {
  fs.stat(".env/.env.js", function(err, stat) {
    if(err == null) {
      env = require("./.env/.env.js");
    } 
    else if(err.code == 'ENOENT') {
      env = {
        spotify_app_id:     process.env.spotify_app_id,
        spotify_app_secret:   process.env.spotify_app_secret,
		front_end_domain: process.env.front_end_domain,
		api_domain: process.env.api_domain
      };
    }
    success(env);
  });
});

module.exports = env_promise;

