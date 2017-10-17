var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
	display_name: String,
	spotify_token: String,
	saved_songkick_id: String,
	shows_saved: [String]
});

var User = mongoose.model("User", UserSchema);
module.exports = User;