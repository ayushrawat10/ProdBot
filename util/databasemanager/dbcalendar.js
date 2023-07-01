const mongoose = require('mongoose');
// const {  } = require('../../commands/calendar/create_event');

const credentialSchema = new mongoose.Schema({
	userId: String,
	credentials: Object,
});
const tokenSchema = new mongoose.Schema({
	userId: String,
	tokens: Object,
});

const Credential = mongoose.model('Credential', credentialSchema);
const Token = mongoose.model('Token', tokenSchema);

async function saveToken(userId, tokens) {
	try {
		const doc = await Token.findOneAndUpdate(
			{ userId },
			{ tokens },
			{ upsert: true, new: true },
		);
		console.log('Token saved successfully:');
		return doc;
	}
	catch (err) {
		console.error('Error saving token:', err);
	}
}

async function getToken(userId) {
	try {
		const token = await Token.findOne({ userId });
		return token;
	}
	catch (err) {
		return null;
	}
}
module.exports = {
	saveToken,
	getToken,
};