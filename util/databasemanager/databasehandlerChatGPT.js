const mongoose = require('mongoose');

// Define a Mongoose schema and model
const chatGPTMessages = new mongoose.Schema({
	userId: {
		type: String,
		required: true,
	},
	messages: [
		{
			role: {
				type: String,
				required: true,
			},
			content: {
				type: String,
				required: true,
			},
		},
	],
});

const UserChat = mongoose.model('UserChat', chatGPTMessages);

// Use the User model to interact with the database
async function saveUser(userId, messages) {
	let user = await UserChat.findOne({ userId: userId });
	if (!user) {
		user = new UserChat({
			userId: userId,
			messages: messages.map(({ role, content }) => ({ role, content })),
		});
		await user.save();
	}
	else {
		if (user.messages.length > 5) {
			user.messages.splice(0, 1);
		}
		user.messages.push(...messages);
		await user.save();
	}
}

async function getUserMessages(userId) {
	let user = await UserChat.findOne({ userId: userId });

	if (!user) {
		user = new UserChat({
			userId: userId,
			messages: [],
		});
		await user.save();
		return [];
	}
	return user.messages.slice(-4).map(message => {
		return { role: message.role, content: message.content };
	});
}


module.exports = {
	saveUser,
	getUserMessages,
};
