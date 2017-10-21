const fs = require('fs');
var env;

var env_promise = new Promise( (success, failure) => {
  fs.stat(".env/.env.js", function(err, stat) {
    if(err == null) {
      env = require("./.env/.env.js");
    } 
    else if(err.code == 'ENOENT') {
      env = {
        facebook_app_id:       process.env.facebook_app_id,
        facebook_app_secret:    process.env.facebook_app_secret,
        spotify_app_id:     process.env.spotify_app_id,
        spotify_app_secret:   process.env.spotify_app_secret,
        domain:         "localhost",
        firebase_key: process.env.firebase_key,
        firebase_domain: process.env.firebase_domain,
        firebase_url: process.env.firebase_url,
        firebase_project_id: process.env.firebase_project_id,
        firebase_bucket: process.env.firebase_bucket,
        firebase_messaging_id: process.env.firebase_messaging_id,
        firebase_user: process.env.firebase_user,
        firebase_pwd: process.env.firebase_pwd
      };
    }
    success(env);
  });
});

module.exports = env_promise;

