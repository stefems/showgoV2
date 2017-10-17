var mongoose = require('mongoose');

var ShowSchema = new mongoose.Schema({
	title: String,
	songkick_id: String,
	facebook_id: String,
	bands: [String]
});

var Show = mongoose.model("Show", ShowSchema);
module.exports = Show;