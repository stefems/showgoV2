//Node Utils_______________________
const request = require('request');
const jsdom = require('jsdom');
var querystring = require('querystring');
const { JSDOM } = jsdom;
const fs = require('fs');
const express = require('express');
const router = express.Router();
var env;

// TODO: make the domain depend on the env
fs.stat("../.env/.env.js", function(err, stat) {
  if(err == null) {
    env = require("../.env/.env.js");
  } 
  else if(err.code == 'ENOENT') {
    env = {
      facebookAppId: process.env.facebookAppId,
      facebookAppSecret: process.env.facebookAppSecret,
      googleKey: process.env.googleKey,
      googleId: process.env.googleId,
      soundcloudSecret: process.env.soundcloudSecret
    };
  }
});

router.get('/get_spotify_user_from_code', function(req, res) {
  //send request to spotify with this data to get the user info from the code
  var authOptions = {
      url: 'https://api.spotify.com/v1/me',
      headers: {
        'Authorization': 'Basic ' + (new Buffer("a8e34050570947dfb788ed4bfd87616d" + ':' + "6b9cd1a845e74fbd8e2a0dbecb2f2e52").toString('base64'))
      },
      json: true
    };

  request.post(authOptions, function(error, response, body) {
  });

});