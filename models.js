var mongoose = require('mongoose');

var stickySchema = new mongoose.Schema({
	text: { type: String },
	x: { type: Number },
	y: { type: Number },
	textColor: { type: String },
	paperColor: { type: String },
	pinColor: { type: String },
	rotation: { type: Number },
	lastModified: { type: Date, default: Date.now }
});
stickySchema.virtual('id').get(function() {
	return this._id;
});
var Sticky = mongoose.model('Sticky', stickySchema);

var stickerSchema = new mongoose.Schema({
	type: { type: String },
	stickyId: { type: mongoose.Schema.Types.ObjectId },
	x: { type: Number },
	y: { type: Number },
	rotation: { type: Number },
	lastModified: { type: Date, default: Date.now }
});
stickerSchema.virtual('id').get(function() {
	return this._id;
});
var Sticker = mongoose.model('Sticker', stickerSchema);

exports.Sticky = Sticky;
exports.Sticker = Sticker;